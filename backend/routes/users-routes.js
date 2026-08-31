import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { USER_ROLES } from "../constants/auth/roles.js";

import {
  createUserSchema,
  updateUserSchema,
  changeUserPasswordSchema,
} from "../services/validators/userValidator.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changePasswordUser,
} from "../controllers/users-controller.js";
import { uploadUserProfile } from "../middleware/upload/index.js";
import parseFormData from "../middleware/parseFormData.js";

const uploadAndParse = [
  uploadUserProfile.fields([
    { name: "profileImage", maxCount: 1 }, // ← صورة واحدة فقط، اسم الحقل "profileImage"
  ]),
  parseFormData({
    imagesField: "profileImage",
    uploadPath: "/uploads/users", // نفس الدالة المعدّلة التي أرسلتها لك سابقًا
  }),
];

const userRoutes = express.Router();
// public routes
userRoutes.get(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getAllUsers,
);

userRoutes.get(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getUserById,
);

// protected routes
userRoutes.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ...uploadAndParse,
  validate(createUserSchema),
  createUser,
);
userRoutes.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ...uploadAndParse,
  validate(updateUserSchema),
  updateUser,
);
userRoutes.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  deleteUser,
);
userRoutes.patch(
  "/:id/toggle-status",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  toggleUserStatus,
);
userRoutes.patch(
  "/:id/change-password",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(changeUserPasswordSchema),
  changePasswordUser,
);
export default userRoutes;
