import asyncHandler from "express-async-handler";
import {
  createCoupon,
  deleteCoupon,
  getCoupon,
  listCoupons,
  updateCoupon,
} from "../../services/pricing/coupon-admin-service.js";
import { couponValidation } from "../../services/validators/pricing/coupon-validation.js";

const validate = (data) => {
  const { value, error } = couponValidation.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) throw error;
  return value;
};

export const index = asyncHandler(async (req, res) => res.json({ success: true, ...(await listCoupons({ query: req.query })) }));
export const show = asyncHandler(async (req, res) => res.json({ success: true, data: await getCoupon(req.params.id) }));
export const store = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createCoupon({ data: validate(req.body), userId: req.user._id }) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await updateCoupon({ id: req.params.id, data: validate(req.body), userId: req.user._id }) }));
export const destroy = asyncHandler(async (req, res) => res.json({ success: true, data: await deleteCoupon({ id: req.params.id, userId: req.user._id }) }));

