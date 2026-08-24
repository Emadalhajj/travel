export const ROUTE_ACCESS = Object.freeze({
  ALLOWED: "allowed",
  AUTH_REQUIRED: "auth_required",
  FORBIDDEN: "forbidden",
});

/**
 * @param {{
 *   user: { role?: string } | null | undefined,
 *   allowedRoles?: readonly string[]
 * }} input
 */
export const resolveRouteAccess = ({ user, allowedRoles = [] }) => {
  if (!user) return ROUTE_ACCESS.AUTH_REQUIRED;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return ROUTE_ACCESS.FORBIDDEN;
  }
  return ROUTE_ACCESS.ALLOWED;
};
