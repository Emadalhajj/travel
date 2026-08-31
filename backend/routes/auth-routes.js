import express from "express";
import passport from "passport";

import {
  changeMyPassword,
  exchangeGoogleAuth,
  forgotPassword,
  getGoogleFailureRedirect,
  googleCallback,
  login,
  register,
  resetPassword,
  updateProfile,
} from "../controllers/auth-controller.js";
import {
  changePasswordValidation,
  forgotPasswordValidation,
  loginValidation,
  resisterValidation,
  resetPasswordValidation,
  updateProfileValidation,
} from "../services/validators/auth-validation.js";
import { validate } from "../middleware/validate.js";
import { uploadUserProfile } from "../middleware/upload/index.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  authRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
} from "../middleware/security/rate-limiters.js";

const authRouter = express.Router();
const uploadAndParse = [
  uploadUserProfile.fields([{ name: "profileImage", maxCount: 1 }]),
];

authRouter.post("/register", authRateLimiter, validate(resisterValidation), register);
authRouter.post("/login", authRateLimiter, validate(loginValidation), login);
authRouter.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validate(forgotPasswordValidation),
  forgotPassword,
);
authRouter.post(
  "/reset-password/:token",
  passwordResetRateLimiter,
  validate(resetPasswordValidation),
  resetPassword,
);
authRouter.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
authRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: getGoogleFailureRedirect(),
  }),
  googleCallback,
);
authRouter.post("/auth/google/exchange", authRateLimiter, exchangeGoogleAuth);
authRouter.patch(
  "/users/me",
  protect,
  uploadRateLimiter,
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
