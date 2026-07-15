import Joi from "joi";

export const createUserSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(30).allow("").optional(),
    lastName: Joi.string().trim().min(2).max(50).allow("").optional(),
  username: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role : Joi.string().valid("admin", "user", "superAdmin").default("user").required(),
  isActive: Joi.boolean().optional(),
})

export const updateUserSchema = createUserSchema.fork(
    Object.keys(createUserSchema.describe().keys),
    (schema) => schema.optional()
)
