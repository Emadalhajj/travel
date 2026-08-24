import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { USER_ROLES } from "../../constants/auth/roles.js";
import { resolveGoogleUser } from "../../config/passport.js";
import { createAuthServiceLayer } from "../../services/auth/auth-service.js";

const googleProfile = (overrides = {}) => ({
  id: "google-1",
  displayName: "Google User",
  emails: [{ value: " User@Example.com ", verified: true }],
  photos: [{ value: "avatar.jpg" }],
  ...overrides,
});

const createGoogleStore = (initial = []) => {
  const rows = initial;
  const document = (row) => ({
    ...row,
    async save() {
      const index = rows.findIndex(({ _id }) => _id === this._id);
      rows[index] = this;
      return this;
    },
  });
  return {
    rows,
    model: {
      findOne: async (filter) => {
        const row = filter.googleId
          ? rows.find(({ googleId }) => googleId === filter.googleId)
          : rows.find(({ email }) => new RegExp(filter.email.$regex, "i").test(email));
        return row ? document(row) : null;
      },
      create: async (data) => {
        const row = { _id: `user-${rows.length + 1}`, isActive: true, ...data };
        rows.push(row);
        return document(row);
      },
    },
  };
};

test("new Google user is created as user and repeated callback reuses it", async () => {
  const store = createGoogleStore();
  const first = await resolveGoogleUser({ profile: googleProfile(), UserModel: store.model });
  const second = await resolveGoogleUser({ profile: googleProfile(), UserModel: store.model });
  assert.equal(store.rows.length, 1);
  assert.equal(first._id, second._id);
  assert.equal(first.role, USER_ROLES.USER);
  assert.equal(first.email, "user@example.com");
});

test("existing Google id returns the same account", async () => {
  const store = createGoogleStore([{ _id: "existing", googleId: "google-1", email: "old@example.com" }]);
  const user = await resolveGoogleUser({ profile: googleProfile(), UserModel: store.model });
  assert.equal(user._id, "existing");
  assert.equal(store.rows.length, 1);
});

test("verified Google email links an existing local account", async () => {
  const store = createGoogleStore([{ _id: "local", email: "USER@example.com", profileImage: "" }]);
  const user = await resolveGoogleUser({ profile: googleProfile(), UserModel: store.model });
  assert.equal(user._id, "local");
  assert.equal(store.rows[0].googleId, "google-1");
  assert.equal(store.rows[0].profileImage, "avatar.jpg");
});

const createHandoffService = ({ active = true } = {}) => createAuthServiceLayer({
  UserModel: {
    findById: async (id) => ({
      _id: id,
      email: "user@example.com",
      role: USER_ROLES.USER,
      isActive: active,
      toObject() { return { ...this }; },
    }),
  },
  tokenSigner: (payload, _secret, options) =>
    payload.purpose ? `handoff:${payload.userId}:${options.expiresIn}` : `access:${payload.userId}`,
  tokenVerifier: (token) => {
    if (token === "expired") throw new Error("expired");
    if (token.startsWith("handoff:")) return { userId: token.split(":")[1], purpose: "google_auth_handoff" };
    return { userId: "user-1" };
  },
});

test("inactive Google user cannot receive a handoff", () => {
  assert.throws(
    () => createHandoffService().completeGoogleAuthentication({ user: { _id: "one", isActive: false } }),
    ({ statusCode }) => statusCode === 403,
  );
});

test("expired handoff and access JWT are rejected", async () => {
  const service = createHandoffService();
  for (const token of ["expired", "access:user-1"]) {
    await assert.rejects(
      () => service.exchangeGoogleAuth({ handoffToken: token }),
      ({ statusCode }) => statusCode === 401,
    );
  }
});

test("successful exchange returns the local login structure", async () => {
  const service = createHandoffService();
  const handoff = service.completeGoogleAuthentication({ user: { _id: "user-1", isActive: true } });
  assert.equal(handoff, "handoff:user-1:2m");
  const result = await service.exchangeGoogleAuth({ handoffToken: handoff });
  assert.equal(result.token, "access:user-1");
  assert.equal(result.user.email, "user@example.com");
  assert.equal(result.user.password, undefined);
});

test("callback uses HttpOnly cookie and never places token or user in redirect URL", async () => {
  const controller = await readFile(new URL("../../controllers/auth-controller.js", import.meta.url), "utf8");
  const routes = await readFile(new URL("../../routes/auth-routes.js", import.meta.url), "utf8");
  assert.match(controller, /httpOnly:\s*true/);
  assert.match(controller, /maxAge:\s*2\s*\*\s*60\s*\*\s*1000/);
  assert.match(controller, /clearCookie\(GOOGLE_HANDOFF_COOKIE/);
  assert.match(controller, /authpage\?google=success/);
  assert.doesNotMatch(controller, /[?&](token|user)=/);
  assert.doesNotMatch(routes, /jwt\.sign/);
});

test("frontend exchanges the cookie and does not read token or user from URL", async () => {
  const page = await readFile(new URL("../../../frontend/src/Pages/Auth/AuthPage.js", import.meta.url), "utf8");
  const slice = await readFile(new URL("../../../frontend/src/redux/auth/authSlice.js", import.meta.url), "utf8");
  assert.match(page, /urlParams\.get\("google"\)/);
  assert.doesNotMatch(page, /urlParams\.get\("token"\)/);
  assert.doesNotMatch(page, /urlParams\.get\("user"\)/);
  assert.match(page, /history\.replaceState/);
  assert.match(slice, /completeGoogleLogin\.fulfilled/);
  assert.match(slice, /localStorage\.setItem\("token", action\.payload\.token\)/);
});
