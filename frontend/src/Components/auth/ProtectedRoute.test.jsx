import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";

jest.mock("../../services/api", () => ({
  register: jest.fn(),
  login: jest.fn(),
}));
jest.mock("../../services/api/admin/auth", () => ({
  updateUserProfile: jest.fn(),
  changePasswordUser: jest.fn(),
  exchangeGoogleAuth: jest.fn(),
}));

import ProtectedRoute from "./ProtectedRoute";
import { ADMIN_ROLES, USER_ROLES } from "../../constants/auth/roles";
import authReducer, { logoutUser } from "../../redux/auth/authSlice";

const createStore = (currentUser) => ({
  getState: () => ({ auth: { currentUser } }),
  subscribe: () => () => {},
  dispatch: () => {},
});

const renderGuard = ({ user, allowedRoles = ADMIN_ROLES }) => render(
  <Provider store={createStore(user)}>
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/" element={<div>home</div>} />
        <Route path="/authpage" element={<div>auth</div>} />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>admin content</div>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

test("anonymous admin route redirects to auth", () => {
  renderGuard({ user: null });
  expect(screen.getByText("auth")).toBeTruthy();
});

test("user admin route redirects home", () => {
  renderGuard({ user: { role: USER_ROLES.USER } });
  expect(screen.getByText("home")).toBeTruthy();
});

test.each([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])(
  "%s can access a general admin route",
  (role) => {
    renderGuard({ user: { role } });
    expect(screen.getByText("admin content")).toBeTruthy();
  },
);

test("super-admin-only route blocks admin and allows super admin", () => {
  const { unmount } = renderGuard({
    user: { role: USER_ROLES.ADMIN },
    allowedRoles: [USER_ROLES.SUPER_ADMIN],
  });
  expect(screen.getByText("home")).toBeTruthy();
  unmount();
  renderGuard({
    user: { role: USER_ROLES.SUPER_ADMIN },
    allowedRoles: [USER_ROLES.SUPER_ADMIN],
  });
  expect(screen.getByText("admin content")).toBeTruthy();
});

test("logout clears both user and access token", () => {
  localStorage.setItem("currentUser", JSON.stringify({ role: USER_ROLES.ADMIN }));
  localStorage.setItem("token", "access-token");
  const state = authReducer(
    { currentUser: { role: USER_ROLES.ADMIN }, token: "access-token", loading: false },
    logoutUser(),
  );
  expect(state.currentUser).toBeNull();
  expect(state.token).toBeNull();
  expect(localStorage.getItem("currentUser")).toBeNull();
  expect(localStorage.getItem("token")).toBeNull();
});

test("a forged local role affects UX only and is not a security assertion", () => {
  renderGuard({ user: { role: USER_ROLES.ADMIN } });
  expect(screen.getByText("admin content")).toBeTruthy();
  // Protected APIs remain authorized by the Backend using its database role.
});
