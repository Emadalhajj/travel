import asyncHandler from "express-async-handler";

import {
  changeMyPasswordService,
  completeGoogleAuthenticationService,
  exchangeGoogleAuthService,
  loginUserService,
  registerUserService,
  requestPasswordResetService,
  resetPasswordService,
  updateMyProfileService,
} from "../services/auth/auth-service.js";

const GOOGLE_HANDOFF_COOKIE = "google_auth_handoff";
const googleCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 2 * 60 * 1000,
  path: "/api/auth/google",
});
const frontendUrl = () =>
  String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

export const register = asyncHandler(async (req, res) => {
  const result = await registerUserService({ data: req.body });
  res.status(201).json({ message: "User registered successfully", ...result });
});

export const login = asyncHandler(async (req, res) => {
  res.status(200).json(await loginUserService(req.body));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profileImageFile = req.files?.profileImage?.[0];
  const user = await updateMyProfileService({
    userId: req.user._id,
    data: req.body,
    profileImage: profileImageFile
      ? `/uploads/users/${profileImageFile.filename}`
      : undefined,
  });
  res.status(200).json({ success: true, data: user, message: "Profile updated successfully" });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  await changeMyPasswordService({ userId: req.user._id, ...req.body });
  res.status(200).json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordResetService({ email: req.body.email });
  res.status(200).json({
    success: true,
    message: "إذا كان البريد مسجلًا فسيصلك رابط إعادة تعيين كلمة المرور",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordService({
    token: req.params.token,
    password: req.body.password,
  });
  res.status(200).json({
    success: true,
    message: "تم تحديث كلمة المرور بنجاح",
  });
});

export const googleCallback = asyncHandler(async (req, res) => {
  try {
    const handoffToken = completeGoogleAuthenticationService({ user: req.user });
    res.cookie(GOOGLE_HANDOFF_COOKIE, handoffToken, googleCookieOptions());
    res.redirect(`${frontendUrl()}/authpage?google=success`);
  } catch {
    res.redirect(`${frontendUrl()}/authpage?google=failed`);
  }
});

export const exchangeGoogleAuth = asyncHandler(async (req, res) => {
  const clearOptions = googleCookieOptions();
  delete clearOptions.maxAge;
  res.clearCookie(GOOGLE_HANDOFF_COOKIE, clearOptions);
  const result = await exchangeGoogleAuthService({
    handoffToken: req.cookies?.[GOOGLE_HANDOFF_COOKIE],
  });
  res.status(200).json({ success: true, ...result });
});

export const getGoogleFailureRedirect = () =>
  `${frontendUrl()}/authpage?google=failed`;
