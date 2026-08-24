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
  logingValidation,
  resisterValidation,
  resetPasswordValidation,
  updateProfileValidation,
} from "../services/validators/auth-validation.js";
import { validate } from "../middleware/validate.js";
import { uploadUserProfile } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const authRouter = express.Router();
const uploadAndParse = [
  uploadUserProfile.fields([{ name: "profileImage", maxCount: 1 }]),
];

authRouter.post("/register", validate(resisterValidation), register);
authRouter.post("/login", validate(logingValidation), login);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordValidation),
  forgotPassword,
);
authRouter.post(
  "/reset-password/:token",
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
authRouter.post("/auth/google/exchange", exchangeGoogleAuth);
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
