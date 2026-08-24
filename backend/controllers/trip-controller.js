import Trip from "../models/transportition/trip-model.js";
import asyncHandler from "../middleware/asyncHandler.js";

import {
  extractUploadedImages,
  deleteImagesFromDisk,
  updateImageArray,
} from "../utils/imageManager.js";

import { buildSearchQuery } from "../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../utils/Builders/buildSort.js";
import { buildPagination } from "../utils/Builders/buildPagination.js";

// get all trip
export const getAllTrips = asyncHandler(async (req, res) => {
  const { search, type, fromCity, toCity, isActive } = req.query;
  // create search
  const filter = {
    ...buildSearchQuery({
      search,
      searchFields: ["nameEn", "nameAr", "descriptionEn", "descriptionAr"],
    }),
  };
  // 2️⃣ Filters إضافية
  if (type) filter.tripType = type;

  if (fromCity) {
    filter.fromCity = fromCity;
  }
  if (toCity) {
    filter.toCity = toCity;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }
  //  3️⃣ Sort + Pagination
  const sortOption = buildSort(req.query);
  const { skip, limit } = buildPagination(req.query);
  // 4️⃣ Query
  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "nameEn username")
      .populate("vehicleType", "nameEn nameAr"),
    Trip.countDocuments(filter),
  ]);

  //    5️⃣ Response
  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit,
    totalPages: Math.ceil(total / limit),
    trips,
  });
});

//get by Id
export const getTripById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const oneTrip = await Trip.findById(id)
    .populate("createdBy", "nameEn username")
    .populate("vehicleType", "nameEn nameAr");
  if (!oneTrip) {
    res.status(400).json({
      success: false,
      message: " trip not fount -  غير موجود",
    });
  }

  res.status(200).json({
    success: true,
    oneTrip,
  });
});

//create trip

export const createTrip = asyncHandler(async (req, res) => {
  // console.log("req.user:", req.user);

  // 1. لا تعيد بناء features من bracket هنا إلا إذا كنت متأكدًا أنها لم تُرسل كـ string
  // احذف هذه السطور أو ضعها في if شرطي صارم:
  if (Object.keys(req.body).some((k) => k.startsWith("features["))) {
    req.body.features = rebuildNestedObject("features", req.body);
  }

  // 2. الآن حوّل features (الأولوية لـ JSON string)
  let features = req.body.features || {};
  if (typeof features === "string") {
    try {
      features = JSON.parse(features);
      // تأكد أنها object من boolean فقط (اختياري للأمان)
      Object.keys(features).forEach((key) => {
        if (typeof features[key] !== "boolean") {
          delete features[key]; // أو اجعلها false
        }
      });
    } catch (e) {
      console.error("Failed to parse features:", e);
      features = {};
    }
  }

  // نفس الشيء لـ specs إذا كنت تستخدمها
  let specs = req.body.specs || {};
  if (typeof specs === "string") {
    try {
      specs = JSON.parse(specs);
    } catch (e) {
      specs = {};
    }
  }
  const {
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    isActive,
    tripType,
    fromCity,
    toCity,
    startTime,
    startDate,
    endDate,
    pricing,
    // capacity,
    vehicleType,
  } = req.body;

  // 1️⃣ التحقق من التواريخ
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({
      message: "End date must be after start date",
    });
  }
  // 2️⃣ حساب مدة الرحلة
  let duration = undefined;
  //  إذا كان النوع tour أو package فقط يحتاج لحساب المدة
  if (["tour", "package"].includes(tripType)) {
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start and end date are required",
      });
    }
    //  التحقق من صحة التواريخ
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }
    //  حساب الفرق بين التاريخين بالأيام
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); //

    duration = {
      days,
      nights: Math.max(days - 1, 0),
    };
  }

  //capacity (الوصول الآمن)
  const capacity = req.body.capacity || {};

  const maxAdults = Number(capacity.maxAdults || 0);
  const maxChildren = Number(capacity.maxChildren || 0);

  // 3️⃣ حساب السعة
  const totalSeats = maxAdults + maxChildren;
  const availableSeats = totalSeats; // أو حسب المنطق

  // 3. استخراج الصور المرفوعة

  const images = extractUploadedImages(req, "transport");
  const userId = req.user._id;
  //

  const newTrip = await Trip.create({
    nameAr: nameAr?.trim(),
    nameEn: nameEn?.trim(),
    descriptionAr: descriptionAr?.trim(),
    descriptionEn: descriptionEn?.trim(),
    isActive: isActive !== false,
    features,
    images,
    tripType,
    fromCity,
    toCity,
    duration,
    capacity: {
      maxAdults,
      maxChildren,
      totalSeats,
      availableSeats,
    },
    startDate,
    endDate,
    startTime,
    pricing,

    vehicleType,
    createdBy: userId,
  });
  res.status(200).json({
    success: true,
    message: "تم إنشاء  بنجاح",
    newTrip,
  });
});

//update trip
export const updateTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);

  if (!trip) {
    return res
      .status(404)
      .json({ success: false, message: "وسيلة النقل غير موجودة" });
  }

  const allowedFields = [
    "nameAr",
    "nameEn",
    "descriptionAr",
    "descriptionEn",
    "isActive",
    "features",
    "images",
    "tripType",
    "fromCity",
    "toCity",
    "duration",
    "startDate",
    "endDate",
    "startTime",
    "pricing",
    "capacity",
    "vehicleType",
    // "createdBy",
  ];

  const updateTrip = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateTrip[field] = req.body[field];
    }
  });
  //featuers
  // داخل updateTrip
  if (updateTrip.features) {
    let featuresData = updateTrip.features;

    if (typeof featuresData === "string") {
      try {
        featuresData = JSON.parse(featuresData);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "Invalid features format" });
      }
    }

    // اختياري: تنظيف القيم غير الـ boolean
    Object.keys(featuresData).forEach((key) => {
      if (typeof featuresData[key] !== "boolean") {
        delete featuresData[key];
      }
    });

    updateTrip.features = featuresData;
  }
  const newImages = extractUploadedImages(req, "transport");

  /* 3️⃣ الصور المراد حذفها */
  let imagesTodelete =
    req.body["imagesDeleted[]"] ?? req.body["deletedImages[]"] ?? [];

  if (!Array.isArray(imagesTodelete)) {
    imagesTodelete = [imagesTodelete];
  }

  /* 4️⃣ حذف الصور من السيرفر */

  await deleteImagesFromDisk(imagesTodelete);

  /* 5️⃣ تحديث الصور في DB */
  trip.images = updateImageArray({
    currentImages: trip.images,
    imagesToDelete: imagesTodelete,
    newImages,
  });
  /* 6️⃣ تنظيف البيانات */

  delete updateTrip.images;
  delete updateTrip["imagesDeleted[]"];
  delete updateTrip["deletedImages[]"];

  //* 7️⃣ تحديث باقي الحقول */
  Object.assign(trip, updateTrip);
  /*
  يقوم بنسخ كل الخصائص الموجودة في updateTrip
ويضعها داخل الكائن trip
فقط الحقول الموجودة في updateTrip تتغير
الباقي يبقى كما هو
  */

  //حفظ
  await trip.save();
  res.status(200).json({
    success: true,
    message: "updated successfully",
    updateTrip: trip,
  });
});

//delete trip
export const deleteTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);

  if (!trip) {
    return res.status(400).json({
      success: false,
      message: "not found ",
    });
  }
  await deleteImagesFromDisk(trip.images);

  await Trip.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "deleted has been done",
    id,
  });
});

// toggle Trip
export const toggleTripStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);

  if (!trip) {
    return res.status(400).json({
      success: false,
      message: "not faund",
    });
  }
  trip.isActive = !trip.isActive;
  await trip.save();

  res.status(200).json({
    success: true,
    message: "changed has been successfull",
    updateStatusTrip: trip,
  });
});
