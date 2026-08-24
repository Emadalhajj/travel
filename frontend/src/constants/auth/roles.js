export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
});

/** @type {string[]} */
export const ADMIN_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
];

Object.freeze(ADMIN_ROLES);

export const isAdminRole = (role) =>
  ADMIN_ROLES.includes(role);
