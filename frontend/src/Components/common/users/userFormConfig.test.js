import { USER_ROLES } from "../../../constants/auth/roles";
import { normalizeUserForForm, userFormConfig } from "./userFormConfig";

const getField = (config, name) =>
  config.commonFields.find((field) => field.name === name);

describe("userFormConfig", () => {
  test("limits an admin form to the user role", () => {
    const config = userFormConfig({ allowedRoles: [USER_ROLES.USER] });

    expect(getField(config, "role").options.map(({ value }) => value)).toEqual([
      USER_ROLES.USER,
    ]);
  });

  test("allows all supported roles for a super admin", () => {
    const config = userFormConfig({
      allowedRoles: Object.values(USER_ROLES),
    });

    expect(getField(config, "role").options.map(({ value }) => value)).toEqual(
      expect.arrayContaining(Object.values(USER_ROLES)),
    );
  });

  test("does not include password fields while editing", () => {
    const config = userFormConfig({ isCreate: false });

    expect(getField(config, "password")).toBeUndefined();
    expect(getField(config, "confirmPassword")).toBeUndefined();
  });

  test("removes an existing password from edit initial data", () => {
    const normalized = normalizeUserForForm({
      _id: "user-id",
      username: "traveler",
      password: "hashed-secret",
    });

    expect(normalized).toEqual({
      _id: "user-id",
      username: "traveler",
      password: "",
      confirmPassword: "",
    });
  });
});
