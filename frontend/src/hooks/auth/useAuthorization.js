import { useSelector } from "react-redux";

import { isAdminRole, USER_ROLES } from "../../constants/auth/roles";

export default function useAuthorization() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const user = currentUser?.user || currentUser;
  const role = user?.role || null;
  const hasRole = (...roles) => roles.flat().includes(role);
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;

  const canManageUser = (targetUser) =>
    Boolean(
      targetUser &&
        (isSuperAdmin ||
          (role === USER_ROLES.ADMIN && targetUser.role === USER_ROLES.USER)),
    );
  const canDeactivateUser = (targetUser) =>
    canManageUser(targetUser) && String(user?._id) !== String(targetUser?._id);

  return {
    user,
    role,
    isAdmin: isAdminRole(role),
    isSuperAdmin,
    hasRole,
    canManageUser,
    canDeactivateUser,
  };
}
