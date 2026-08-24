import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { USER_ROLES } from "../../constants/auth/roles.js";
import { createAuthServiceLayer } from "../../services/auth/auth-service.js";
import {
  changePasswordValidation,
  forgotPasswordValidation,
  resisterValidation,
  resetPasswordValidation,
  updateProfileValidation,
} from "../../services/validators/auth-validation.js";

const createUserStore = (initial = []) => {
  const rows = initial.map((row) => ({ isActive: true, role: USER_ROLES.USER, ...row }));
  const asDocument = (row) => ({
    ...row,
    toObject() { return { ...this }; },
    async save() {
      const index = rows.findIndex(({ _id }) => String(_id) === String(this._id));
      rows[index] = this;
      return this;
    },
  });
  const matches = (row, filter) => {
    if (filter._id?.$ne && String(row._id) === String(filter._id.$ne)) return false;
    if (filter.resetPasswordToken && row.resetPasswordToken !== filter.resetPasswordToken) return false;
    if (filter.resetPasswordExpires?.$gt && !(row.resetPasswordExpires > filter.resetPasswordExpires.$gt)) return false;
    if (filter.isActive !== undefined && row.isActive !== filter.isActive) return false;
    const pattern = filter.email?.$regex;
    return pattern ? new RegExp(pattern, filter.email.$options).test(row.email) : true;
  };
  return {
    rows,
    model: {
      findOne: async (filter) => {
        const row = rows.find((candidate) => matches(candidate, filter));
        return row ? asDocument(row) : null;
      },
      findById: async (id) => {
        const row = rows.find(({ _id }) => String(_id) === String(id));
        return row ? asDocument(row) : null;
      },
      create: async (data) => {
        const row = { _id: `user-${rows.length + 1}`, isActive: true, ...data };
        rows.push(row);
        return asDocument(row);
      },
    },
  };
};

const createService = (store, overrides = {}) => createAuthServiceLayer({
  UserModel: store.model,
  passwordHasher: async (password) => `hashed:${password}`,
  passwordComparer: async (password, hash) => hash === `hashed:${password}`,
  tokenSigner: (payload) => `token:${payload.userId}`,
  emailSender: async () => {},
  environment: { FRONTEND_URL: "http://frontend.test" },
  ...overrides,
});

test("register rejects public role input and passwords shorter than six", () => {
  const base = { username: "customer", email: "USER@example.com", password: "secret" };
  assert.ok(resisterValidation.validate({ ...base, role: USER_ROLES.SUPER_ADMIN }).error);
  assert.ok(resisterValidation.validate({ ...base, password: "12345" }).error);
});

test("register normalizes email and always creates a user role", async () => {
  const store = createUserStore();
  const result = await createService(store).registerUser({
    data: { username: "customer", email: " User@Example.COM ", password: "secret", role: USER_ROLES.SUPER_ADMIN },
  });
  assert.equal(store.rows[0].email, "user@example.com");
  assert.equal(store.rows[0].role, USER_ROLES.USER);
  assert.equal(result.user.password, undefined);
});

test("register rejects a case-insensitive duplicate email", async () => {
  const store = createUserStore([{ _id: "one", email: "User@Example.com", password: "hashed:secret" }]);
  await assert.rejects(
    () => createService(store).registerUser({ data: { username: "other", email: "user@example.COM", password: "secret" } }),
    ({ statusCode, field }) => statusCode === 409 && field === "email",
  );
});

test("unknown email and wrong password return the same 401 response", async () => {
  const store = createUserStore([{ _id: "one", email: "user@example.com", password: "hashed:correct" }]);
  const service = createService(store);
  for (const credentials of [
    { email: "missing@example.com", password: "wrong" },
    { email: "user@example.com", password: "wrong" },
  ]) {
    await assert.rejects(
      () => service.loginUser(credentials),
      ({ statusCode, message }) => statusCode === 401 && message === "Invalid credentials",
    );
  }
});

test("inactive user login is rejected", async () => {
  const store = createUserStore([{ _id: "one", email: "user@example.com", password: "hashed:correct", isActive: false }]);
  await assert.rejects(
    () => createService(store).loginUser({ email: "user@example.com", password: "correct" }),
    ({ statusCode }) => statusCode === 403,
  );
});

test("profile validation and service cannot modify role", async () => {
  assert.ok(updateProfileValidation.validate({ role: USER_ROLES.ADMIN }).error);
  const store = createUserStore([{ _id: "one", email: "user@example.com", password: "hashed:correct" }]);
  const user = await createService(store).updateMyProfile({
    userId: "one",
    data: { username: "updated", role: USER_ROLES.SUPER_ADMIN, isActive: false, password: "changed" },
  });
  assert.equal(user.role, USER_ROLES.USER);
  assert.equal(user.isActive, true);
  assert.equal(store.rows[0].password, "hashed:correct");
});

test("profile rejects another user's email case-insensitively", async () => {
  const store = createUserStore([
    { _id: "one", email: "one@example.com" },
    { _id: "two", email: "Existing@Example.com" },
  ]);
  await assert.rejects(
    () => createService(store).updateMyProfile({ userId: "one", data: { email: "existing@example.COM" } }),
    ({ statusCode, field }) => statusCode === 409 && field === "email",
  );
});

test("password change validates length and rejects wrong current password", async () => {
  assert.ok(changePasswordValidation.validate({ currentPassword: "old", newPassword: "12345", confirmNewPassword: "12345" }).error);
  const store = createUserStore([{ _id: "one", email: "user@example.com", password: "hashed:correct" }]);
  await assert.rejects(
    () => createService(store).changeMyPassword({ userId: "one", currentPassword: "wrong", newPassword: "new-secret" }),
    ({ statusCode, field }) => statusCode === 401 && field === "currentPassword",
  );
});

test("successful password change stores the new password", async () => {
  const store = createUserStore([{ _id: "one", email: "user@example.com", password: "hashed:correct" }]);
  const service = createService(store);
  await service.changeMyPassword({ userId: "one", currentPassword: "correct", newPassword: "new-secret" });
  assert.equal(store.rows[0].password, "hashed:new-secret");
  const result = await service.loginUser({ email: "user@example.com", password: "new-secret" });
  assert.equal(result.token, "token:one");
});

test("password recovery validates input and does not reveal unknown emails", async () => {
  assert.ok(forgotPasswordValidation.validate({ email: "invalid" }).error);
  assert.ok(resetPasswordValidation.validate({ password: "12345", confirmPassword: "12345" }).error);
  const store = createUserStore();
  await createService(store).requestPasswordReset({ email: "missing@example.com" });
  assert.equal(store.rows.length, 0);
});

test("password recovery sends a short-lived link and consumes it once", async () => {
  const store = createUserStore([
    { _id: "one", email: "user@example.com", password: "hashed:old-secret" },
  ]);
  let emailMessage = null;
  const service = createService(store, {
    emailSender: async (message) => { emailMessage = message; },
  });

  await service.requestPasswordReset({ email: "user@example.com" });
  assert.equal(emailMessage.to, "user@example.com");
  const token = emailMessage.text.match(/reset-password\/([^\s]+)/)?.[1];
  assert.ok(token);
  assert.equal(
    store.rows[0].resetPasswordToken,
    crypto.createHash("sha256").update(token).digest("hex"),
  );

  await service.resetPassword({ token, password: "new-secret" });
  assert.equal(store.rows[0].password, "hashed:new-secret");
  assert.equal(store.rows[0].resetPasswordToken, undefined);
  await assert.rejects(
    () => service.resetPassword({ token, password: "another-secret" }),
    ({ statusCode, field }) => statusCode === 400 && field === "token",
  );
});

test("password recovery hides email provider errors and clears the token", async () => {
  const store = createUserStore([
    { _id: "one", email: "user@example.com", password: "hashed:old-secret" },
  ]);
  const service = createService(store, {
    emailSender: async () => { throw new Error("SMTP credentials rejected"); },
    environment: { NODE_ENV: "test", FRONTEND_URL: "http://frontend.test" },
  });

  await assert.rejects(
    () => service.requestPasswordReset({ email: "user@example.com" }),
    ({ statusCode, field, message }) =>
      statusCode === 503 && field === "email" && !message.includes("SMTP"),
  );
  assert.equal(store.rows[0].resetPasswordToken, undefined);
  assert.equal(store.rows[0].resetPasswordExpires, undefined);
});
