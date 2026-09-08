// services/draft-bookings/draft-booking-service.js

/*
=====================================================
Draft Booking Service
=====================================================

هذا الملف مسؤول عن:
-----------------------------------------------------
- إنشاء وتحديث المسودات.
- حساب الأسعار.
- تجهيز بيانات الحجز.
- حجز وإرجاع المخزون.
- تحويل المسودة إلى حجز نهائي.
- ربط عملية الدفع بالحجز.
- إنشاء Timeline Logs.
- إرسال الإشعارات.
- إنشاء الفاوتشر.

مهم:
-----------------------------------------------------
لا يتم الوثوق في المبلغ القادم من الواجهة.
يتم حساب السعر داخل الخادم من بيانات المسودة.
=====================================================
*/

/*
=====================================================
Models
=====================================================
*/

import DraftBooking from "../../models/draft-bookings/draft-booking-model.js";
import Booking from "../../models/booking/booking-model.js";
import BookingLog from "../../models/bookingLog-model.js";
import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";
import TripDeparture from "../../models/transportition/trip-departure-model.js";
import Trip from "../../models/transportition/trip-model.js";
import Inventory from "../../models/inventory-model.js";
import { Counter } from "../../models/counterModel.js";
import AppError from "../../utils/AppError.js";
import { deleteLocalUpload } from "../../utils/deleteLocalUpload.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { INVENTORY_TYPES } from "../../constants/inventory/inventory-types.js";
import { normalizeInventoryDate } from "../booking/inventory-service.js";

import {
  attachBookingToPaymentTransactionService,
  createPaymentTransactionService,
  detachBookingFromPaymentTransactionService,
  findPaymentTransactionService,
  markPaymentTransactionFailedService,
} from "../payment/paymentTransaction-service.js";

import {
  PAYMENT_TRANSACTION_STATUSES,
} from "../../constants/payments/payment-transaction-statuses.js";

import {
  PAYMENT_TRANSACTION_EVENT_SOURCES,
} from "../../constants/payments/payment-transaction-events.js";

/*
=====================================================
Constants
=====================================================
*/

import {
  DRAFT_BOOKING_STATUS,
} from "../../constants/draft-bookings/draft-booking-status.js";
import { TRIP_DEPARTURE_STATUS } from "../../constants/trips/trip-departure.constants.js";

import {
  BOOKING_STATUS,
} from "../../constants/booking/booking-status.js";

import {
  BOOKING_TYPES,
} from "../../constants/booking/booking-types.js";

import {
  BOOKING_STEPS,
} from "../../constants/booking/booking-steps.js";

import {
  commitInventoryHoldService,
  getInventoryHoldForCommitService,
  releaseInventoryHoldService,
} from "../booking/inventory-hold-service.js";

/*
=====================================================
Booking Log Services
=====================================================
*/

import {
  logBookingCreated,
  logPaymentTransactionCreated,
  logInventoryReserved,
  logVoucherCreated,
} from "../booking/booking-log-service.js";

/*
=====================================================
Notification Services
=====================================================
*/

import {
  sendInitialBookingNotification,
} from "../notifications/booking-notification-service.js";

/*
=====================================================
Voucher Service
=====================================================
*/

import {
  createVoucherForBooking,
} from "../voucher-service.js";

const buildDraftExpiryDate = (hours = 24) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
};

const generateBookingNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "booking" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `BK-${String(counter.seq).padStart(6, "0")}`;
};

const getSelectedTripProduct = (data = {}) => {
  const products = data?.selectedProducts || data?.selectedProductsList || [];
  if (!Array.isArray(products)) return null;

  return products.find((item) =>
    ["trip", "ticket", "flight"].includes(
      String(item?.type || "").toLowerCase(),
    ),
  ) || null;
};

const getRequestedDraftTrip = (data = {}) => {
  if (Object.hasOwn(data, "trip")) return data.trip;
  const product = getSelectedTripProduct(data.data);
  if (!product) return null;

  return {
    tripId: product.tripId || product.refId || product.productId || null,
    departureId: product.departureId || null,
    quantity: product.quantity,
    chargeType: product.chargeType,
  };
};

const resolveDraftTripSnapshot = async (requestedTrip, requestedSeats = 1) => {
  if (!requestedTrip) return null;

  if (!requestedTrip.departureId || !requestedTrip.tripId) {
    throw new AppError(
      "TRIP_DEPARTURE_DATA_INCOMPLETE",
      400,
      "trip.departureId",
    );
  }

  const departure = await TripDeparture.findOne({
    _id: requestedTrip.departureId,
    status: TRIP_DEPARTURE_STATUS.SCHEDULED,
    isActive: true,
    isDeleted: false,
    departureAt: { $gt: new Date() },
  })
    .select("tripId departureAt arrivalAt source pricing")
    .lean();

  if (!departure) {
    throw new AppError(
      "TRIP_DEPARTURE_NOT_AVAILABLE",
      400,
      "trip.departureId",
      { id: requestedTrip.departureId },
    );
  }

  if (String(departure.tripId) !== String(requestedTrip.tripId)) {
    throw new AppError("TRIP_DEPARTURE_TRIP_MISMATCH", 400, "trip.tripId");
  }

  const inventory = await Inventory.findOne({
    inventoryType: INVENTORY_TYPES.TRIP_DEPARTURE,
    itemId: departure._id,
    date: normalizeInventoryDate(departure.departureAt),
    isActive: true,
    isDeleted: { $ne: true },
    available: { $gte: getPositiveInteger(requestedSeats, 1) },
  })
    .select("_id")
    .lean();

  if (!inventory) {
    throw new AppError(
      "TRIP_DEPARTURE_NOT_AVAILABLE",
      400,
      "trip.departureId",
      { id: requestedTrip.departureId },
    );
  }

  const trip = await Trip.findOne({
    _id: departure.tripId,
    isActive: true,
    isDeleted: false,
  })
    .select("nameAr nameEn type scope subtype source fromCity toCity")
    .lean();

  if (!trip) {
    throw new AppError(
      "TRIP_DEPARTURE_NOT_AVAILABLE",
      400,
      "trip.departureId",
      { id: requestedTrip.departureId },
    );
  }

  const unitPrice = Number(
    departure.pricing?.discountPrice || departure.pricing?.basePrice || 0,
  );

  return {
    tripId: departure.tripId,
    departureId: departure._id,
    nameAr: trip.nameAr || "",
    nameEn: trip.nameEn || "",
    tripType: trip.type || "",
    scope: trip.scope || "",
    subtype: trip.subtype || "",
    source: departure.source || trip.source || "",
    fromCity: trip.fromCity || "",
    toCity: trip.toCity || "",
    departureAt: departure.departureAt,
    arrivalAt: departure.arrivalAt || null,
    quantity: getPositiveInteger(requestedTrip.quantity, 1),
    chargeType: String(
      requestedTrip.chargeType || "PER_TRAVELER",
    ).toUpperCase(),
    unitPrice,
    currency: departure.pricing?.currency || "SAR",
  };
};

const normalizeDraftData = (data = {}) => {
  return {
    customer: data.customer || {},
    travelers: Array.isArray(data.travelers) ? data.travelers : [],
    hosts: Array.isArray(data.hosts) ? data.hosts : [],
    program: data.program || null,
    hotel: data.hotel || null,
    trip: getRequestedDraftTrip(data),
    transport: data.transport || null,
    pricing: data.pricing || {},
    currentStep: data.currentStep || "customer_info",
    data: data.data || {},
  };
};

const buildPilgrimNameParts = (fullName = "") => {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    first: parts[0] || "غير محدد",
    second: parts[1] || "",
    third: parts[2] || "",
    last: parts.slice(3).join(" ") || parts[1] || "غير محدد",
  };
};

const validateCustomerPhone = (phone) => {
  const normalizedPhone = String(phone || "").trim();

  // يسمح بإنشاء مسودة أولية فارغة، لكن أي رقم مرسل يجب أن يكون صالحًا.
  if (normalizedPhone && !/^\+?\d{7,15}$/.test(normalizedPhone)) {
    throw new AppError(
      "PHONE_INVALID",
      400,
      "customer.phone",
    );
  }
};

const validateHostAssignments = ({ hosts = [], travelers = [] }) => {
  const hostIds = new Set();
  const nationalIds = new Set();

  for (const host of Array.isArray(hosts) ? hosts : []) {
    const hostId = String(host?.hostId || "").trim();
    const nationalId = String(host?.nationalId || "").trim();
    if (!hostId) throw new AppError("HOST_ID_REQUIRED", 400, "hosts");
    if (hostIds.has(hostId)) throw new AppError("DUPLICATE_HOST", 400, "hosts");
    if (nationalId && nationalIds.has(nationalId)) throw new AppError("HOST_ALREADY_ADDED", 400, "hosts");
    hostIds.add(hostId);
    if (nationalId) nationalIds.add(nationalId);
  }

  const assignments = new Map();
  for (const traveler of Array.isArray(travelers) ? travelers : []) {
    const hostId = String(traveler?.hostId || "").trim();
    if (!hostId) continue;
    if (!hostIds.has(hostId)) throw new AppError("TRAVELER_HOST_NOT_FOUND", 400, "travelers");
    const count = (assignments.get(hostId) || 0) + 1;
    if (count > 5) throw new AppError("HOST_TRAVELER_LIMIT_EXCEEDED", 400, "travelers");
    assignments.set(hostId, count);
  }
};

const validateRequiredDraftDocuments = ({ travelers = [], hosts = [] }) => {
  for (const [index, traveler] of (Array.isArray(travelers) ? travelers : []).entries()) {
    if (!String(traveler?.passportImage || "").trim()) {
      throw new AppError(
        "TRAVELER_PASSPORT_REQUIRED",
        400,
        `travelers.${index}.passportImage`,
        { index: index + 1 },
      );
    }
  }

  for (const [index, host] of (Array.isArray(hosts) ? hosts : []).entries()) {
    if (!String(host?.idImage || "").trim()) {
      throw new AppError(
        "HOST_ID_DOCUMENT_REQUIRED",
        400,
        `hosts.${index}.idImage`,
        { index: index + 1 },
      );
    }

    if (!String(host?.nationalAddressImage || "").trim()) {
      throw new AppError(
        "HOST_ADDRESS_DOCUMENT_REQUIRED",
        400,
        `hosts.${index}.nationalAddressImage`,
        { index: index + 1 },
      );
    }
  }
};

const collectDraftDocumentPaths = (draft = {}) => {
  const paths = new Set();
  const addPath = (value) => {
    const normalized = String(value || "").trim();
    if (normalized) paths.add(normalized);
  };

  const travelers = Array.isArray(draft.travelers) ? draft.travelers : [];
  for (const traveler of travelers) {
    addPath(traveler?.passportImage);
    addPath(traveler?.personalPhoto);
    addPath(traveler?.vaccinationCertificate);
    addPath(traveler?.visaAttachment);
  }

  const hosts = Array.isArray(draft.hosts) ? draft.hosts : [];
  for (const host of hosts) {
    addPath(host?.idImage);
    addPath(host?.nationalAddressImage);
  }

  return paths;
};

const getRemovedDraftDocumentPaths = ({ previousPaths, currentPaths }) =>
  [...previousPaths].filter((filePath) => !currentPaths.has(filePath));

const cleanupRemovedDraftDocuments = async (filePaths = []) => {
  if (!filePaths.length) return;

  const results = await Promise.allSettled(
    filePaths.map((filePath) => {
      const isPrivateDocument = String(filePath).startsWith("/api/private-files/drafts/");
      const storedPath = isPrivateDocument
        ? `private-uploads/draft-bookings/${String(filePath).split("/").pop()}`
        : filePath;
      return deleteLocalUpload({
        filePath: storedPath,
        allowedFolder: isPrivateDocument
          ? "private-uploads/draft-bookings"
          : "uploads/draft-bookings",
      });
    }),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Draft document cleanup failed:", {
        filePath: filePaths[index],
        message: result.reason?.message || result.reason,
      });
    }
  });
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
      passportImage: traveler.passportImage || "",
      personalPhoto: traveler.personalPhoto || "",
      vaccinationCertificate: traveler.vaccinationCertificate || "",
      visaAttachment: traveler.visaAttachment || "",
      hostId: traveler.hostId || "",

      mobile: traveler.mobile || customer.phone || "",
      whatsapp: traveler.whatsapp || customer.phone || "",

      isMainPilgrim: index === 0,
    };
  });
};

/*
=====================================================
Pricing Helpers
=====================================================
*/

const roundMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(2));
};

const toNonNegativeNumber = (
  value,
  fallback = 0,
) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }

  return number;
};

const getFirstPositiveNumber = (...values) => {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const number = Number(value);

    if (
      Number.isFinite(number) &&
      number > 0
    ) {
      return number;
    }
  }

  return 0;
};

const getProductUnitPrice = (item = {}) => {
  return getFirstPositiveNumber(
    item.pricingSnapshot?.unitPrice,
    item.pricing?.finalPrice,
    item.pricing?.unitPrice,
    item.finalPrice,
    item.priceAtTime,
    item.unitPrice,
    item.price,
  );
};

const normalizeProductType = (item = {}) => {
  return String(
    item.type ||
      item.productType ||
      item.serviceType ||
      "",
  ).toLowerCase();
};

const resolveChargeType = (item = {}) => {
  const explicitChargeType = String(
    item.chargeType ||
      item.pricingMode ||
      item.billingMode ||
      item.pricingSnapshot?.chargeType ||
      "",
  ).toUpperCase();

  if (
    [
      "PER_TRAVELER",
      "PER_UNIT",
      "PER_BOOKING",
    ].includes(explicitChargeType)
  ) {
    return explicitChargeType;
  }

  const productType = normalizeProductType(item);

  if (
    [
      "visa",
      "trip",
      "ticket",
      "flight",
    ].includes(productType)
  ) {
    return "PER_TRAVELER";
  }

  if (
    [
      "room",
      "roomtype",
      "hotel",
    ].includes(productType)
  ) {
    return "PER_UNIT";
  }

  if (
    [
      "transport",
      "transfer",
    ].includes(productType)
  ) {
    return "PER_BOOKING";
  }

  return "PER_UNIT";
};

const resolveProductQuantity = ({
  item,
  chargeType,
  travelersCount,
}) => {
  if (chargeType === "PER_TRAVELER") {
    return travelersCount;
  }

  if (chargeType === "PER_BOOKING") {
    return 1;
  }

  return Math.max(
    1,
    toNonNegativeNumber(
      item.quantity ??
        item.roomsCount ??
        item.unitsCount ??
        1,
      1,
    ),
  );
};

const isPackageExtra = (item = {}) => {
  return (
    item.isExtra === true ||
    item.extra === true ||
    item.includedInPackage === false ||
    item.isIncluded === false
  );
};

const calculateProductPricingLine = ({
  item,
  travelersCount,
}) => {
  const unitPrice = getProductUnitPrice(item);
  const chargeType = resolveChargeType(item);
  const quantity = resolveProductQuantity({
    item,
    chargeType,
    travelersCount,
  });
  const total = roundMoney(
    unitPrice * quantity,
  );

  return {
    refId:
      item.refId ||
      item.productId ||
      item._id ||
      null,
    type:
      item.type ||
      item.productType ||
      "",
    nameAr:
      item.nameAr ||
      item.name?.ar ||
      "",
    nameEn:
      item.nameEn ||
      item.name?.en ||
      "",
    chargeType,
    unitPrice,
    quantity,
    total,
    isExtra: isPackageExtra(item),
  };
};

const getPositiveInteger = (
  value,
  fallback = 1,
) => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return fallback;
  }

  return Math.max(
    1,
    Math.floor(number),
  );
};

/*
=====================================================
buildBookingItemsFromDraft
=====================================================
*/

export const buildBookingItemsFromDraft = (
  draft,
) => {
  const selectedProductsSource =
    draft.data?.selectedProducts ||
    draft.data?.selectedProductsList ||
    [];

  const selectedProducts =
    Array.isArray(selectedProductsSource)
      ? selectedProductsSource
      : [];

  const roomProduct =
    selectedProducts.find((item) =>
      [
        "room",
        "roomtype",
        "hotel",
      ].includes(
        String(item.type || "").toLowerCase(),
      ),
    );

  const visaProduct =
    selectedProducts.find(
      (item) =>
        String(
          item.type || "",
        ).toLowerCase() === "visa",
    );

  const tripProduct =
    selectedProducts.find((item) =>
      [
        "trip",
        "ticket",
        "flight",
      ].includes(
        String(item.type || "").toLowerCase(),
      ),
    );

  const draftTrip = draft.trip || null;
  const departureId =
    draftTrip?.departureId ||
    tripProduct?.departureId ||
    (tripProduct?.tripId
      ? tripProduct?._id || tripProduct?.refId || tripProduct?.productId
      : null);
  const hasDepartureIdentity = Boolean(departureId);
  const resolvedTripId =
    draftTrip?.tripId ||
    tripProduct?.tripId ||
    (!hasDepartureIdentity
      ? tripProduct?.refId || tripProduct?.productId || null
      : null);

  const transportProduct =
    selectedProducts.find((item) =>
      [
        "transport",
        "transfer",
      ].includes(
        String(item.type || "").toLowerCase(),
      ),
    );

  const roomQuantity =
    getPositiveInteger(
      roomProduct?.quantity ??
        roomProduct?.roomsCount ??
        roomProduct?.unitsCount ??
        draft.hotel?.quantity ??
        draft.hotel?.roomsCount ??
        1,
      1,
    );

  const transportQuantity =
    getPositiveInteger(
      transportProduct?.quantity ??
        transportProduct?.vehiclesCount ??
        transportProduct?.unitsCount ??
        draft.transport?.quantity ??
        1,
      1,
    );

  return {
    room: {
      roomTypeId:
        roomProduct?.roomTypeId ||
        roomProduct?.refId ||
        roomProduct?.productId ||
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
      checkIn:
        roomProduct?.checkIn ||
        draft.hotel?.checkIn ||
        draft.program?.startDate ||
        null,
      checkOut:
        roomProduct?.checkOut ||
        draft.hotel?.checkOut ||
        draft.program?.endDate ||
        null,
      quantity: roomQuantity,
      chargeType:
        String(
          roomProduct?.chargeType ||
          "PER_UNIT",
        ).toUpperCase(),
      unitPrice:
        getProductUnitPrice(
          roomProduct || {},
        ),
      price:
        roundMoney(
          getProductUnitPrice(
            roomProduct || {},
          ) * roomQuantity,
        ),
    },

    visa: {
      visaId:
        visaProduct?.visaId ||
        visaProduct?.refId ||
        visaProduct?.productId ||
        null,
      visaNameAr:
        visaProduct?.nameAr ||
        visaProduct?.name?.ar ||
        "",
      visaNameEn:
        visaProduct?.nameEn ||
        visaProduct?.name?.en ||
        "",
      quantity:
        getPositiveInteger(
          visaProduct?.quantity || 1,
          1,
        ),
      chargeType:
        String(
          visaProduct?.chargeType ||
          "PER_TRAVELER",
        ).toUpperCase(),
      unitPrice:
        getProductUnitPrice(
          visaProduct || {},
        ),
      price:
        getProductUnitPrice(
          visaProduct || {},
        ),
    },

    trip: {
      tripId: resolvedTripId,
      departureId,
      tripNameAr:
        draftTrip?.nameAr ||
        tripProduct?.nameAr ||
        tripProduct?.name?.ar ||
        "",
      tripNameEn:
        draftTrip?.nameEn ||
        tripProduct?.nameEn ||
        tripProduct?.name?.en ||
        "",
      tripType: draftTrip?.tripType || tripProduct?.tripType || "",
      scope: draftTrip?.scope || tripProduct?.scope || "",
      subtype: draftTrip?.subtype || tripProduct?.subtype || "",
      source: draftTrip?.source || tripProduct?.source || "",
      fromCity: draftTrip?.fromCity || tripProduct?.fromCity || "",
      toCity: draftTrip?.toCity || tripProduct?.toCity || "",
      departureAt:
        draftTrip?.departureAt || tripProduct?.departureAt || null,
      arrivalAt:
        draftTrip?.arrivalAt || tripProduct?.arrivalAt || null,
      travelDate:
        draftTrip?.departureAt ||
        tripProduct?.departureAt ||
        tripProduct?.travelDate ||
        draft.program?.startDate ||
        null,
      returnDate:
        draftTrip?.arrivalAt ||
        tripProduct?.arrivalAt ||
        tripProduct?.returnDate ||
        draft.program?.endDate ||
        null,
      quantity:
        getPositiveInteger(
          draftTrip?.quantity ?? tripProduct?.quantity ?? 1,
          1,
        ),
      chargeType:
        String(
          draftTrip?.chargeType || tripProduct?.chargeType ||
          "PER_TRAVELER",
        ).toUpperCase(),
      unitPrice:
        getFirstPositiveNumber(
          draftTrip?.unitPrice,
          tripProduct?.pricingSnapshot?.unitPrice,
          getProductUnitPrice(tripProduct || {}),
        ),
      price:
        getFirstPositiveNumber(
          draftTrip?.unitPrice,
          getProductUnitPrice(tripProduct || {}),
        ),
    },

    transport: {
      transportId:
        draft.transport?.transportId ||
        transportProduct?.transportId ||
        transportProduct?.refId ||
        transportProduct?.productId ||
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
      startDate:
        transportProduct?.startDate ||
        draft.program?.startDate ||
        null,
      endDate:
        transportProduct?.endDate ||
        draft.program?.endDate ||
        null,
      quantity: transportQuantity,
      chargeType:
        String(
          transportProduct?.chargeType ||
          "PER_BOOKING",
        ).toUpperCase(),
      unitPrice:
        getProductUnitPrice(
          transportProduct || {},
        ),
      price:
        roundMoney(
          getProductUnitPrice(
            transportProduct || {},
          ) * transportQuantity,
        ),
    },
  };
};

export const buildBookingProductReferences = (bookingItems = {}) => ({
  hotel: bookingItems.room?.hotelId || undefined,
  roomType: bookingItems.room?.roomTypeId || undefined,
  visa: bookingItems.visa?.visaId || undefined,
  trip: bookingItems.trip?.tripId || undefined,
  tripDeparture: bookingItems.trip?.departureId || undefined,
  transport: bookingItems.transport?.transportId || undefined,
});

/*
=====================================================
buildBookingPricingFromDraft
=====================================================
*/

export const buildBookingPricingFromDraft = (
  draft,
) => {
  const travelersCount = Math.max(
    1,
    Array.isArray(draft.travelers)
      ? draft.travelers.length
      : 0,
  );

  const selectedPackage =
    draft.data?.selectedPackage || null;

  const selectedProductsSource =
    draft.data?.selectedProducts ||
    draft.data?.selectedProductsList ||
    [];

  const selectedProducts =
    Array.isArray(selectedProductsSource)
      ? selectedProductsSource
      : [];

  const packageUnitPrice =
    getFirstPositiveNumber(
      selectedPackage?.pricingSnapshot
        ?.unitPrice,
      selectedPackage?.pricing?.finalPrice,
      selectedPackage?.pricing?.totalPrice,
      selectedPackage?.pricing?.basePrice,
      selectedPackage?.finalPrice,
      selectedPackage?.priceAtTime,
      selectedPackage?.unitPrice,
      selectedPackage?.price,
      draft.pricing?.unitPrice,
    );

  const explicitPackageType = String(
    draft.data?.packageType ||
      draft.data?.bookingMode ||
      draft.data?.bookingType ||
      "",
  ).toUpperCase();

  const hasSelectedPackage = Boolean(
    selectedPackage?._id ||
      selectedPackage?.id ||
      selectedPackage?.refId ||
      selectedPackage?.programId,
  );

  const hasReadyPackage =
    packageUnitPrice > 0 &&
    (
      hasSelectedPackage ||
      explicitPackageType === "READY_PACKAGE" ||
      explicitPackageType === "PREDEFINED_PACKAGE"
    );

  const productLines =
    selectedProducts.map((item) =>
      calculateProductPricingLine({
        item,
        travelersCount,
      }),
    );

  let packageSubtotal = 0;
  let productsSubtotal = 0;
  let pricingSource = "CUSTOM_PACKAGE";

  if (hasReadyPackage) {
    packageSubtotal = roundMoney(
      packageUnitPrice * travelersCount,
    );

    productsSubtotal = roundMoney(
      productLines
        .filter((line) => line.isExtra)
        .reduce(
          (sum, line) =>
            sum + line.total,
          0,
        ),
    );

    pricingSource = "READY_PACKAGE";
  } else {
    productsSubtotal = roundMoney(
      productLines.reduce(
        (sum, line) =>
          sum + line.total,
        0,
      ),
    );
  }

  let subtotal = roundMoney(
    packageSubtotal + productsSubtotal,
  );

  if (subtotal <= 0) {
    subtotal = roundMoney(
      getFirstPositiveNumber(
        draft.pricing?.subtotal,
        draft.pricing?.subTotal,
        draft.pricing?.totalBeforeTax,
      ),
    );

    pricingSource = "LEGACY_DRAFT_PRICING";
  }

  const requestedDiscount =
    toNonNegativeNumber(
      draft.pricing?.discount,
      0,
    );

  const discount = roundMoney(
    Math.min(
      requestedDiscount,
      subtotal,
    ),
  );

  const taxRate =
    toNonNegativeNumber(
      draft.pricing?.taxRate,
      15,
    );

  const pricesIncludeTax =
    draft.pricing?.pricesIncludeTax === true ||
    draft.pricing?.taxIncluded === true;

  const taxableAmount = roundMoney(
    Math.max(
      0,
      subtotal - discount,
    ),
  );

  const taxAmount = pricesIncludeTax
    ? 0
    : roundMoney(
        taxableAmount *
          (taxRate / 100),
      );

  const totalPrice = roundMoney(
    taxableAmount + taxAmount,
  );

  /*
  في الباقة الجاهزة نعرض فقط الخدمات المدفوعة كإضافات.
  أما في البرنامج المخصص فنعرض جميع المنتجات.
  */
  const billableProductLines =
    hasReadyPackage
      ? productLines.filter(
          (line) => line.isExtra,
        )
      : productLines;

  const getTypeTotal = (...types) => {
    const normalizedTypes =
      types.map((type) =>
        String(type).toLowerCase(),
      );

    return roundMoney(
      billableProductLines
        .filter((line) =>
          normalizedTypes.includes(
            String(
              line.type || "",
            ).toLowerCase(),
          ),
        )
        .reduce(
          (sum, line) =>
            sum + line.total,
          0,
        ),
    );
  };

  return {
    pricingSource,
    travelersCount,
    packageUnitPrice:
      hasReadyPackage
        ? roundMoney(packageUnitPrice)
        : 0,
    packageSubtotal,
    productsSubtotal,
    roomPrice:
      getTypeTotal(
        "room",
        "roomType",
        "hotel",
      ),
    visaPrice:
      getTypeTotal("visa"),
    tripPrice:
      getTypeTotal(
        "trip",
        "ticket",
        "flight",
      ),
    transportPrice:
      getTypeTotal(
        "transport",
        "transfer",
      ),
    subtotal,
    discount,
    taxableAmount,
    taxRate,
    taxAmount,
    pricesIncludeTax,
    totalPrice,
    totalAmount: totalPrice,
    currency: String(
      draft.pricing?.currency ||
      selectedPackage?.pricing?.currency ||
      "SAR",
    ).toUpperCase(),
    breakdown: {
      package: hasReadyPackage
        ? {
            unitPrice:
              roundMoney(
                packageUnitPrice,
              ),
            travelersCount,
            total:
              packageSubtotal,
          }
        : null,
      products: hasReadyPackage
        ? productLines.filter(
            (line) =>
              line.isExtra,
          )
        : productLines,
    },
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

  const rawPaidAmount = Number(
    paymentData?.paidAmount ??
      draft.payment?.paidAmount ??
      draft.data?.payment?.paidAmount ??
      0,
  );

  const safePaidAmount = Math.max(
    0,
    Math.min(
      Number.isFinite(rawPaidAmount)
        ? rawPaidAmount
        : 0,
      totalAmount,
    ),
  );

  const remainingAmount = Math.max(0, totalAmount - safePaidAmount);

  let paymentStatus = "pending";

  if (safePaidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "paid";
  } else if (safePaidAmount > 0) {
    paymentStatus = "partial";
  }

  return {
    paymentMethod: String(
      paymentData?.paymentMethod ||
      draft.payment?.paymentMethod ||
      draft.data?.payment?.paymentMethod ||
      "CASH",
    ).toUpperCase(),

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
    currency: paymentData?.currency || pricing?.currency || "SAR",
  };
};

export const createDraftBooking = async ({ data = {}, userId }) => {
  const normalized = normalizeDraftData(data);
  normalized.trip = await resolveDraftTripSnapshot(
    normalized.trip,
    normalized.travelers.length || normalized.data?.searchCriteria?.travelersCount || 1,
  );
  validateCustomerPhone(normalized.customer?.phone);
  validateHostAssignments({ hosts: normalized.hosts, travelers: normalized.travelers });

  const draft = await DraftBooking.create({
    user: userId || null,

    customer: normalized.customer,
    travelers: normalized.travelers,
    hosts: normalized.hosts,
    program: normalized.program,
    hotel: normalized.hotel,
    trip: normalized.trip,
    transport: normalized.transport,
    pricing: normalized.pricing,
    data: normalized.data,

    currentStep: normalized.currentStep,

    status: DRAFT_BOOKING_STATUS.DRAFT,
    expiresAt: buildDraftExpiryDate(24),
  });

  return draft;
};
export const updateDraftBooking = async ({ draftId, data, userId }) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
  });

  if (!draft) {
    throw new AppError("DRAFT_BOOKING_NOT_FOUND", 404);
  }

  if (userId && String(draft.user || "") !== String(userId)) {
    throw new AppError("DRAFT_UPDATE_FORBIDDEN", 403);
  }

  if (draft.status !== DRAFT_BOOKING_STATUS.DRAFT) {
    throw new AppError("DRAFT_STATUS_UPDATE_FORBIDDEN", 400);
  }

  const previousDocumentPaths = collectDraftDocumentPaths(draft);

  if (data.customer) {
    validateCustomerPhone(data.customer.phone);

    draft.customer = {
      ...draft.customer,
      ...data.customer,
    };
  }

  const nextTravelers = Array.isArray(data.travelers) ? data.travelers : draft.travelers;
  const nextHosts = Array.isArray(data.hosts) ? data.hosts : draft.hosts;
  validateHostAssignments({ hosts: nextHosts, travelers: nextTravelers });

  if (["review", "payment", "success"].includes(data.currentStep)) {
    validateRequiredDraftDocuments({ hosts: nextHosts, travelers: nextTravelers });
  }

  if (Array.isArray(data.travelers)) {
    draft.travelers = data.travelers;
  }

  if (Array.isArray(data.hosts)) draft.hosts = data.hosts;

  if (data.program !== undefined) {
    draft.program = data.program;
  }

  if (data.hotel !== undefined) {
    draft.hotel = data.hotel;
  }

  const hasSelectedTripUpdate = Boolean(
    data.data &&
    (Object.hasOwn(data.data, "selectedProducts") ||
      Object.hasOwn(data.data, "selectedProductsList")),
  );
  if (data.trip !== undefined || hasSelectedTripUpdate) {
    draft.trip = await resolveDraftTripSnapshot(
      getRequestedDraftTrip(data),
      data.travelers?.length ||
        data.data?.searchCriteria?.travelersCount ||
        draft.travelers?.length ||
        1,
    );
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

  const currentDocumentPaths = collectDraftDocumentPaths(draft);
  const removedDocumentPaths = getRemovedDraftDocumentPaths({
    previousPaths: previousDocumentPaths,
    currentPaths: currentDocumentPaths,
  });

  await draft.save();

  await cleanupRemovedDraftDocuments(removedDocumentPaths);

  return draft;
};

export const getDraftBookingById = async ({ draftId, userId }) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    user: userId,
    isDeleted: false,
  })
    .populate("user", "name email role")
    .populate("finalBooking");

  if (!draft) {
    throw new Error("Draft booking not found");
  }

  return draft;
};

/*
=====================================================
Draft Payment Review Status
=====================================================
*/

export const markDraftPendingPaymentReviewService = async ({ draftId }) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
    status: {
      $in: [
        DRAFT_BOOKING_STATUS.DRAFT,
        DRAFT_BOOKING_STATUS.PENDING_REVIEW,
      ],
    },
  });

  if (!draft) {
    throw new Error("Draft booking is not available for payment review");
  }

  draft.status = DRAFT_BOOKING_STATUS.PENDING_REVIEW;
  draft.currentStep = "payment";
  draft.expiresAt = null;
  await draft.save();

  return draft;
};

export const restoreDraftAfterPaymentRejectionService = async ({ draftId }) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    isDeleted: false,
    status: DRAFT_BOOKING_STATUS.PENDING_REVIEW,
  });

  if (!draft) return null;

  draft.status = DRAFT_BOOKING_STATUS.DRAFT;
  draft.currentStep = "payment";
  draft.expiresAt = buildDraftExpiryDate(24);
  await draft.save();

  return draft;
};

export const buildMyDraftListPipeline = ({ filter, status, skip, limit }) => [
  { $match: filter },
  {
    $lookup: {
      from: PaymentTransaction.collection.name,
      let: { draftId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$draftBooking", "$$draftId"] },
            status: {
              $in: [
                PAYMENT_TRANSACTION_STATUSES.PENDING_VERIFICATION,
                PAYMENT_TRANSACTION_STATUSES.PENDING_REVIEW,
              ],
            },
            isDeleted: { $ne: true },
          },
        },
        { $sort: { updatedAt: -1, _id: -1 } },
        { $limit: 1 },
        {
          $project: {
            status: 1,
            methodCode: 1,
            paymentReference: 1,
          },
        },
      ],
      as: "reviewTransactions",
    },
  },
  {
    $set: {
      reviewTransaction: { $arrayElemAt: ["$reviewTransactions", 0] },
    },
  },
  {
    $match: status === DRAFT_BOOKING_STATUS.PENDING_REVIEW
      ? {
          $or: [
            { status: DRAFT_BOOKING_STATUS.PENDING_REVIEW },
            { reviewTransaction: { $ne: null } },
          ],
        }
      : {
          status: DRAFT_BOOKING_STATUS.DRAFT,
          reviewTransaction: null,
        },
  },
  {
    $facet: {
      items: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            status: 1,
            currentStep: 1,
            "customer.name": 1,
            "program.nameAr": 1,
            "program.nameEn": 1,
            "pricing.total": 1,
            "pricing.currency": 1,
            finalBooking: 1,
            expiresAt: 1,
            createdAt: 1,
            updatedAt: 1,
            reviewTransaction: 1,
            travelersCount: {
              $size: { $ifNull: ["$travelers", []] },
            },
          },
        },
      ],
      total: [{ $count: "count" }],
    },
  },
  {
    $project: {
      items: 1,
      total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
    },
  },
];

export const serializeDraftListItem = (draft = {}, reviewTransaction = null) => ({
  _id: draft._id,
  status: reviewTransaction
    ? DRAFT_BOOKING_STATUS.PENDING_REVIEW
    : draft.status,
  currentStep: draft.currentStep || "",
  customer: { name: draft.customer?.name || "" },
  program: {
    nameAr: draft.program?.nameAr || "",
    nameEn: draft.program?.nameEn || "",
  },
  pricing: {
    total: Number(draft.pricing?.total) || 0,
    currency: draft.pricing?.currency || "SAR",
  },
  travelersCount: Number(draft.travelersCount) || 0,
  finalBooking: draft.finalBooking || null,
  expiresAt: draft.expiresAt || null,
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
  ...(reviewTransaction ? {
    paymentTransactionId: reviewTransaction._id,
    paymentStatus: String(reviewTransaction.status || "").toUpperCase(),
    paymentMethodCode: reviewTransaction.methodCode || "",
    paymentReference: reviewTransaction.paymentReference || "",
  } : {}),
});

export const getMyDraftBookings = async ({
  userId,
  page = 1,
  limit = 10,
  status = DRAFT_BOOKING_STATUS.DRAFT,
}) => {
  const pagination = buildPagination({ page, limit });

  const filter = {
    user: userId,
    isDeleted: false,
  };
  const [result = { items: [], total: 0 }] = await DraftBooking.aggregate(
    buildMyDraftListPipeline({
      filter,
      status,
      skip: pagination.skip,
      limit: pagination.limit,
    }),
  );

  return {
    items: result.items.map((draft) =>
      serializeDraftListItem(draft, draft.reviewTransaction)),
    total: result.total,
    page: pagination.page,
    pages: Math.ceil(result.total / pagination.limit),
    limit: pagination.limit,
  };
};

export const getAllDraftBookings = async ({ page = 1, limit = 10, status }) => {
  const pagination = buildPagination({ page, limit });

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
      .skip(pagination.skip)
      .limit(pagination.limit),

    DraftBooking.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    pages: Math.ceil(total / pagination.limit),
    limit: pagination.limit,
  };
};

export const cancelDraftBooking = async ({ draftId, userId }) => {
  const draft = await DraftBooking.findOne({
    _id: draftId,
    user: userId,
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
  const paidAmount = Number(
    payment?.paidAmount || 0,
  );

  if (
    !Number.isFinite(paidAmount) ||
    paidAmount <= 0
  ) {
    return null;
  }

  /*
  =====================================================
  معاملة موجودة مسبقًا من Checkout أو Bank Transfer
  =====================================================

  لا نحدث MongoDB مباشرة هنا.
  يتم ربط الحجز من خلال PaymentTransaction Layer فقط.
  */

  if (paymentData?.paymentTransactionId) {
    const transaction =
      await findPaymentTransactionService({
        transactionId:
          paymentData.paymentTransactionId,
      });

    await attachBookingToPaymentTransactionService({
      transactionId: transaction._id,
      bookingId: booking._id,
      updatedBy:
        userId || booking.user || draft.user || null,
      source:
        PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
      message:
        "Booking attached during draft conversion",
    });

    return findPaymentTransactionService({
      transactionId: transaction._id,
    });
  }

  /*
  =====================================================
  دفعة إدارية أو يدوية بدون معاملة سابقة
  =====================================================

  يتم إنشاؤها عبر الخدمة المركزية ولا يتم استخدام
  PaymentTransaction.create() داخل Draft Service.
  */

  return createPaymentTransactionService({
    draftBooking: draft._id,
    booking: booking._id,
    user:
      booking.user || draft.user || userId || null,
    paymentMethodCode:
      paymentData?.paymentMethod ||
      payment?.paymentMethod ||
      "CASH",
    providerCode:
      paymentData?.gateway ||
      payment?.gateway ||
      "",
    amount: paidAmount,
    currency:
      paymentData?.currency ||
      payment?.currency ||
      booking.pricing?.currency ||
      draft.pricing?.currency ||
      "SAR",
    status:
      PAYMENT_TRANSACTION_STATUSES.SUCCESS,
    paymentReference:
      paymentData?.paymentReference ||
      payment?.paymentReference ||
      "",
    createdBy:
      userId || booking.user || draft.user || null,
    reuseExisting: true,
    eventSource:
      PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
  });
};
// =======================

export const convertDraftToBooking = async ({
  draftId,
  userId,
  req = null,
  paymentData = null,
  inventoryHoldId = null,
  allowExpiredInventoryHold = false,
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

  /*
  تكرار Webhook أو Callback لا ينشئ حجزًا جديدًا.
  إذا اكتمل التحويل سابقًا نعيد الحجز الموجود.
  */
  if (
    draft.status === DRAFT_BOOKING_STATUS.COMPLETED &&
    draft.finalBooking
  ) {
    const existingBooking =
      await Booking.findOne({
        _id: draft.finalBooking,
        isDeleted: false,
      });

    if (existingBooking) {
      if (inventoryHoldId) {
        if (!paymentData?.paymentTransactionId) {
          throw new AppError(
            "PAYMENT_REQUIRED_FOR_HOLD_CONVERSION",
            400,
            "paymentTransaction",
          );
        }
        const existingHold = await getInventoryHoldForCommitService({
          holdId: inventoryHoldId,
          draftBooking: draft._id,
          paymentTransaction: paymentData?.paymentTransactionId,
          allowExpired: allowExpiredInventoryHold,
        });
        await commitInventoryHoldService({ holdId: existingHold._id });
      }

      const existingPaymentTransaction =
        paymentData?.paymentTransactionId
          ? await findPaymentTransactionService({
              transactionId:
                paymentData.paymentTransactionId,
            })
          : null;

      return {
        draft,
        booking: existingBooking,
        paymentTransaction:
          existingPaymentTransaction,
        inventoryReservations: [],
        voucher: null,
        reused: true,
      };
    }
  }

  if (
    ![
      DRAFT_BOOKING_STATUS.DRAFT,
      DRAFT_BOOKING_STATUS.PENDING_REVIEW,
    ].includes(draft.status)
  ) {
    throw new Error("Only draft bookings can be converted");
  }

  if (!draft.user && !userId) {
    throw new Error("User is required to convert draft booking");
  }

  if (!draft.travelers?.length) {
    throw new Error("At least one traveler is required");
  }

  validateHostAssignments({ hosts: draft.hosts, travelers: draft.travelers });
  validateRequiredDraftDocuments({ hosts: draft.hosts, travelers: draft.travelers });

  let inventoryHold = null;
  let ownsInventoryHold = false;
  if (inventoryHoldId) {
    if (!paymentData?.paymentTransactionId) {
      throw new AppError(
        "PAYMENT_REQUIRED_FOR_HOLD_CONVERSION",
        400,
        "paymentTransaction",
      );
    }

    inventoryHold = await getInventoryHoldForCommitService({
      holdId: inventoryHoldId,
      draftBooking: draft._id,
      paymentTransaction: paymentData.paymentTransactionId,
      allowExpired: allowExpiredInventoryHold,
    });
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
  const payment = buildBookingPaymentFromDraft(draft, pricing, paymentData);
  const bookingItems = buildBookingItemsFromDraft(draft);

  let inventoryReservations = inventoryHold?.inventoryReservations || [];
  let booking = null;
  let paymentTransaction = null;
  let voucher = null;
  let draftCompleted = false;
  const originalDraftState = {
    status: draft.status,
    finalBooking: draft.finalBooking || null,
    currentStep: draft.currentStep,
  };

  try {
    if (!inventoryHold) {
      const { ensureDraftInventoryHoldService } = await import(
        "./draft-inventory-hold-service.js"
      );
      inventoryHold = await ensureDraftInventoryHoldService({
        draft,
        idempotencyKey: `booking-conversion:${draft._id}`,
        userId: userId || draft.user || null,
        req,
      });
      ownsInventoryHold = Boolean(inventoryHold);
      inventoryReservations = inventoryHold?.inventoryReservations || [];
    }

    /*
    =====================================================
    4) إنشاء الحجز Booking
    =====================================================
    */
    const isFullyPaid =
      payment.paymentStatus === "paid" &&
      Number(payment.remainingAmount || 0) <= 0;

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

      hosts: Array.isArray(draft.hosts) ? draft.hosts : [],

      ...buildBookingProductReferences(bookingItems),

      bookingItems,

      pricing,

      paymentStatus: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      paidAmount: payment.paidAmount,
      remainingAmount: payment.remainingAmount,

      bookingType: BOOKING_TYPES.UMRAH_PACKAGE,
      currentStep: BOOKING_STEPS.PAYMENT,
      bookingStatus: isFullyPaid
        ? BOOKING_STATUS.CONFIRMED
        : BOOKING_STATUS.PENDING,
      confirmedAt: isFullyPaid ? new Date() : null,

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
    draftCompleted = true;

    if (inventoryHold) {
      await commitInventoryHoldService({
        holdId: inventoryHold._id,
      });
    }

    /*
    =====================================================
    10) إرسال Notification

    هذه العملية لا يجب أن تفشل الحجز.
    لذلك داخل try/catch مستقل.
    =====================================================
    */

    try {
      await sendInitialBookingNotification({
        booking,
        req,
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
      inventoryHold,
    };
  } catch (error) {
    if (draftCompleted) {
      try {
        draft.status = originalDraftState.status;
        draft.finalBooking = originalDraftState.finalBooking;
        draft.currentStep = originalDraftState.currentStep;
        await draft.save();
      } catch (draftRollbackError) {
        console.error("Draft completion rollback failed:", draftRollbackError);
      }
    }
    /*
    إذا كانت معاملة الدفع موجودة قبل إنشاء الحجز،
    نفصلها عن الحجز الذي سيتم حذفه.
    */
    if (
      paymentData?.paymentTransactionId &&
      booking?._id
    ) {
      try {
        await detachBookingFromPaymentTransactionService({
          transactionId:
            paymentData.paymentTransactionId,
          bookingId: booking._id,
          updatedBy:
            userId || draft.user || null,
          source:
            PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
          message:
            "Booking detached because draft conversion rolled back",
        });
      } catch (paymentRollbackError) {
        console.error(
          "Payment transaction rollback failed:",
          paymentRollbackError,
        );
      }
    }

    /*
    إذا كانت المعاملة قد أُنشئت داخل هذه العملية،
    نحذفها لأنها مرتبطة بحجز فشل إنشاؤه.
    */
    if (
      paymentTransaction?._id &&
      !paymentData?.paymentTransactionId
    ) {
      try {
        await markPaymentTransactionFailedService({
          transactionId:
            paymentTransaction._id,
          reason:
            "Booking creation rolled back",
          source:
            PAYMENT_TRANSACTION_EVENT_SOURCES.SYSTEM,
          updatedBy:
            userId || draft.user || null,
        });
      } catch (paymentFailureError) {
        console.error(
          "Created payment transaction status update failed:",
          paymentFailureError,
        );
      }
    }

    /*
    حذف سجلات Timeline المرتبطة بالحجز الفاشل
    حتى لا تبقى سجلات يتيمة.
    */
    if (booking?._id) {
      try {
        await BookingLog.deleteMany({
          booking: booking._id,
        });
      } catch (bookingLogRollbackError) {
        console.error(
          "Booking log rollback failed:",
          bookingLogRollbackError,
        );
      }
    }

    /*
    إذا تم إنشاء الحجز ثم فشل جزء أساسي لاحق،
    نحذف الحجز قبل إعادة المخزون.
    */

    if (booking?._id) {
      try {
        await Booking.findByIdAndDelete(
          booking._id,
        );
      } catch (bookingRollbackError) {
        console.error(
          "Booking rollback failed:",
          bookingRollbackError,
        );
      }
    }

    /*
    =====================================================
    Rollback Inventory

    إذا تم حجز المخزون ثم فشل أي شيء قبل اكتمال الحجز،
    يتم إرجاع المخزون.
    =====================================================
    */

    if (ownsInventoryHold && inventoryHold?._id) {
      try {
        await releaseInventoryHoldService({
          holdId: inventoryHold._id,
          reason: "Booking conversion failed",
          req,
        });
      } catch (inventoryHoldRollbackError) {
        console.error(
          "Inventory hold rollback failed:",
          inventoryHoldRollbackError,
        );
      }
    }

    throw error;
  }
};

/*
=====================================================
expireOldDraftBookings
=====================================================

تغلق المسودات التي انتهت صلاحيتها ولم تتحول إلى حجز.
=====================================================
*/

export const expireOldDraftBookings =
  async ({ now = new Date(), excludedDraftIds = [] } = {}) => {
    const filter = {
      status: DRAFT_BOOKING_STATUS.DRAFT,
      isDeleted: false,
      expiresAt: {
        $ne: null,
        $lte: now,
      },
    };

    if (excludedDraftIds.length) {
      filter._id = { $nin: excludedDraftIds };
    }

    return DraftBooking.updateMany(
      filter,
      {
        $set: {
          status:
            DRAFT_BOOKING_STATUS.EXPIRED,
          currentStep: "expired",
        },
      },
    );
  };

/*
=====================================================
softDeleteDraftBooking
=====================================================

حذف منطقي للمسودة دون حذفها نهائيًا من MongoDB.
=====================================================
*/

export const softDeleteDraftBooking = async ({
  draftId,
  userId,
}) => {
  const draft =
    await DraftBooking.findOne({
      _id: draftId,
      isDeleted: false,
    });

  if (!draft) {
    throw new Error(
      "Draft booking not found",
    );
  }

  draft.isDeleted = true;
  draft.deletedAt = new Date();
  draft.deletedBy = userId || null;

  await draft.save();

  return draft;
};
