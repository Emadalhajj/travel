import Joi from "joi";
import { PRICING_DISCOUNT_TYPE_VALUES } from "../../../constants/pricing/pricing-constants.js";

export const productPricingPolicyValidation = Joi.object({
  tax: Joi.object({
    enabled: Joi.boolean().default(false),
    rate: Joi.number().min(0).max(100).default(0),
    inclusive: Joi.boolean().default(false),
  }).default(),
  discount: Joi.object({
    enabled: Joi.boolean().default(false),
    type: Joi.string().valid(...PRICING_DISCOUNT_TYPE_VALUES).default("PERCENTAGE"),
    value: Joi.number().min(0).when("type", {
      is: "PERCENTAGE",
      then: Joi.number().max(100),
    }).default(0),
    expiresAt: Joi.date().allow(null, "").default(null),
  }).default(),
  couponEligible: Joi.boolean().default(false),
});
