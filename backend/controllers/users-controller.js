import asyncHandler from "../middleware/asyncHandler.js";
import {
  changeUserPasswordService,
  createUserService,
  deactivateUserService,
  getUserByIdService,
  getUsersService,
  toggleUserStatusService,
  updateUserService,
} from "../services/users/user-service.js";

const getProfileImage = (files) => {
  const file = files?.profileImage?.[0];
  return file ? `/uploads/users/${file.filename}` : undefined;
};

export const getAllUsers = asyncHandler(async (req, res) => {
  const data = await getUsersService({ query: req.query });
  res.status(200).json({ success: true, data });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await getUserByIdService({ targetUserId: req.params.id });
  res.status(200).json({ success: true, data: user });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await createUserService({
    data: req.body,
    actor: req.user,
    profileImage: getProfileImage(req.files),
  });
  res
    .status(201)
    .json({ success: true, data: user, message: "User created successfully" });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await updateUserService({
    targetUserId: req.params.id,
    data: req.body,
    actor: req.user,
    profileImage: getProfileImage(req.files),
  });
  res
    .status(200)
    .json({ success: true, data: user, message: "User updated successfully" });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await deactivateUserService({
    targetUserId: req.params.id,
    actor: req.user,
  });
  res
    .status(200)
    .json({
      success: true,
      data: user,
      message: "User deactivated successfully",
    });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await toggleUserStatusService({
    targetUserId: req.params.id,
    actor: req.user,
  });
  res.status(200).json({
    success: true,
    data: user,
    message: user.isActive
      ? "User activated successfully"
      : "User deactivated successfully",
  });
});

export const changePasswordUser = asyncHandler(async (req, res) => {
  const user = await changeUserPasswordService({
    targetUserId: req.params.id,
    password: req.body.password,
    actor: req.user,
  });
  res
    .status(200)
    .json({ success: true, data: user, message: "تم تغيير كلمة المرور بنجاح" });
});
