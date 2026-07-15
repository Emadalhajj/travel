// services/draft-bookings/draft-booking-service.js

import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import Booking from "../../models/booking/booking-model.js";
import { Counter } from "../../models/counterModel.js";

import { DRAFT_BOOKING_STATUS } from "../../constants/draft-bookings/draft-booking-status.js";
import { BOOKING_STATUS } from "../../constants/booking/booking-status.js";
import { PAYMENT_STATUS } from "../../constants/booking/payment-status.js";
import { BOOKING_TYPES } from "../../constants/booking/booking-types.js";
import { BOOKING_STEPS } from "../../constants/booking/booking-steps.js";
import BookingLog from "../../models/bookingLog-model.js";
import { 
  logBookingCreated,
  logPaymentTransactionCreated
  ,
  logInventoryReserved,
  logVoucherCreated,
 } from "../booking/booking-log-service.js";

const buildDraftExpiryDate = (hours = 24) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
};

import Inventory from "../../models/inventory-model.js";

import { reserveInventory,
  releaseInventory, } from "../booking/inventory-service.js";
import {
  releaseProgramSeats,
  reserveProgramSeats,
} from "../umrah-programs/umrah-program-service.js";


const generateBookingNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "booking" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `BK-${String(counter.seq).padStart(6, "0")}`;
};

const normalizeDraftData = (data = {}) => {
  return {
    customer: data.customer || {},
    travelers: Array.isArray(data.travelers) ? data.travelers : [],
    program: data.program || null,
    hotel: data.hotel || null,
    transport: data.transport || null,
    pricing: data.pricing || {},
    currentStep: data.currentStep || "customer_info",
    data: data.data || {},
  };
};

const buildPilgrimNameParts = (fullName = "") => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);

  return {
    first: parts[0] || "غير محدد",
    second: parts[1] || "",
    third: parts[2] || "",
    last: parts.slice(3).join(" ") || parts[1] || "غير محدد",
  };
};

const mapDraftTravelersToBookingPilgrims = (travelers = [], customer = {}) => {
  return travelers.map((traveler, index) => {
    const nameParts = buildPilgrimNameParts(traveler.fullName || customer.name);

    return {
      passportNumber: traveler.passportNumber || `DRAFT-${Date.now()}-${index}`,

      firstNameAr: traveler.firstNameAr || nameParts.first,
      secondNameAr: traveler.secondNameAr || nameParts.second,
      thirdNameAr: traveler.thirdNameAr || nameParts.third,
      lastNameAr: traveler.lastNameAr || nameParts.last,

      firstNameEn: traveler.firstNameEn || nameParts.first,
      secondNameEn: traveler.secondNameEn || nameParts.second,
      thirdNameEn: traveler.thirdNameEn || nameParts.third,
      lastNameEn: traveler.lastNameEn || nameParts.last,

      nationality: traveler.nationality || customer.nationality || "غير محدد",
      gender: traveler.gender || "male",
      birthDate: traveler.birthDate || new Date("1990-01-01"),

      mobile: traveler.mobile || customer.phone || "",
      whatsapp: traveler.whatsapp || customer.phone || "",

      isMainPilgrim: index === 0,
    };
  });
};

const buildBookingItemsFromDraft = (draft) => {
  const selectedProducts =
    draft.data?.selectedProducts ||
    draft.data?.selectedProductsList ||
    [];

  const roomProduct = selectedProducts.find(
    (item) => item.type === "roomType" || item.type === "hotel",
  );

  const visaProduct = selectedProducts.find((item) => item.type === "visa");

  const tripProduct = selectedProducts.find((item) => item.type === "trip");

  const transportProduct = selectedProducts.find(
    (item) => item.type === "transport",
  );

  return {
    room: {
      roomTypeId:
        roomProduct?.roomTypeId ||
        roomProduct?.refId ||
        null,

      roomNameAr:
        roomProduct?.nameAr ||
        roomProduct?.name?.ar ||
        draft.hotel?.roomType ||
        "",

      roomNameEn:
        roomProduct?.nameEn ||
        roomProduct?.name?.en ||
        draft.hotel?.roomType ||
        "",

      hotelId:
        draft.hotel?.hotelId ||
        roomProduct?.hotelId ||
        roomProduct?.hotel?._id ||
        null,

      hotelNameAr:
        draft.hotel?.nameAr ||
        roomProduct?.hotel?.nameAr ||
        "",

      hotelNameEn:
        draft.hotel?.nameEn ||
        roomProduct?.hotel?.nameEn ||
        "",

      checkIn: draft.program?.startDate || null,
      checkOut: draft.program?.endDate || null,

      price: Number(roomProduct?.priceAtTime || roomProduct?.price || 0),
    },

    visa: {
      visaId: visaProduct?.visaId || visaProduct?.refId || null,
      visaNameAr: visaProduct?.nameAr || visaProduct?.name?.ar || "",
      visaNameEn: visaProduct?.nameEn || visaProduct?.name?.en || "",
      price: Number(visaProduct?.priceAtTime || visaProduct?.price || 0),
    },

    trip: {
      tripId: tripProduct?.tripId || tripProduct?.refId || null,
      tripNameAr: tripProduct?.nameAr || tripProduct?.name?.ar || "",
      tripNameEn: tripProduct?.nameEn || tripProduct?.name?.en || "",
      travelDate: draft.program?.startDate || null,
      returnDate: draft.program?.endDate || null,
      price: Number(tripProduct?.priceAtTime || tripProduct?.price || 0),
    },

    transport: {
      transportId:
        draft.transport?.transportId ||
        transportProduct?.transportId ||
        transportProduct?.refId ||
        null,

      transportNameAr:
        transportProduct?.nameAr ||
        transportProduct?.name?.ar ||
        "",

      transportNameEn:
        transportProduct?.nameEn ||
        transportProduct?.name?.en ||
        "",

      vehicleType:
        draft.transport?.type ||
        transportProduct?.vehicleType ||
        transportProduct?.transportType ||
        "",

      price: Number(
        transportProduct?.priceAtTime ||
          transportProduct?.price ||
          0,
      ),
    },
  };
};

const getNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }

  return 0;
};

export const buildBookingPricingFromDraft = (draft) => {
  const travelersCount = Math.max(1, draft.travelers?.length || 1);
  const selectedPackage = draft.data?.selectedPackage || {};
  const selectedProducts =
    draft.data?.selectedProducts ||
    draft.data?.selectedProductsList ||
    [];

  const packageUnitPrice = getNumber(
    selectedPackage?.pricing?.finalPrice,
    selectedPackage?.pricing?.totalPrice,
    selectedPackage?.pricing?.basePrice,
    draft.pricing?.unitPrice,
  );

  const selectedProductsSubtotal = selectedProducts.reduce((sum, item) => {
    const price = Number(item.priceAtTime || item.price || 0);
    const quantity = Number(item.quantity || 1);

    return sum + price * quantity;
  }, 0);

  const subtotal =
    packageUnitPrice > 0
      ? packageUnitPrice * travelersCount + selectedProductsSubtotal
      : getNumber(draft.pricing?.subtotal, draft.pricing?.total);

  const discount = Number(draft.pricing?.discount || 0);
  const taxRate = 15;
  const tax = Number((subtotal * (taxRate / 100)).toFixed(2));
  const total = Math.max(0, Number((subtotal + tax - discount).toFixed(2)));

  return {
    roomPrice: 0,
    visaPrice: 0,
    tripPrice: 0,
    transportPrice: 0,

    subtotal,
    taxRate,
    taxAmount: tax,
    totalPrice: total,

    currency: draft.pricing?.currency || "SAR",
  };
};

export const buildBookingPaymentFromDraft = (
  draft,
  pricing,
  paymentData = null,
) => {
  const totalAmount =
    Number(pricing?.totalAmount) ||
    Number(pricing?.totalPrice) ||
    Number(pricing?.total) ||
    0;

  const paidAmount = Number(
    paymentData?.paidAmount ??
      draft.payment?.paidAmount ??
      draft.data?.payment?.paidAmount ??
      0,
  );

  const safePaidAmount = Math.min(paidAmount, totalAmount);

  const remainingAmount = Math.max(0, totalAmount - safePaidAmount);

  let paymentStatus = "pending";

  if (safePaidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "paid";
  } else if (safePaidAmount > 0) {
    paymentStatus = "partial";
  }

  return {
    paymentMethod:
      paymentData?.paymentMethod ||
      draft.payment?.paymentMethod ||
      draft.data?.payment?.paymentMethod ||
      "cash",

    paymentStatus,
    paidAmount: safePaidAmount,
    remainingAmount,

    transactionId:
      paymentData?.transactionId ||
      draft.payment?.transactionId ||
      draft.data?.payment?.transactionId ||
      "",

    gateway: paymentData?.gateway || "",
    paymentReference: paymentData?.paymentReference || "",
    currency:
      paymentData?.currency ||
      pricing?.currency ||
      "SAR",
  };
};

export const createDraftBooking = async ({ data = {}, userId }) => {
  const normalized = normalizeDraftData(data);

  const draft = await DraftBooking.create({
    user: userId || null,

    customer: normalized.customer,
    travelers: normalized.travelers,
    program: normalized.program,
    hotel: normalized.hotel,
    transport: normalized.transport,
    pricing: normalized.pricing,
    data: normalized.data,

    currentStep: normalized.currentStep,

    status: DRAFT_BOOKING_STATUS.DRAFT,
    expiresAt: buildDraftExpiryDate(24),
  });

  return draft;
};

export const updateDraftBooking = async ({ draftId, data }) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new Error("Draft booking not found");
  }

  if (draft.status !== DRAFT_BOOKING_STATUS.DRAFT) {
    throw new Error("Only draft bookings can be updated");
  }

  if (data.customer) {
    draft.customer = {
      ...draft.customer,
      ...data.customer,
    };
  }

  if (Array.isArray(data.travelers)) {
    draft.travelers = data.travelers;
  }

  if (data.program !== undefined) {
    draft.program = data.program;
  }

  if (data.hotel !== undefined) {
    draft.hotel = data.hotel;
  }

  if (data.transport !== undefined) {
    draft.transport = data.transport;
  }

  if (data.pricing) {
    draft.pricing = {
      ...draft.pricing,
      ...data.pricing,
    };
  }

  if (data.currentStep) {
    draft.currentStep = data.currentStep;
  }

  if (data.data) {
    draft.data = {
      ...(draft.data || {}),
      ...data.data,
    };
  }

  await draft.save();

  return draft;
};

export const getDraftBookingById = async (draftId) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  })
    .populate("user", "name email role")
    .populate("finalBooking");

  if (!draft) {
    throw new Error("Draft booking not found");
  }

  return draft;
};

export const getMyDraftBookings = async ({ userId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const filter = {
    user: userId,
    isDeleted: false,
  };

  const [items, total] = await Promise.all([
    DraftBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    DraftBooking.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
};

export const getAllDraftBookings = async ({ page = 1, limit = 10, status }) => {
  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    DraftBooking.find(filter)
      .populate("user", "name email role")
      .populate("finalBooking")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    DraftBooking.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
};

export const cancelDraftBooking = async ({ draftId , userId}) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new Error("Draft booking not found");
  }

  if (draft.status !== DRAFT_BOOKING_STATUS.DRAFT) {
    throw new Error("Only draft bookings can be cancelled");
  }

  draft.status = DRAFT_BOOKING_STATUS.CANCELLED;

  await draft.save();

  return draft;
};

// ============ 
const createPaymentTransactionFromDraft = async ({
  draft,
  booking,
  payment,
  userId,
  paymentData = null,
}) => {
  if (!payment?.paidAmount || Number(payment.paidAmount) <= 0) {
    return null;
  }

  return await PaymentTransaction.create({
    booking: booking._id,
    user: booking.user,

    amount: Number(payment.paidAmount),
    currency:
      paymentData?.currency ||
      payment.currency ||
      booking.pricing?.currency ||
      draft.pricing?.currency ||
      "SAR",

    method: payment.paymentMethod || "cash",
    status: payment.paymentStatus || "paid",

    transactionId:
      paymentData?.transactionId ||
      payment.transactionId ||
      "",

    gateway:
      paymentData?.gateway ||
      payment.gateway ||
      "",

    gatewayReference:
      paymentData?.paymentReference ||
      payment.paymentReference ||
      "",

    notes: "Payment created automatically from draft booking completion",

    createdBy: userId || booking.user || null,
  });
};
// =======================

//==================== هلبر لحجز المخزون تلقائيًا عند تحويل المسودة إلى حجز
const reserveInventoryFromDraft = async ({
  draft,
  bookingItems,
  travelersCount = 1,
  req = null,
}) => {
  const results = [];

  const room = bookingItems?.room;
  const trip = bookingItems?.trip;
  const transport = bookingItems?.transport;
  const visa = bookingItems?.visa;

  try {
    if (room?.roomTypeId && room?.checkIn && room?.checkOut) {
      const roomResult = await reserveInventory({
        Inventory,
        inventoryType: "roomType",
        itemId: room.roomTypeId,
        startDate: room.checkIn,
        endDate: room.checkOut,
        requested: 1,
        defaultTotal: 0,
        req,
      });

      results.push({
        type: "roomType",
        itemId: room.roomTypeId,
        startDate: room.checkIn,
        endDate: room.checkOut,
        requested: 1,
        result: roomResult,
      });
    }

    if (trip?.tripId && trip?.travelDate && trip?.returnDate) {
      const tripResult = await reserveInventory({
        Inventory,
        inventoryType: "trip",
        itemId: trip.tripId,
        startDate: trip.travelDate,
        endDate: trip.returnDate,
        requested: travelersCount,
        defaultTotal: 0,
        req,
      });

      results.push({
        type: "trip",
        itemId: trip.tripId,
        startDate: trip.travelDate,
        endDate: trip.returnDate,
        requested: travelersCount,
        result: tripResult,
      });
    }

    if (transport?.transportId && draft.program?.startDate && draft.program?.endDate) {
      const transportResult = await reserveInventory({
        Inventory,
        inventoryType: "transport",
        itemId: transport.transportId,
        startDate: draft.program.startDate,
        endDate: draft.program.endDate,
        requested: 1,
        defaultTotal: 0,
        req,
      });

      results.push({
        type: "transport",
        itemId: transport.transportId,
        startDate: draft.program.startDate,
        endDate: draft.program.endDate,
        requested: 1,
        result: transportResult,
      });
    }

    if (visa?.visaId && draft.program?.startDate && draft.program?.endDate) {
      const visaResult = await reserveInventory({
        Inventory,
        inventoryType: "visa",
        itemId: visa.visaId,
        startDate: draft.program.startDate,
        endDate: draft.program.endDate,
        requested: travelersCount,
        defaultTotal: 0,
        req,
      });

      results.push({
        type: "visa",
        itemId: visa.visaId,
        startDate: draft.program.startDate,
        endDate: draft.program.endDate,
        requested: travelersCount,
        result: visaResult,
      });
    }

    return results;
  } catch (error) {
    if (results.length) {
      await rollbackInventoryReservations({
        inventoryReservations: results,
        req,
      });
    }

    throw error;
  }
};
//==================== هلبر لإرجاع المخزون تلقائيًا عند فشل تحويل المسودة إلى حجز
const rollbackInventoryReservations = async ({
  inventoryReservations = [],
  req = null,
}) => {
  for (const reservation of inventoryReservations) {
    try {
      await releaseInventory({
        Inventory,
        inventoryType: reservation.type,
        itemId: reservation.itemId,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        released: reservation.requested || 1,
        req,
      });
    } catch (error) {
      console.error("Inventory rollback failed:", error);
    }
  }
};


export const convertDraftToBooking = async ({
 draftId,
  userId,
  req = null,
  paymentData = null,
}) => {
  /*
  =====================================================
  1) جلب المسودة والتحقق منها
  =====================================================
  */

  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new Error("Draft booking not found");
  }

  if (draft.status !== DRAFT_BOOKING_STATUS.DRAFT) {
    throw new Error("Only draft bookings can be converted");
  }

  if (!draft.user && !userId) {
    throw new Error("User is required to convert draft booking");
  }

  if (!draft.travelers?.length) {
    throw new Error("At least one traveler is required");
  }

  /*
  =====================================================
  2) تجهيز بيانات الحجز
  =====================================================
  */

  const bookingNumber = await generateBookingNumber();

  const pilgrims = mapDraftTravelersToBookingPilgrims(
    draft.travelers,
    draft.customer,
  );

  const pricing = buildBookingPricingFromDraft(draft);
  const payment = buildBookingPaymentFromDraft(
  draft,
  pricing,
  paymentData,
);
  const bookingItems = buildBookingItemsFromDraft(draft);

  let inventoryReservations = [];
  let programSeatsReserved = false;
  let booking = null;
  let paymentTransaction = null;
  let voucher = null;

  try {
    /*
    =====================================================
    3) حجز المخزون Inventory Reservation

    مهم:
    إذا فشل أي شيء بعد هذه الخطوة وقبل اكتمال الحجز،
    سيتم تنفيذ rollbackInventoryReservations في catch.
    =====================================================
    */

    if (draft.program?.programId) {
      await reserveProgramSeats({
        programId: draft.program.programId,
        seats: pilgrims.length,
        req,
      });

      programSeatsReserved = true;
    }

    inventoryReservations = await reserveInventoryFromDraft({
      draft,
      bookingItems,
      travelersCount: pilgrims.length,
      req,
    });

    /*
    =====================================================
    4) إنشاء الحجز Booking
    =====================================================
    */
   let booking = null;

   booking = await Booking.create({
  bookingNumber,

  user: draft.user || userId,

  customer: {
    name: draft.customer?.name || "",
    email: draft.customer?.email || "",
    phone: draft.customer?.phone || "",
    nationality: draft.customer?.nationality || "",
  },

  program: {
    programId: draft.program?.programId || null,
    nameAr: draft.program?.nameAr || "",
    nameEn: draft.program?.nameEn || "",
    startDate: draft.program?.startDate || null,
    endDate: draft.program?.endDate || null,
  },

  pilgrims,

  hotel: bookingItems.room?.hotelId || undefined,
  roomType: bookingItems.room?.roomTypeId || undefined,
  visa: bookingItems.visa?.visaId || undefined,
  trip: bookingItems.trip?.tripId || undefined,
  transport: bookingItems.transport?.transportId || undefined,

  bookingItems,

  pricing,

  paymentStatus: payment.paymentStatus,
  paymentMethod: payment.paymentMethod,
  paidAmount: payment.paidAmount,
  remainingAmount: payment.remainingAmount,

  bookingType: BOOKING_TYPES.UMRAH_PACKAGE,
  currentStep: BOOKING_STEPS.PAYMENT,
  bookingStatus: BOOKING_STATUS.PENDING,

  notes: draft.data?.notes || "",
  attachments: draft.data?.attachments || [],
  data: draft.data || {},

  createdBy: userId || draft.user || null,
});

    /*
    =====================================================
    5) تسجيل Log إنشاء الحجز
    =====================================================
    */

    await logBookingCreated({
      BookingLog,
      booking,
      req,
    });

    /*
    =====================================================
    6) تسجيل Log حجز المخزون
    =====================================================
    */

    if (inventoryReservations?.length) {
      await logInventoryReserved({
        BookingLog,
        booking,
        inventoryReservations,
        req,
      });
    }

    /*
    =====================================================
    7) إنشاء Payment Transaction إذا يوجد مبلغ مدفوع

    داخل createPaymentTransactionFromDraft
    يجب أن يتم تجاهل العملية إذا paidAmount = 0
    وترجع null.
    =====================================================
    */

   paymentTransaction = await createPaymentTransactionFromDraft({
  draft,
  booking,
  payment,
  userId,
  paymentData,
});

    /*
    =====================================================
    8) تسجيل Log عملية الدفع
    =====================================================
    */

    if (paymentTransaction) {
      await logPaymentTransactionCreated({
        BookingLog,
        booking,
        paymentTransaction,
        req,
      });
    }

    /*
    =====================================================
    9) تحديث المسودة إلى Completed

    مهم جدًا:
    يتم هذا قبل Notification و Voucher.
    لأن الحجز الآن أصبح مكتملًا من ناحية النظام الأساسية.
    =====================================================
    */

    draft.status = DRAFT_BOOKING_STATUS.COMPLETED;
    draft.finalBooking = booking._id;
    draft.currentStep = "success";

    await draft.save();

    /*
    =====================================================
    10) إرسال Notification

    هذه العملية لا يجب أن تفشل الحجز.
    لذلك داخل try/catch مستقل.
    =====================================================
    */

    try {
      await sendBookingCreatedNotification({
        Notification,
        booking,
        req,
        sendNotification,
      });
    } catch (notificationError) {
      console.error("Booking notification failed:", notificationError);
    }

    /*
    =====================================================
    11) إنشاء Voucher / PDF

    هذه العملية لا يجب أن تفشل الحجز.
    لذلك داخل try/catch مستقل.
    =====================================================
    */

    try {
      voucher = await createVoucherForBooking({
        bookingId: booking._id,
        userId: userId || draft.user || null,
      });

      if (voucher) {
        await logVoucherCreated({
          BookingLog,
          booking,
          voucher,
          req,
        });
      }
    } catch (voucherError) {
      console.error("Voucher generation failed:", voucherError);
    }

    /*
    =====================================================
    12) إرجاع النتيجة النهائية
    =====================================================
    */

    return {
      draft,
      booking,
      paymentTransaction,
      inventoryReservations,
      voucher,
    };
  } catch (error) {
    /*
    =====================================================
    Rollback Inventory

    إذا تم حجز المخزون ثم فشل أي شيء قبل اكتمال الحجز،
    يتم إرجاع المخزون.
    =====================================================
    */

    if (inventoryReservations.length) {
      await rollbackInventoryReservations({
        inventoryReservations,
        req,
      });
    }

    if (programSeatsReserved && draft.program?.programId) {
      try {
        await releaseProgramSeats({
          programId: draft.program.programId,
          seats: pilgrims.length,
          req,
        });
      } catch (releaseError) {
        console.error("Program seat rollback failed:", releaseError);
      }
    }

    throw error;
  }
};

//==================== هلبر لإنهاء صلاحية المسودات القديمة تلقائيًا  
export const expireOldDraftBookings = async () => {
  const now = new Date();

  const result = await DraftBooking.updateMany(
    {
      status: DRAFT_BOOKING_STATUS.DRAFT,
      isDeleted: false,
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: DRAFT_BOOKING_STATUS.EXPIRED,
        currentStep: "expired",
      },
    },
  );

  return result;
};
export const softDeleteDraftBooking = async ({ draftId, userId }) => {
  const draft = await DraftBooking.findById(draftId);

  if (!draft || draft.isDeleted) {
    throw new Error("Draft booking not found");
  }

  draft.isDeleted = true;
  draft.deletedAt = new Date();
  draft.deletedBy = userId || null;

  await draft.save();

  return draft;
};
