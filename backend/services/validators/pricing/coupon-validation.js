import Joi from "joi";
import { PRICING_DISCOUNT_TYPE_VALUES } from "../../../constants/pricing/pricing-constants.js";

export const couponValidation = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(50).required(),
  discountType: Joi.string().valid(...PRICING_DISCOUNT_TYPE_VALUES).required(),
  value: Joi.number().min(0).when("discountType", {
    is: "PERCENTAGE",
    then: Joi.number().max(100),
  }).required(),
  isActive: Joi.boolean().default(true),
  startsAt: Joi.date().allow(null, "").default(null),
  expiresAt: Joi.date().allow(null, "").default(null),
  minimumAmount: Joi.number().min(0).default(0),
  usageLimit: Joi.number().integer().min(1).allow(null, "").default(null),
  perCustomerLimit: Joi.number().integer().min(1).default(1),
  applicableTo: Joi.object({
    scope: Joi.string().valid("ALL", "SELECTED").default("ALL"),
    serviceTypes: Joi.array().items(Joi.string().trim().uppercase()).default([]),
    productIds: Joi.array().items(Joi.string().trim()).default([]),
  }).default(),
}).custom((value, helpers) => {
  if (value.startsAt && value.expiresAt && new Date(value.expiresAt) <= new Date(value.startsAt)) {
    return helpers.error("any.custom", { message: "expiresAt must be after startsAt" });
  }
  if (
    value.applicableTo?.scope === "SELECTED" &&
    !value.applicableTo.serviceTypes?.length &&
    !value.applicableTo.productIds?.length
  ) {
    return helpers.error("any.custom", { message: "selected scope requires a service type or product" });
  }
  return value;
});
