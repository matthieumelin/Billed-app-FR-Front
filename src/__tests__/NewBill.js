/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      const iconActivated = windowIcon.classList.contains("active-icon");
      expect(iconActivated).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page", () => {
    test("Then the new bill's form should be loaded with its fields", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    });

    test("Then I can select upload an image file", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const store = null;
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const mockHandleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      expect(input).toBeTruthy();

      input.addEventListener("change", mockHandleChangeFile);
      fireEvent.change(input, {
        target: {
          files: [new File(["file.jpg"], "file.jpg", { type: "file/jpg" })],
        },
      });

      expect(mockHandleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).toBe("file.jpg");

      jest.spyOn(window, "alert").mockImplementation(() => {});
      expect(window.alert).not.toHaveBeenCalled();
    });

    test("Then I can't select upload a non image file", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const store = null;
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const mockHandleChangeFile = jest.fn(newBill.handleChangeFile);

      const input = screen.getByTestId("file");
      expect(input).toBeTruthy();

      input.addEventListener("change", mockHandleChangeFile);
      fireEvent.change(input, {
        target: {
          files: [new File(["file.pdf"], "file.pdf", { type: "file/pdf" })],
        },
      });
      expect(mockHandleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).not.toBe("file.jpg");

      jest.spyOn(window, "alert").mockImplementation(() => {});
      expect(window.alert).toHaveBeenCalled();
    });
  });
});

//Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit the form completed", () => {
    test("Then the bill is created", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "azerty@email.com",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const validBill = {
        type: "Hôtel et logement",
        name: "encore",
        date: "2004-04-04",
        amount: 400,
        vat: 80,
        pct: 20,
        commentary: "séminaire billed",
        fileUrl: "../img/file.jpg",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        status: "pending",
      };

      screen.getByTestId("expense-type").value = validBill.type;
      screen.getByTestId("expense-name").value = validBill.name;
      screen.getByTestId("datepicker").value = validBill.date;
      screen.getByTestId("amount").value = validBill.amount;
      screen.getByTestId("vat").value = validBill.vat;
      screen.getByTestId("pct").value = validBill.pct;
      screen.getByTestId("commentary").value = validBill.commentary;

      newBill.fileName = validBill.fileName;
      newBill.fileUrl = validBill.fileUrl;

      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });

    test("fetches error from an API and fails with 500 error", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {});

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      });

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
    });
  });
});
