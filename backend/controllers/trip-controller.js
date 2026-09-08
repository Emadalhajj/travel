import asyncHandler from "express-async-handler";

import {
  getAllTripsService,
  getTripByIdService,
  createTripService,
  updateTripService,
  deleteTripService,
  restoreTripService,
  toggleTripStatusService,
} from "../services/trips/trip-service.js";

import {
  extractUploadedImages,
  deleteImagesFromDisk,
  updateImageArray,
} from "../utils/imageManager.js";

const getUploadedTripImages = (req) =>
  extractUploadedImages(req, "transport");

const getDeletedTripImages = (body = {}) => {
  const deleted =
    body["imagesDeleted[]"] ||
    body["deletedImages[]"] ||
    body.deleteImages ||
    [];

  return (Array.isArray(deleted) ? deleted : [deleted]).filter(Boolean);
};

export const getAllTrips = asyncHandler(async (req, res) => {
  const result = await getAllTripsService({ query: req.query });

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getTripById = asyncHandler(async (req, res) => {
  const trip = await getTripByIdService(req.params.id);

  res.status(200).json({
    success: true,
    trip,
  });
});

export const createTrip = asyncHandler(async (req, res) => {
  const uploadedImages = getUploadedTripImages(req);

  try {
    const trip = await createTripService({
      data: req.body,
      userId: req.user?._id,
      images: uploadedImages,
      req,
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  } catch (error) {
    // لا نترك ملفات يتيمة إذا فشل التحقق أو حفظ الرحلة.
    await deleteImagesFromDisk(uploadedImages);
    throw error;
  }
});

export const updateTrip = asyncHandler(async (req, res) => {
  const currentTrip = await getTripByIdService(req.params.id);
  const uploadedImages = getUploadedTripImages(req);
  const deletedImages = getDeletedTripImages(req.body);

  const images = updateImageArray({
    currentImages: currentTrip.images || [],
    newImages: uploadedImages,
    imagesToDelete: deletedImages,
  });

  try {
    const trip = await updateTripService({
      tripId: req.params.id,
      data: req.body,
      images,
      userId: req.user?._id,
      req,
    });

    // نحذف الصور القديمة فقط بعد نجاح تحديث MongoDB.
    await deleteImagesFromDisk(deletedImages);

    res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      trip,
    });
  } catch (error) {
    // الصور الجديدة لم ترتبط بالرحلة عند فشل التحديث.
    await deleteImagesFromDisk(uploadedImages);
    throw error;
  }
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await deleteTripService({
    tripId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "تم حذف الرحلة بنجاح",
    id: trip._id,
  });
});

export const restoreTrip = asyncHandler(async (req, res) => {
  const trip = await restoreTripService({
    tripId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "تم استرجاع الرحلة بنجاح",
    trip,
  });
});

export const toggleTripStatus = asyncHandler(async (req, res) => {
  const trip = await toggleTripStatusService({
    tripId: req.params.id,
    userId: req.user?._id,
    req,
  });

  res.status(200).json({
    success: true,
    message: "Trip status updated successfully",
    trip,
  });
});
