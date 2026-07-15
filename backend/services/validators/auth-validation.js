// for make validation for auth routes
import Joi from 'joi';
export let resisterValidation = Joi.object({

    firstName: Joi.string().min(3).max(30).optional(),
    lastName: Joi.string().min(3).max(30).optional(),
    username: Joi.string().min(3).max(30).optional(),
    email: Joi.string().email().min(3).max(30).required(),
    password: Joi.string().min(3).max(25).required(),
    profileImage: Joi.string().optional(),
    role: Joi.string().optional(),

})
export let logingValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

export let updateProfileValidation = Joi.object({

    firstName: Joi.string().min(3).max(30).optional(),
    lastName: Joi.string().min(3).max(30).optional(),
    username: Joi.string().min(3).max(30).optional(),
    email: Joi.string().email().min(3).max(30).optional(),
    profileImage: Joi.string().optional(),
    role: Joi.string().optional(),

})
export let changePasswordValidation = Joi.object({
  currentPassword: Joi.string().min(1).required()
    .messages({
      "any.required": "كلمة المرور الحالية مطلوبة",
      "string.empty": "كلمة المرور الحالية مطلوبة"
    }),

  newPassword: Joi.string().min(6).required()
    .messages({
      "string.min": "كلمة المرور الجديدة يجب أن تكون أكثر من 6 أحرف",
      "any.required": "كلمة المرور الجديدة مطلوبة"
    }),

  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({
      "any.only": "كلمات المرور الجديدة غير متطابقة",
      "any.required": "تأكيد كلمة المرور مطلوب"
    })
});