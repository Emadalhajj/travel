import asyncHandler from "express-async-handler";
import Transport from "../models/transportition/transport-model.js";

import {
  extractUploadedImages,
  deleteImagesFromDisk,
  updateImageArray,
} from "../utils/imageManager.js";
import Trip from "../models/transportition/trip-model.js";

import { buildSearchQuery } from "../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../utils/Builders/buildSort.js";
import { buildPagination } from "../utils/Builders/buildPagination.js";

//get all transportations
export const getAllTransports = asyncHandler(async (req, res) => {
  const { search, type, fromCity, toCity, isActive } = req.query;
  //  1️⃣ بناء search
  const filter = {
    ...buildSearchQuery({
      search,
      searchFields: ["nameEn", "nameAr"],
    }),
  };
  // 2️⃣ Filters إضافية
  if (type) filter.vehicleType = type;

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }
  //  3️⃣ Sort + Pagination
  const sortOption = buildSort(req.query);
  const { page, skip, limit } = buildPagination(req.query);
  //    4️⃣ Query
  const [transports, total] = await Promise.all([
    Transport.find(filter).sort(sortOption).skip(skip).limit(limit),

    Transport.countDocuments(filter),
  ]);

  //    5️⃣ Response
  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    transports,
  });
});

//get transport by id

export const getTransportById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const oneTransport = await Transport.findById(id);
  if (!oneTransport) {
    res.status(400).json({
      success: false,
      message: " transport not fount -  غير موجود",
    });
  }
  res.status(200).json({
    success: true,
    oneTransport,
  });
});

// create new transport

export const createTransport = asyncHandler(async (req, res) => {
  const {
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    isActive,
    // specs,
    vehicleType,
    capacity,
    // price,
    // from,
    // to,
  } = req.body;

  const features =
    typeof req.body.features === "string"
      ? JSON.parse(req.body.features)
      : req.body.features || {};

  const specs =
    typeof req.body.specs === "string"
      ? JSON.parse(req.body.specs)
      : req.body.specs || {};

  const images = extractUploadedImages(req, "transport");

  const newTransport = await Transport.create({
    nameAr: nameAr?.trim(),
    nameEn: nameEn?.trim(),
    descriptionAr: descriptionAr?.trim(),
    descriptionEn: descriptionEn?.trim(),
    isActive: isActive !== false,
    features,
    vehicleType,
    capacity,
    specs,
    // price,
    // from,
    // to,
    images,
  });
  res.status(200).json({
    success: true,
    message: "تم إنشاء  بنجاح",
    newTransport,
  });
});

//update transport
export const updateTransport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transport = await Transport.findById(id);

  if (!transport) {
    return res.status(404).json({
      success: false,
      message: "وسيلة النقل غير موجودة",
    });
  }
  /* 1️⃣ الحقول المسموح تعديلها */
  const allowedFields = [
    "nameEn",
    "nameAr",
    "descriptionEn",
    "descriptionAr",
    "vehicleType",
    "capacity",
    "isActive",
    "features",
    "specs",
  ];

  const updateTransport = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateTransport[field] = req.body[field];
    }
  });

  /* 2️⃣ معالجة features */
  if (updateTransport.features) {
    let featuresData = updateTransport.features;

    if (typeof featuresData === "string") {
      try {
        featuresData = JSON.parse(featuresData);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid features format",
        });
      }
    }

    // تنظيف القيم غير boolean
    Object.keys(featuresData).forEach((key) => {
      if (typeof featuresData[key] !== "boolean") {
        delete featuresData[key];
      }
    });

    updateTransport.features = featuresData;
  }

  /* 3️⃣ معالجة specs */
  if (updateTransport.specs) {
    let specsData = updateTransport.specs;

    if (typeof specsData === "string") {
      try {
        specsData = JSON.parse(specsData);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid specs format",
        });
      }
    }

    updateTransport.specs = specsData;
  }

  /* 4️⃣ الصور الجديدة */
  const newImages = extractUploadedImages(req, "transport");

  /* 5️⃣ الصور المراد حذفها */
  let imagesToDelete = req.body["deletedImages[]"] ?? [];

  if (!Array.isArray(imagesToDelete)) {
    imagesToDelete = [imagesToDelete];
  }

  await deleteImagesFromDisk(imagesToDelete);

  /* 6️⃣ تحديث الصور في DB */
  transport.images = updateImageArray({
    currentImages: transport.images,
    imagesToDelete,
    newImages,
  });

  /* 7️⃣ تحديث باقي الحقول */
  Object.assign(transport, updateTransport);

  await transport.save();

  res.status(200).json({
    success: true,
    message: "updated successfully",
    updatedTransport: transport,
  });
});
// delte tranasport
export const deleteTransport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transport = await Transport.findById(id);

  if (!transport) {
    return res.status(404).json({
      success: false,
      message: "وسيلة النقل غير موجودة",
    });
  }
  // 🔴منع الحذف اذا كان هناك رحلة مرتبطة بنقل -  تحقق هل هناك رحلة مرتبطة
  const hasTrips = await Trip.exists({
    $or: [
      { transportId: id },
      // Legacy read compatibility until the trip migration is verified.
      { vehicleType: id },
    ],
    isDeleted: false,
  });
  if (hasTrips) {
    return res.status(400).json({
      message: "Cannot delete transport linked to existing trips",
    });
  }
  // delte images from
  await deleteImagesFromDisk(transport.images);
  // delte trasport

  await Transport.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    id,
    message: "تم الحذف بنجاح",
  });
});

// toggel trasport actine
export const toggleTransportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transport = await Transport.findById(id);
  if (!transport) {
    return res
      .status(404)
      .json({ success: false, message: "وسيلة النقل غير موجودة" });
  }
  transport.isActive = !transport.isActive;

  await transport.save();

  res.status(200).json({
    success: true,
    message: "تم التغيير بنجاح",
    updatedTransport: transport,
  });
});
