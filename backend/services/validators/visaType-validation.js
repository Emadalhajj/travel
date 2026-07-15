// backend/services/visa-validation.js
import Joi from "joi";

export const createVisaTypeSchema = Joi.object({
    
    nameEn: Joi.string().min(3).max(70).required(),
    nameAr: Joi.string().min(3).max(70).required(),


})
// تحديث نوع تأشيرة
export const updateVisaTypeSchema = Joi.object({
    nameEn: Joi.string().min(3).max(100).optional(),
    nameAr: Joi.string().min(3).max(100).optional(),


})
