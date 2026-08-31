import Joi from "joi";

export const resisterValidation = Joi.object({
  firstName: Joi.string().trim().min(2).max(30).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  username: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().min(6).max(128).required(),
  profileImage: Joi.string().optional(),
});

export const loginValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().required(),
});

export const updateProfileValidation = Joi.object({
  firstName: Joi.string().trim().min(2).max(30).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  username: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().trim().lowercase().email().max(254).optional(),
  profileImage: Joi.string().optional(),
});

export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
});

export const forgotPasswordValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
});

export const resetPasswordValidation = Joi.object({
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});
