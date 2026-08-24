import assert from "node:assert/strict";
import test from "node:test";

import { USER_ROLES } from "../../constants/auth/roles.js";
import {
  assertCanAssignRole,
  assertCanDeactivateUser,
  assertCanManageUser,
  assertCanUpdateUser,
} from "../../services/users/user-authorization-policy.js";

const actor = (role, id = role) => ({ _id: id, role });
const target = (role, id = `target-${role}`) => ({ _id: id, role });

test("user cannot manage another user", () => {
  assert.throws(
    () => assertCanManageUser({ actor: actor(USER_ROLES.USER), targetUser: target(USER_ROLES.USER) }),
    ({ statusCode }) => statusCode === 403,
  );
});

test("admin can manage users but not admin or super admin", () => {
  assert.doesNotThrow(() => assertCanManageUser({ actor: actor(USER_ROLES.ADMIN), targetUser: target(USER_ROLES.USER) }));
  for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
    assert.throws(
      () => assertCanManageUser({ actor: actor(USER_ROLES.ADMIN), targetUser: target(role) }),
      ({ statusCode }) => statusCode === 403,
    );
  }
});

test("admin can assign user only and cannot escalate privileges", () => {
  assert.doesNotThrow(() => assertCanAssignRole({ actor: actor(USER_ROLES.ADMIN), requestedRole: USER_ROLES.USER }));
  for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
    assert.throws(
      () => assertCanAssignRole({ actor: actor(USER_ROLES.ADMIN), requestedRole: role }),
      ({ field }) => field === "role",
    );
  }
});

test("super admin can manage users and assign supported roles", () => {
  for (const role of Object.values(USER_ROLES)) {
    assert.doesNotThrow(() => assertCanManageUser({ actor: actor(USER_ROLES.SUPER_ADMIN), targetUser: target(role) }));
    assert.doesNotThrow(() => assertCanAssignRole({ actor: actor(USER_ROLES.SUPER_ADMIN), requestedRole: role }));
  }
});

test("super admin cannot deactivate or downgrade the current account", () => {
  const current = actor(USER_ROLES.SUPER_ADMIN, "same-id");
  assert.throws(
    () => assertCanDeactivateUser({ actor: current, targetUser: target(USER_ROLES.SUPER_ADMIN, "same-id") }),
    ({ statusCode }) => statusCode === 403,
  );
  assert.throws(
    () => assertCanUpdateUser({ actor: current, targetUser: target(USER_ROLES.SUPER_ADMIN, "same-id"), requestedRole: USER_ROLES.ADMIN }),
    ({ field }) => field === "role",
  );
  assert.throws(
    () => assertCanUpdateUser({ actor: current, targetUser: target(USER_ROLES.SUPER_ADMIN, "same-id"), requestedIsActive: false }),
    ({ field }) => field === "isActive",
  );
});
