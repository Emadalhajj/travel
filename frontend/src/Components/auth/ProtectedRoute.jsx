import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { resolveRouteAccess, ROUTE_ACCESS } from "./routeAccess";

/**
 * @param {{
 *   allowedRoles?: readonly string[],
 *   children: import("react").ReactNode
 * }} props
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const user = currentUser?.user || currentUser;
  const access = resolveRouteAccess({ user, allowedRoles });

  if (access === ROUTE_ACCESS.AUTH_REQUIRED) {
    return <Navigate to="/authpage" replace state={{ from: location.pathname + location.search }} />;
  }
  if (access === ROUTE_ACCESS.FORBIDDEN) {
    return <Navigate to="/" replace />;
  }
  return children;
}
