import Coupon from "../../models/pricing/coupon-model.js";
import AppError from "../../utils/AppError.js";
import { buildAuthoritativeDraftQuote } from "./draft-pricing-service.js";

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const resolveCouponServiceType = (draft = {}) => {
  const context = String(draft.bookingContext || "").toUpperCase();
  if (context === "READY_PACKAGE") return "PROGRAM";

  const serviceType = String(draft.serviceType || context).toUpperCase();
  const aliases = {
    HOTEL: "ACCOMMODATION",
    UMRAH_PROGRAM: "PROGRAM",
  };
  return aliases[serviceType] || serviceType;
};

const validateCouponWindow = (coupon, now) => {
  if (!coupon || coupon.isDeleted || !coupon.isActive) {
    throw new AppError("COUPON_INVALID", 400, "couponCode");
  }
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    throw new AppError("COUPON_NOT_STARTED", 400, "couponCode");
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) {
    throw new AppError("COUPON_EXPIRED", 400, "couponCode");
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError("COUPON_USAGE_LIMIT_REACHED", 400, "couponCode");
  }
};

const validateApplicability = ({ coupon, draft, baseQuote }) => {
  const amount = Number(baseQuote.taxableAmount || 0);
  if (amount < Number(coupon.minimumAmount || 0)) {
    throw new AppError("COUPON_MINIMUM_AMOUNT_NOT_MET", 400, "couponCode");
  }
  const serviceType = resolveCouponServiceType(draft);
  const applicable = coupon.applicableTo || {};
  if (
    applicable.scope === "SELECTED" &&
    applicable.serviceTypes?.length &&
    !applicable.serviceTypes.map((value) => String(value).toUpperCase()).includes(serviceType)
  ) {
    throw new AppError("COUPON_NOT_APPLICABLE", 400, "couponCode");
  }
  const selectedProductIds = new Set((applicable.productIds || []).map(String));
  const eligibleLines = baseQuote.lines.filter((line) =>
    line.couponEligible &&
    (!selectedProductIds.size || selectedProductIds.has(String(line.sourceId))),
  );
  if (!eligibleLines.length) {
    throw new AppError("COUPON_NOT_APPLICABLE", 400, "couponCode");
  }
  return eligibleLines.map((line) => String(line.sourceId));
};

export const resolveCouponForDraft = async ({ code, draft, userId, now = new Date() }) => {
  const coupon = await Coupon.findOne({ code: normalizeCode(code), isDeleted: false })
    .select("+usageRecords")
    .lean();
  validateCouponWindow(coupon, now);
  const customerUses = (coupon.usageRecords || []).filter(
    (record) => String(record.user) === String(userId),
  ).length;
  if (customerUses >= Number(coupon.perCustomerLimit || 1)) {
    throw new AppError("COUPON_CUSTOMER_LIMIT_REACHED", 400, "couponCode");
  }
  const baseQuote = await buildAuthoritativeDraftQuote({ draft, now });
  const eligibleProductIds = validateApplicability({ coupon, draft, baseQuote });
  return { ...coupon, eligibleProductIds };
};

export const applyCouponToDraft = async ({ draft, code, userId, now = new Date() }) => {
  const coupon = await resolveCouponForDraft({ code, draft, userId, now });
  const quote = await buildAuthoritativeDraftQuote({ draft, coupon, now });
  draft.pricing = quote;
  await draft.save();
  return quote;
};

export const removeCouponFromDraft = async ({ draft }) => {
  const quote = await buildAuthoritativeDraftQuote({ draft });
  draft.pricing = quote;
  await draft.save();
  return quote;
};

export const consumeDraftCoupon = async ({ draft, userId, paymentTransactionId, bookingId }) => {
  const couponId = draft.pricing?.coupon?.couponId;
  if (!couponId || !paymentTransactionId) return null;

  const existing = await Coupon.findOne({
    _id: couponId,
    "usageRecords.paymentTransaction": paymentTransactionId,
  });
  if (existing) return existing;

  const coupon = await Coupon.findOneAndUpdate({
    _id: couponId,
    isActive: true,
    isDeleted: false,
    "usageRecords.paymentTransaction": { $ne: paymentTransactionId },
    $expr: {
      $and: [
        { $or: [{ $eq: ["$usageLimit", null] }, { $lt: ["$usageCount", "$usageLimit"] }] },
        {
          $lt: [
            { $size: { $filter: { input: "$usageRecords", as: "record", cond: { $eq: ["$$record.user", userId] } } } },
            "$perCustomerLimit",
          ],
        },
      ],
    },
  }, {
    $inc: { usageCount: 1 },
    $push: { usageRecords: { user: userId, paymentTransaction: paymentTransactionId, booking: bookingId } },
  }, { new: true });

  if (!coupon) {
    // A concurrent callback may have consumed this exact transaction between
    // the preliminary lookup and the guarded update. Treat that as the same
    // idempotent success, while preserving a real limit failure.
    const concurrentlyConsumed = await Coupon.findOne({
      _id: couponId,
      "usageRecords.paymentTransaction": paymentTransactionId,
    });
    if (concurrentlyConsumed) return concurrentlyConsumed;
    throw new AppError("COUPON_USAGE_LIMIT_REACHED", 409, "couponCode");
  }
  return coupon;
};
