import Joi from "joi";
import {
  arabicTextSchema,
  englishTextSchema,
} from "../../utils/validation/text-language.js";

export const createTransportSchema = Joi.object({
  nameEn: englishTextSchema().min(3).max(70).required(),
  nameAr: arabicTextSchema().min(3).max(70).required(),
  descriptionEn: englishTextSchema().allow(""),
  descriptionAr: arabicTextSchema().allow(""),

  vehicleType: Joi.string().valid("bus", "van", "car", "plane", "ship","train" , "other").required(),

  capacity: Joi.number().min(1).required(),
  specs: Joi.alternatives().try(Joi.object(), Joi.string()).default({}) ,
  features: Joi.alternatives().try(Joi.object(), Joi.string()).default({}),

  isActive: Joi.boolean(),
  isAlwaysAvailable: Joi.boolean().default(true),
});

export const updateTransportSchema = Joi.object({
  nameEn: englishTextSchema().min(3).max(70).required(),
  nameAr: arabicTextSchema().min(3).max(70).required(),
  descriptionEn: englishTextSchema().allow(""),
  descriptionAr: arabicTextSchema().allow(""),
  vehicleType: Joi.string().valid("bus", "van", "car", "plane", "ship","train" , "other").required(),

  capacity: Joi.number().min(1).required(),
  
  /* ======================
   * FEATURES (Dynamic Options)
   * ====================== */
  features: Joi.alternatives().try(
    Joi.object().pattern(Joi.string(), Joi.boolean()),
    Joi.string()
  ).default({}),

  /* ======================
   * SPECS (Dynamic Selects)
   * ====================== */
    specs: Joi.alternatives().try(
    Joi.object(),
    Joi.string()
  ).default({}),
  
  isActive: Joi.boolean(),
  isAlwaysAvailable: Joi.boolean().default(true),
});

/// 
