import Joi from "joi";
import { USER_ROLE_VALUES } from "../../constants/auth/roles.js";

export const createUserSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(30).allow("").optional(),
    lastName: Joi.string().trim().min(2).max(50).allow("").optional(),
  username: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...USER_ROLE_VALUES).default("user").required(),
  isActive: Joi.boolean().optional(),
  profileImage: Joi.string().allow("").optional(),
});

export const updateUserSchema = createUserSchema.fork(
    Object.keys(createUserSchema.describe().keys),
    (schema) => schema.optional()
);

export const changeUserPasswordSchema = Joi.object({
  password: Joi.string().min(6).required(),
});
