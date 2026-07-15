import Joi from "joi";

export const createTransportSchema = Joi.object({
  nameEn: Joi.string().min(3).max(70).required(),
  nameAr: Joi.string().min(3).max(70).required(),
  descriptionEn: Joi.string().allow(""),
  descriptionAr: Joi.string().allow(""),

  vehicleType: Joi.string().valid("bus", "van", "car", "plane", "ship","train" , "other").required(),

  capacity: Joi.number().min(1).required(),
  specs: Joi.alternatives().try(Joi.object(), Joi.string()).default({}) ,
  features: Joi.alternatives().try(Joi.object(), Joi.string()).default({}),

  isActive: Joi.boolean(),
  isAlwaysAvailable: Joi.boolean().default(true),
});

export const updateTransportSchema = Joi.object({
  nameEn: Joi.string().min(3).max(70).required(),
  nameAr: Joi.string().min(3).max(70).required(),
  descriptionEn: Joi.string().allow(""),
  descriptionAr: Joi.string().allow(""),
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
