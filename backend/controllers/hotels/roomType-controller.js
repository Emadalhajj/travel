import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import RoomType from "../../models/hotels/roomType-model.js";

import { deleteImagesFromDisk } from "../../utils/imageManager.js";
import { normalizeString } from "../../utils/generic/normalizeString.js";
import { normalizeArray } from "../../utils/generic/normalizeArray.js";
import { normalizeBoolean } from "../../utils/generic/normalizeBoolean.js";
import { buildSearchQuery } from "../../utils/Builders/buildSearchQuery.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { safeJsonParse } from "../../utils/generic/safeJsonParse.js";
import { validateUniqueFields } from "../../validators/validateUniqueFields.js";
import { processImages } from "../../utils/domain/processImages.js";
import { calculateBookingPrice } from "../../services/pricing/index.js";
import { validatePricingPeriods } from "../../services/validators/roomType-validation.js";
import { checkAvailability } from "../../services/booking/availability.js";

const normalizePricingPeriods = (periods = []) =>
  normalizeArray(periods)
    .filter((period) => period && typeof period === "object")
    .map((period) => ({
      nameAr: normalizeString(period.nameAr),
      nameEn: normalizeString(period.nameEn),
      periodType: period.periodType,
      days: normalizeArray(period.days),
      startDate: period.startDate || undefined,
      endDate: period.endDate || undefined,
      price: Number(period.price) || 0,
      isActive: normalizeBoolean(period.isActive),
      priority: Number(period.priority) || 0,
    }));

const normalizeCapacity = (capacity = {}) => ({
  maxAdults: Math.max(1, Number(capacity.maxAdults) || 2),
  maxChildren: Math.max(0, Number(capacity.maxChildren) || 0),
});

const normalizePricing = (pricing = {}) => ({
  basePrice: Math.max(0, Number(pricing.basePrice) || 0),
  currency: pricing.currency || "SAR",
  discountPercent: Math.min(
    100,
    Math.max(0, Number(pricing.discountPercent) || 0),
  ),
  pricingPeriods: normalizePricingPeriods(pricing.pricingPeriods),
});

const normalizeOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

const normalizeAvailablePeriods = (periods = []) =>
  normalizeArray(periods)
    .filter((period) => period && typeof period === "object")
    .map((period) => ({
      nameAr: normalizeString(period.nameAr),
      nameEn: normalizeString(period.nameEn),
      startDate: period.startDate || undefined,
      endDate: period.endDate || undefined,
      isActive: normalizeBoolean(period.isActive),
      notes: normalizeString(period.notes),
    }));
// الحصول على جميع أنواع الغرف
// ====================== GET ALL ROOM TYPES ======================

export const getAllRoomType = asyncHandler(async (req, res) => {
  const { search, isActive, bedType, sort } = req.query;

  const filter = {
    ...buildSearchQuery({
      search,
      searchFields: ["nameAr", "nameEn", "descriptionAr", "descriptionEn"],
    }),
  };
  // extra filters
  // ✅ ترتيب

  let sortOption = { createdAt: -1 }; // الافتراضي

  if (sort) {
    const allowedSortFields = [
      "pricing.basePrice",
      "createdAt",
      "updatedAt",
      "nameEn",
      "nameAr",
      "maxOccupancy",
    ];
    const [field, order] = sort.split("_");
    if (allowedSortFields.includes(field) && ["asc", "desc"].includes(order)) {
      sortOption = { [field]: order === "desc" ? -1 : 1 };
    }
  }

  if (bedType) filter.bedType = bedType;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  // if (hotelId) filter.hotel = hotelId;

  const { page, skip, limit } = buildPagination(req.query);

  const [roomTypes, total] = await Promise.all([
    RoomType.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("hotel", "name nameAr nameEn location.city")
      .populate("createdBy", "name nameAr nameEn email username")
      .populate("updatedBy", "name nameAr nameEn email username"),
    RoomType.countDocuments(filter), // للحصول على العدد الإجمالي للنتائج المطابقة بدون تطبيق pagination
  ]);

  // const roomTypes = await RoomType.find(filter)
  //   .populate("hotel", "name location.city")
  //   .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    total, // العدد الإجمالي للنتائج المطابقة,
    page,
    limit,
    roomTypes, // أنواع الغرف بعد تطبيق الفلترة والفرز والpagination
  });
});

// الحصول على نوع غرفة واحد

// ====================== GET ROOM TYPE BY ID ======================
export const getRoomTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const roomType = await RoomType.findById(id).populate(
    "hotel",
    "name location.city",
  );

  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: "نوع الغرفة غير موجود",
    });
  }

  // ✅ حسابات إضافية للعرض
  const basePrice = roomType.pricing?.basePrice || 0;
  const finalPrice = roomType.pricing?.finalPrice || 0;
  const savings = basePrice - finalPrice;

  res.status(200).json({
    success: true,
    data: roomType,
    computed: {
      totalOccupancy: roomType.totalOccupancy,
      finalPrice,
      savings,
      occupancyRate: roomType.totalRooms > 0 ? 100 : 0, // يمكن تحديثه لاحقًا
    },
  });
});
// الحصول على أنواع الغرف لفندق معين
export const getRoomTypesByHotelId = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  // ✅ التحقق من صحة الـ ID
  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({
      success: false,
      message: "معرف الفندق غير صالح",
    });
  }
  const rooms = await RoomType.find({ hotel: hotelId })
    .populate("hotel", "nameAr nameEn")
    .populate("createdBy", "name nameAr")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// ====================== PREVIEW BOOKING PRICE ======================
export const previewBookingPrice = asyncHandler(async (req, res) => {
  const { roomTypeId, checkIn, checkOut, adults, children } = req.body;

  // ✅ التحقق من البيانات
  if (!roomTypeId || !checkIn || !checkOut) {
    return res.status(400).json({
      success: false,
      message: "البيانات غير مكتملة",
    });
  }

  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: "نوع الغرفة غير موجود",
    });
  }

  // ✅ التحقق من التوفر
  const availability = await checkAvailability({
    roomTypeId,
    checkIn,
    checkOut,
    requestedRooms: 1,
    RoomType,
    req,
  });

  if (!availability.canBook) {
    return res.status(400).json({
      success: false,
      message: "الغرفة غير متوفرة في هذه الفترة",
      data: { availability },
    });
  }

  // ✅ حساب السعر
  const bookingPrice = calculateBookingPrice({
    roomType,
    checkIn,
    checkOut,
    adults: Number(adults) || 1,
    children: Number(children) || 0,
  });

  res.status(200).json({
    success: true,
    data: {
      availability,
      pricing: bookingPrice,
    },
  });
});

// create new roomtype
// ====================== CREATE ROOM TYPE ======================

export const createRoomType = asyncHandler(async (req, res) => {
  // const data = req.body.data ? JSON.parse(req.body.data) : req.body;
  let data = safeJsonParse(req.body.data, req.body);
  const isArabic = isArabicRequest(req);

  //unique name check in the same hotel
  await validateUniqueFields({
    Model: RoomType,
    query: {
      hotel: data.hotel, // عدم تكرار الاسم في هذا الموديل وهو الفندق
      $or: [
        { nameEn: normalizeString(data.nameEn) },
        { nameAr: normalizeString(data.nameAr) },
      ],
    },
    message: isArabic
      ? "نوع الغرفة موجود مسبقًا في هذا الفندق"
      : "Room type already exists in this hotel",
  });
  //images
  const images = await processImages({
    req,
    currentImages: [],
    folder: "room-types",
  });

  /*
  old way
  const existingImages = normalizeArray(data.existingImages);

  const newImages = extractUploadedImages(req, "room-types");
   const images = [...existingImages, ...newImages];
*/
  // ... Joi validation ...
  const { pricing } = req.body;

  // ✅ التحقق من فترات التسعير
  if (pricing?.pricingPeriods?.length > 0) {
    const errors = validatePricingPeriods(pricing.pricingPeriods, true);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "أخطاء في فترات التسعير",
        errors,
      });
    }
  }

  const normalizedData = {
    ...data,
    hotel: data.hotel,
    nameAr: normalizeString(data.nameAr),
    nameEn: normalizeString(data.nameEn),
    descriptionAr: normalizeString(data.descriptionAr),
    descriptionEn: normalizeString(data.descriptionEn),
    capacity: normalizeCapacity(data.capacity),
    pricing: normalizePricing(data.pricing),
    size: normalizeOptionalNumber(data.size),
    totalRooms: Math.max(1, Number(data.totalRooms) || 1),
    bedType: data.bedType || "quad",
    mealPlan: data.mealPlan || "room_only",
    amenities: normalizeArray(data.amenities),
    isActive: normalizeBoolean(data.isActive),
    images,
    createdBy: req.user?._id,
    availability: {
      availablePeriods: normalizeAvailablePeriods(
        data.availability?.availablePeriods,
      ),
    },
  };
  const newRoomType = await RoomType.create(normalizedData);
  await newRoomType.populate([
    { path: "createdBy", select: "name nameAr nameEn email username" },
    { path: "updatedBy", select: "name nameAr nameEn email username" },
  ]);
  // ✅ الـ pre-save في الموديل يحسب totalOccupancy و finalPrice تلقائيًا

  return res.status(201).json({
    success: true,
    message: "تم إنشاء نوع الغرفة بنجاح",
    data: newRoomType,
  });
});


export const updateRoomType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roomType = await RoomType.findById(id);
  const isArabic = isArabicRequest(req);
  const data = safeJsonParse(req.body.data, req.body);

  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: isArabic ? "نوع الغرفة غير موجود" : "Room type not found",
    });
  }
  // unique validation داخل نفس الفندق

  await validateUniqueFields({
    Model: RoomType,
    query: {
      hotel: data.hotel || roomType.hotel, // عدم تكرار الاسم في هذا الموديل وهو الفندق
      $or: [
        { nameEn: normalizeString(data.nameEn) },
        { nameAr: normalizeString(data.nameAr) },
      ],
    },
    excludeId: id,
    message: isArabic
      ? "نوع الغرفة موجود مسبقًا في هذا الفندق"
      : "Room type already exists in this hotel",
  });

  //2. File processing
  //الصور
  roomType.images = await processImages({
    req,
    currentImages: roomType.images,
    folder: "room-types",
  });

  /*
  const newImages = extractUploadedImages(req, "room-types");

  //الصور المطلوب حذفها
  const imagesToDelete = normalizeArray(req.body.deleteImages);
  // حذف فعلي من السيرفر
  if (imagesToDelete.length > 0) {
    await deleteAttachmentsFromDisk(imagesToDelete);
  }
  

  // تحديث array الصور
  roomType.images = updateImageArray({
    currentImages: roomType.images,
    imagesToDelete: imagesToDelete,
    newImages: newImages,
  });
*/

  // ... Joi validation (price) ...
  const { pricing } = req.body;
  // ✅ التحقق من فترات التسعير (مع الفترات الموجودة)
  if (pricing?.pricingPeriods?.length > 0) {
    const errors = validatePricingPeriods(pricing.pricingPeriods, true);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "أخطاء في فترات التسعير",
        errors,
      });
    }
  }

  //تطبيع باقي البيانات
  //1. Data normalization
  const normalizedData = {
    ...data,
    nameAr: normalizeString(data.nameAr),
    nameEn: normalizeString(data.nameEn),
    descriptionAr: normalizeString(data.descriptionAr),
    descriptionEn: normalizeString(data.descriptionEn),
    capacity: normalizeCapacity(data.capacity),
    pricing: normalizePricing(data.pricing),
    size: normalizeOptionalNumber(data.size),
    totalRooms: Math.max(1, Number(data.totalRooms) || 1),
    bedType: data.bedType || roomType.bedType,
    mealPlan: data.mealPlan || roomType.mealPlan,
    amenities: normalizeArray(data.amenities),
    isActive: normalizeBoolean(data.isActive),
    updatedBy: req.user?._id,
    availability: {
      availablePeriods: normalizeAvailablePeriods(
        data.availability?.availablePeriods,
      ),
    },
  };

  //3. Database mutation
  Object.assign(roomType, normalizedData);
  await roomType.save();
  await roomType.populate([
    { path: "createdBy", select: "name nameAr nameEn email username" },
    { path: "updatedBy", select: "name nameAr nameEn email username" },
  ]);

  return res.status(200).json({
    success: true,
    message: isArabic
      ? "تم تحديث نوع الغرفة بنجاح"
      : "Room type updated successfully",
    data: roomType,
  });

});

//delet  حذف نوع الغرفة

export const deleteRoomType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isArabic = isArabicRequest(req);

  const roomType = await RoomType.findById(id);
  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: isArabic ? " غير موجود" : "Hotel not found  ❌",
    });
  }
  await deleteImagesFromDisk(roomType.images);

  await roomType.deleteOne();
  return res.status(200).json({
    success: true,
    message: "تم الحذف بنجاح",
  });
});

// // 🟢 تبديل حالة الغرف (نشطة / متوقفة)
export const toggleRoomTypeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isArabic = isArabicRequest(req);
  const roomType = await RoomType.findById(id);
  if (!roomType) {
    return res.status(404).json({
      message: isArabic ? "لم يتم العثور على غرفة  ❌" : "Room not found  ❌",
    });
  }
  roomType.isActive = !roomType.isActive;
  await roomType.save();
  res.status(200).json({
    success: true,
    data: roomType,
    message: roomType.isActive
      ? isArabic
        ? "تم التفعيل بنجاح"
        : "Successfully activated"
      : isArabic
        ? "تم الإيقاف بنجاح"
        : "Successfully deactivated",
  });
});
