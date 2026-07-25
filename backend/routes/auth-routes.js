// و الفلديت و اليوزر فلديشن  السيرفس -- هنا نقوم بربط الرجستر و تسجيل الدخول مع الموديل الخاص بالمستخدم

import express from "express";
import {
  login,
  register,
  updateProfile,
  changeMyPassword,
} from "../controllers/auth-controller.js";
import {
  changePasswordValidation,
  logingValidation,
  resisterValidation,
  updateProfileValidation,
} from "../services/validators/auth-validation.js";
import { validate } from "../middleware/validate.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import { uploadUserProfile } from "../middleware/upload.js";
import parseFormData from "../middleware/parseFormData.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

const uploadAndParse = [
  uploadUserProfile.fields([
    { name: "profileImage", maxCount: 1 }, // ← صورة واحدة فقط، اسم الحقل "profileImage"
  ]),
  parseFormData({
    imagesField: "profileImage",
    uploadPath: "/uploads/users", // نفس الدالة المعدّلة التي أرسلتها لك سابقًا
  }),
];

const authRouter = express.Router();

// 🔹 تسجيل مستخدم جديد
authRouter.post("/register", validate(resisterValidation), register);
// 🔹 تسجيل الدخول يدوي

authRouter.post("/login", validate(logingValidation), login);

// 🔹 تسجيل الدخول عبر Google
// 🟢 بدء تسجيل الدخول عبر Google
authRouter.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// 🟢 معالجة العودة من Google بعد الموافقة
authRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:3000/authpage",
  }),
  (req, res) => {
    // console.log("Google callback req.user:", req.user); // للتحقق
    // إنشاء JWT للمستخدم الذي تم التحقق منه
    const token = jwt.sign(
      {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    const userObj = {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage,
    };

    // const redirectUrl = `http://localhost:3000/authpage?token=${token}&user=${encodeURIComponent(
    //   JSON.stringify(userObj),
    // )}`;

    // // console.log("Redirecting to:", redirectUrl); // للتحقق
    // // ✅ إعادة التوجيه إلى واجهة React مع التوكن وبيانات المستخدم
    // res.redirect(redirectUrl);
  },
);

// 🟢 تحديث ملف التعريف للمستخدم الحالي
authRouter.patch(
  "/users/me",
  protect,
  ...uploadAndParse,
  validate(updateProfileValidation),
  updateProfile,
);
authRouter.patch(
  "/users/me/change-password",
  protect,
  validate(changePasswordValidation),
  changeMyPassword,
);

export default authRouter;
