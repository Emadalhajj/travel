import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
    createUserSchema,
    updateUserSchema
} from "../services/search/userValidator.js";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changePasswordUser
}   from "../controllers/users-controller.js";
import { uploadUserProfile} from "../middleware/upload.js"
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

const userRoutes = express.Router()
// public routes
userRoutes.get("/" , getAllUsers)
userRoutes.get("/:id" , getUserById)


// protected routes
userRoutes.post(
    "/",
    protect,
    authorize("admin"),
    ...uploadAndParse,
    validate(createUserSchema),
    createUser
)
userRoutes.patch(
    "/:id",
    protect,
    authorize("admin"),
    ...uploadAndParse,
    validate(updateUserSchema),
    updateUser
)
userRoutes.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteUser
)
userRoutes.patch(
    "/:id/toggle-status",
    protect,
    authorize("admin"),
    toggleUserStatus
)
userRoutes.patch(
    "/:id/change-password" ,
    protect,
    authorize("admin"),
    changePasswordUser
)
export default userRoutes