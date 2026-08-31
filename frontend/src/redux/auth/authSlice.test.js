import authReducer, { loginUser } from "./authSlice";

jest.mock("../../services/api", () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock("../../services/api/admin/auth", () => ({
  changePasswordUser: jest.fn(),
  exchangeGoogleAuth: jest.fn(),
  updateUserProfile: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

describe("auth login state", () => {
  const existingSession = {
    currentUser: { _id: "existing-user" },
    token: "existing-token",
    loading: false,
    error: null,
    TypeAction: "login",
  };

  test("clears a stale successful action when a new login starts", () => {
    const state = authReducer(existingSession, loginUser.pending("request-id"));

    expect(state.loading).toBe(true);
    expect(state.TypeAction).toBeNull();
  });

  test("does not mark a rejected login as a successful login", () => {
    const state = authReducer(
      existingSession,
      loginUser.rejected(null, "request-id", {}, "Invalid credentials"),
    );

    expect(state.loading).toBe(false);
    expect(state.error).toBe("Invalid credentials");
    expect(state.TypeAction).toBeNull();
  });
});
