/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { formatDate, formStatus } from "../app/format.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When i click on the eye icon", () => {
      test("Then it should open a popup displaying the bill file", () => {
        document.body.innerHTML = BillsUI({ data: [bills[0]] });

        const onNavigate = (path) =>
          (document.body.innerHTML = ROUTES({ pathname: path }));
        const billsContainer = billsContainerFunction(null, onNavigate);

        $.fn.modal = jest.fn();

        const eyeIcon = screen.getByTestId("icon-eye");
        const handleClickIconEye = jest.fn(() =>
          billsContainer.handleClickIconEye(eyeIcon)
        );
        eyeIcon.addEventListener("click", handleClickIconEye);

        userEvent.click(eyeIcon);
        expect(handleClickIconEye).toHaveBeenCalled();

        const modal = screen.getByTestId("modalFileEmployee");
        expect(modale).toBeTruthy();
      });
    });

    describe("When i click on the new bill button", () => {
      test("Then it should open a new form", async () => {
        document.body.innerHTML = BillsUI({ data: bills });

        const onNavigate = (path) =>
          (document.body.innerHTML = ROUTES({ pathname: path }));
        const billsContainer = billsContainerFunction(null, onNavigate);
        document.body.innerHTML = BillsUI({ data: bills });

        const newBillButton = screen.getByTestId("btn-new-bill");
        const handleClick = jest.fn(() => billsContainer.handleClickNewBill());
        newBillButton.addEventListener("click", handleClick);

        userEvent.click(newBillButton);
        expect(handleClick).toHaveBeenCalled();

        const form = screen.getByTestId("form-new-bill");
        expect(form).toBeTruthy();
      });
    });
  });
});
