const mockRequestUse = jest.fn();
const mockResponseUse = jest.fn();
const mockCreate = jest.fn(() => ({
  interceptors: {
    request: { use: mockRequestUse },
    response: { use: mockResponseUse },
  },
}));

jest.mock("axios", () => ({ create: mockCreate }));
jest.mock("../../i18n", () => ({ language: "en" }));

describe("shared API client", () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockCreate.mockImplementation(() => ({
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse },
      },
    }));
    localStorage.clear();
  });

  afterAll(() => {
    process.env.REACT_APP_API_URL = originalApiUrl;
  });

  test("reads its base URL from the environment", () => {
    process.env.REACT_APP_API_URL = "https://api.example.test/v1";
    require("./api");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "https://api.example.test/v1" }),
    );
  });

  test("401 clears the session while 403 preserves it", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.REACT_APP_API_URL = "https://api.example.test/v1";
    require("./api");
    const rejectResponse = mockResponseUse.mock.calls[0][1];

    localStorage.setItem("currentUser", "user");
    localStorage.setItem("token", "token");
    await expect(
      rejectResponse({ response: { status: 403 }, config: { url: "/admin" } }),
    ).rejects.toBeDefined();
    expect(localStorage.getItem("token")).toBe("token");

    await expect(
      rejectResponse({ response: { status: 401 }, config: { url: "/admin" } }),
    ).rejects.toBeDefined();
    expect(localStorage.getItem("currentUser")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    consoleError.mockRestore();
  });
});
