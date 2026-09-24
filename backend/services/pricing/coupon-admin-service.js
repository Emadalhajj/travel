import Coupon from "../../models/pricing/coupon-model.js";
import AppError from "../../utils/AppError.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";

export const listCoupons = async ({ query = {} }) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = { isDeleted: false };
  if (query.search) filter.code = { $regex: String(query.search).trim(), $options: "i" };
  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getCoupon = async (id) => {
  const coupon = await Coupon.findOne({ _id: id, isDeleted: false }).lean();
  if (!coupon) throw new AppError("COUPON_NOT_FOUND", 404, "couponId");
  return coupon;
};

export const createCoupon = ({ data, userId }) => Coupon.create({ ...data, createdBy: userId });

export const updateCoupon = async ({ id, data, userId }) => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { ...data, updatedBy: userId } },
    { new: true, runValidators: true },
  );
  if (!coupon) throw new AppError("COUPON_NOT_FOUND", 404, "couponId");
  return coupon;
};

export const deleteCoupon = async ({ id, userId }) => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true, isActive: false, deletedAt: new Date(), deletedBy: userId } },
    { new: true },
  );
  if (!coupon) throw new AppError("COUPON_NOT_FOUND", 404, "couponId");
  return coupon;
};

