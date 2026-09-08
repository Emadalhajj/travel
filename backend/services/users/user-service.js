import User from "../../models/user-model.js";
import { USER_ROLES } from "../../constants/auth/roles.js";
import AppError from "../../utils/AppError.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import { buildSearchQuery } from "../../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../../utils/Builders/buildSort.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import {
  assertCanAssignRole,
  assertCanDeactivateUser,
  assertCanManageUser,
  assertCanUpdateUser,
} from "./user-authorization-policy.js";

const findTargetUser = async (targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404, "user");
  return user;
};

export const getUsersService = async ({ query }) => {
  const filter = {
    ...buildSearchQuery({
      search: query.search,
      searchFields: ["firstName", "lastName", "email", "username"],
    }),
  };
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  const sort = buildSort(query);
  const { page, skip, limit } = buildPagination(query);
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "nameEn username")
      .select("-password"),
    User.countDocuments(filter),
  ]);
  return { users, total, page, limit };
};

export const getUserByIdService = async ({ targetUserId }) => {
  const user = await User.findById(targetUserId).select("-password");
  if (!user) throw new AppError("USER_NOT_FOUND", 404, "user");
  return user;
};

export const createUserService = async ({ data, actor, profileImage }) => {
  const role = data.role || USER_ROLES.USER;
  assertCanAssignRole({ actor, requestedRole: role });
  const created = await User.create({
    ...data,
    role,
    password: await hashPassword(data.password),
    profileImage,
    createdBy: actor._id,
  });
  return User.findById(created._id).select("-password");
};

export const updateUserService = async ({
  targetUserId,
  data,
  actor,
  profileImage,
}) => {
  const targetUser = await findTargetUser(targetUserId);
  assertCanUpdateUser({
    actor,
    targetUser,
    requestedRole: data.role,
    requestedIsActive: data.isActive,
  });
  const allowedFields = [
    "firstName",
    "lastName",
    "username",
    "email",
    "role",
    "isActive",
  ];
  for (const field of allowedFields) {
    if (data[field] !== undefined) targetUser[field] = data[field];
  }
  if (data.password) targetUser.password = await hashPassword(data.password);
  if (profileImage) targetUser.profileImage = profileImage;
  await targetUser.save();
  return User.findById(targetUserId).select("-password");
};

export const deactivateUserService = async ({ targetUserId, actor }) => {
  const targetUser = await findTargetUser(targetUserId);
  assertCanDeactivateUser({ actor, targetUser });
  targetUser.isActive = false;
  await targetUser.save();
  return targetUser;
};

export const toggleUserStatusService = async ({ targetUserId, actor }) => {
  const targetUser = await findTargetUser(targetUserId);
  if (targetUser.isActive) assertCanDeactivateUser({ actor, targetUser });
  else assertCanManageUser({ actor, targetUser });
  targetUser.isActive = !targetUser.isActive;
  await targetUser.save();
  return targetUser;
};

export const changeUserPasswordService = async ({
  targetUserId,
  password,
  actor,
}) => {
  const targetUser = await findTargetUser(targetUserId);
  assertCanManageUser({ actor, targetUser });
  targetUser.password = await hashPassword(password);
  await targetUser.save();
  return User.findById(targetUserId).select("-password");
};
