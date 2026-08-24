import { USER_ROLES } from "../auth/roles.js";

export const AUDIT_READ_ROLES = Object.freeze([
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);
