import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../../models/user-model.js";
import { USER_ROLES } from "../../constants/auth/roles.js";
import AppError from "../../utils/AppError.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import { sendEmail } from "../notifications/email-service.js";

export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const emailLookup = (email) => ({
  email: { $regex: `^${escapeRegex(normalizeEmail(email))}$`, $options: "i" },
});

const sanitizeUser = (user) => {
  const value =
    typeof user?.toObject === "function" ? user.toObject() : { ...user };
  delete value.password;
  return value;
};

export const createAuthServiceLayer = ({
  UserModel = User,
  passwordHasher = hashPassword,
  passwordComparer = bcrypt.compare,
  tokenSigner = jwt.sign,
  tokenVerifier = jwt.verify,
  emailSender = sendEmail,
  environment = process.env,
} = {}) => {
  const createAuthToken = (user) =>
    tokenSigner(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

  const createGoogleHandoffToken = (user) =>
    tokenSigner(
      { userId: user._id, purpose: "google_auth_handoff" },
      process.env.JWT_SECRET,
      { expiresIn: "2m" },
    );

  const completeGoogleAuthentication = ({ user }) => {
    if (!user)
      throw new AppError("Google authentication failed", 401, "googleAuth");
    if (!user.isActive)
      throw new AppError("Account is inactive", 403, "account");
    return createGoogleHandoffToken(user);
  };

  const exchangeGoogleAuth = async ({ handoffToken }) => {
    if (!handoffToken)
      throw new AppError("Google authentication session is missing", 401, "googleAuth");
    let decoded;
    try {
      decoded = tokenVerifier(handoffToken, process.env.JWT_SECRET);
    } catch {
      throw new AppError("Google authentication session is invalid or expired", 401, "googleAuth");
    }
    if (decoded?.purpose !== "google_auth_handoff")
      throw new AppError("Invalid Google authentication session", 401, "googleAuth");
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive)
      throw new AppError("Account is not available", 401, "googleAuth");
    return { user: sanitizeUser(user), token: createAuthToken(user) };
  };

  const registerUser = async ({ data }) => {
    const email = normalizeEmail(data.email);
    if (await UserModel.findOne(emailLookup(email))) {
      throw new AppError("Email already registered", 409, "email");
    }
    const user = await UserModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email,
      password: await passwordHasher(data.password),
      profileImage: data.profileImage,
      role: USER_ROLES.USER,
    });
    return { user: sanitizeUser(user), token: createAuthToken(user) };
  };

  const loginUser = async ({ email, password }) => {
    const query = UserModel.findOne(emailLookup(email));
    const user =
      typeof query?.select === "function"
        ? await query.select("+password")
        : await query;
    if (!user) throw new AppError("Invalid credentials", 401);
    if (!user.isActive)
      throw new AppError(
        "هذا الحساب غير مفعل حاليًا. يرجى التواصل مع الإدارة لتفعيله.",
        403,
      );
    if (!user.password || !(await passwordComparer(password, user.password))) {
      throw new AppError("Invalid credentials", 401);
    }
    return { user: sanitizeUser(user), token: createAuthToken(user) };
  };

  const updateMyProfile = async ({ userId, data, profileImage }) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError("User not found", 404, "user");
    if (data.email !== undefined) {
      const email = normalizeEmail(data.email);
      const duplicate = await UserModel.findOne({
        ...emailLookup(email),
        _id: { $ne: userId },
      });
      if (duplicate)
        throw new AppError("Email already registered", 409, "email");
      user.email = email;
    }
    for (const field of ["firstName", "lastName", "username"]) {
      if (data[field] !== undefined) user[field] = data[field];
    }
    if (profileImage) user.profileImage = profileImage;
    await user.save();
    return sanitizeUser(user);
  };

  const changeMyPassword = async ({ userId, currentPassword, newPassword }) => {
    const query = UserModel.findById(userId);
    const user =
      typeof query?.select === "function"
        ? await query.select("+password")
        : await query;
    if (!user) throw new AppError("User not found", 404, "user");
    if (
      !user.password ||
      !(await passwordComparer(currentPassword, user.password))
    ) {
      throw new AppError(
        "كلمة المرور الحالية غير صحيحة",
        401,
        "currentPassword",
      );
    }
    user.password = await passwordHasher(newPassword);
    await user.save();
  };

  const requestPasswordReset = async ({ email }) => {
    const user = await UserModel.findOne(emailLookup(email));
    if (!user || !user.isActive) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = String(
      environment.FRONTEND_URL || "http://localhost:3000",
    ).replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await emailSender({
        to: user.email,
        subject: "إعادة تعيين كلمة المرور",
        text: `استخدم الرابط التالي لإعادة تعيين كلمة المرور خلال 15 دقيقة:\n${resetUrl}\nإذا لم تطلب ذلك فتجاهل الرسالة.`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      if (environment.NODE_ENV === "development") {
        console.error("Password reset email delivery failed:", error?.message);
      }
      throw new AppError(
        "تعذر إرسال رسالة استعادة كلمة المرور. يرجى المحاولة لاحقًا.",
        503,
        "email",
      );
    }
  };

  const resetPassword = async ({ token, password }) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(String(token || ""))
      .digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
    });
    if (!user) {
      throw new AppError("رابط إعادة تعيين كلمة المرور غير صالح أو منتهي", 400, "token");
    }
    user.password = await passwordHasher(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  };

  return {
    createAuthToken,
    createGoogleHandoffToken,
    completeGoogleAuthentication,
    exchangeGoogleAuth,
    registerUser,
    loginUser,
    updateMyProfile,
    changeMyPassword,
    requestPasswordReset,
    resetPassword,
  };
};

const authService = createAuthServiceLayer();
export const createAuthToken = authService.createAuthToken;
export const registerUserService = authService.registerUser;
export const loginUserService = authService.loginUser;
export const updateMyProfileService = authService.updateMyProfile;
export const changeMyPasswordService = authService.changeMyPassword;
export const completeGoogleAuthenticationService = authService.completeGoogleAuthentication;
export const exchangeGoogleAuthService = authService.exchangeGoogleAuth;
export const requestPasswordResetService = authService.requestPasswordReset;
export const resetPasswordService = authService.resetPassword;
