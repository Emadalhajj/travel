import { USER_ROLES } from "../../constants/auth/roles.js";
import AppError from "../../utils/AppError.js";

const sameUser = (actor, targetUser) =>
  String(actor?._id || actor?.id) === String(targetUser?._id || targetUser?.id);

export const assertCanAssignRole = ({ actor, requestedRole }) => {
  if (actor?.role === USER_ROLES.SUPER_ADMIN) return;
  if (actor?.role === USER_ROLES.ADMIN && requestedRole === USER_ROLES.USER) return;
  throw new AppError("غير مصرح بتعيين هذا الدور", 403, "role");
};

export const assertCanManageUser = ({ actor, targetUser }) => {
  if (actor?.role === USER_ROLES.SUPER_ADMIN) return;
  if (actor?.role === USER_ROLES.ADMIN && targetUser?.role === USER_ROLES.USER) return;
  throw new AppError("غير مصرح بإدارة هذا المستخدم", 403, "user");
};

export const assertCanUpdateUser = ({ actor, targetUser, requestedRole, requestedIsActive }) => {
  assertCanManageUser({ actor, targetUser });
  if (requestedRole !== undefined) {
    assertCanAssignRole({ actor, requestedRole });
    if (sameUser(actor, targetUser) && requestedRole !== targetUser.role) {
      throw new AppError("لا يمكنك تغيير دور حسابك الحالي", 403, "role");
    }
  }
  if (sameUser(actor, targetUser) && requestedIsActive === false) {
    throw new AppError("لا يمكنك تعطيل حسابك الحالي", 403, "isActive");
  }
};

export const assertCanDeactivateUser = ({ actor, targetUser }) => {
  assertCanManageUser({ actor, targetUser });
  if (sameUser(actor, targetUser)) {
    throw new AppError("لا يمكنك تعطيل حسابك الحالي", 403, "user");
  }
};
