// controllers/umrah-programs/umrah-program-controller.js

/*
=====================================================
Umrah Program Controller
=====================================================

هذا الملف يستقبل طلبات برامج العمرة.

مسؤول عن:
-----------------------------------------------------
- قراءة req.body
- قراءة req.params
- قراءة req.query
- قراءة req.user
- استدعاء service المناسب
- إرجاع response

ملاحظة:
-----------------------------------------------------
لا نضع Business Logic داخل controller.
=====================================================
*/

import {
  createUmrahProgram,
  getAllUmrahPrograms,
  getPublicUmrahProgramById,
  getPublicUmrahPrograms,
  getUmrahProgramById,
  updateUmrahProgram,
  changeUmrahProgramStatus,
  reserveProgramSeats,
  releaseProgramSeats,
  softDeleteUmrahProgram,
  restoreUmrahProgram,
} from "../../services/umrah-programs/umrah-program-service.js";
import { deleteImagesFromDisk } from "../../utils/imageManager.js";

const normalizeImages = (images = []) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (typeof image === "string") {
        return {
          url: image,
          publicId: null,
        };
      }

      if (image && typeof image === "object" && image.url) {
        return {
          url: image.url,
          publicId: image.publicId || null,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const getUploadedImages = (req) =>
  (req.files?.images || []).map((file) => ({
    url: `/uploads/umrah-programs/${file.filename}`,
    publicId: null,
  }));

const getDeletedImages = (body = {}) => {
  const deleted =
    body["deleteImages[]"] ||
    body.deleteImages ||
    body["imagesDeleted[]"] ||
    [];

  if (Array.isArray(deleted)) return deleted;
  return deleted ? [deleted] : [];
};

const getImageUrl = (image) =>
  typeof image === "string" ? image : image?.url || "";

const applyCreateImages = (data, req) => ({
  ...data,
  images: [...normalizeImages(data.images), ...getUploadedImages(req)],
});

const applyUpdateImages = async ({ data, req, programId }) => {
  const uploadedImages = getUploadedImages(req);
  const deletedImages = getDeletedImages(req.body);
  const shouldProcessImages =
    uploadedImages.length > 0 || deletedImages.length > 0;

  if (!shouldProcessImages) {
    return data;
  }

  const currentProgram = await getUmrahProgramById(programId);
  const normalizedDelete = new Set(deletedImages.map(getImageUrl));
  const currentImages = normalizeImages(currentProgram.images);
  const remainingImages = currentImages.filter(
    (image) => !normalizedDelete.has(getImageUrl(image)),
  );

  if (deletedImages.length > 0) {
    await deleteImagesFromDisk(deletedImages);
  }

  return {
    ...data,
    images: [...remainingImages, ...uploadedImages],
  };
};

/*
=====================================================
createProgram
=====================================================

إنشاء برنامج عمرة جديد من لوحة التحكم.
=====================================================
*/

export const createProgram = async (req, res, next) => {
  try {
    const data = applyCreateImages(req.body, req);

    const program = await createUmrahProgram({
      data,
      userId: req.user?._id,
      req,
    });

    res.status(201).json({
      success: true,
      message: "Umrah program created successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getPrograms
=====================================================

جلب كل البرامج للإدارة.
=====================================================
*/

export const getPrograms = async (req, res, next) => {
  try {
    const result = await getAllUmrahPrograms({
      query: req.query,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getPublicPrograms
=====================================================

جلب البرامج العامة الظاهرة للعميل.
=====================================================
*/

export const getPublicPrograms = async (req, res, next) => {
  try {
    const result = await getPublicUmrahPrograms({
      query: req.query,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProgramDetails = async (req, res, next) => {
  try {
    const program = await getPublicUmrahProgramById(req.params.id);

    res.status(200).json({
      success: true,
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getProgramById
=====================================================

جلب برنامج واحد.
=====================================================
*/

export const getProgramById = async (req, res, next) => {
  try {
    const program = await getUmrahProgramById(req.params.id);

    res.status(200).json({
      success: true,
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
updateProgram
=====================================================

تحديث برنامج عمرة.
=====================================================
*/

export const updateProgram = async (req, res, next) => {
  try {
    const data = await applyUpdateImages({
      data: req.body,
      req,
      programId: req.params.id,
    });

    const program = await updateUmrahProgram({
      programId: req.params.id,
      data,
      userId: req.user?._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Umrah program updated successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
updateProgramStatus
=====================================================

تغيير حالة البرنامج.
=====================================================
*/

export const updateProgramStatus = async (req, res, next) => {
  try {
    const program = await changeUmrahProgramStatus({
      programId: req.params.id,
      status: req.body.status,
      userId: req.user?._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Umrah program status updated successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
reserveSeats
=====================================================

حجز مقاعد من البرنامج.

غالبًا يستخدم داخليًا لاحقًا مع Booking،
لكن تركناه كمسار إداري للاختبار.
=====================================================
*/

export const reserveSeats = async (req, res, next) => {
  try {
    const program = await reserveProgramSeats({
      programId: req.params.id,
      seats: Number(req.body.seats) || 1,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Seats reserved successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
releaseSeats
=====================================================

إرجاع مقاعد للبرنامج.
=====================================================
*/

export const releaseSeats = async (req, res, next) => {
  try {
    const program = await releaseProgramSeats({
      programId: req.params.id,
      seats: Number(req.body.seats) || 1,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Seats released successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
deleteProgram
=====================================================

حذف برنامج حذفًا ناعمًا.
=====================================================
*/

export const deleteProgram = async (req, res, next) => {
  try {
    const program = await softDeleteUmrahProgram({
      programId: req.params.id,
      userId: req.user?._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Umrah program deleted successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
restoreProgram
=====================================================

استرجاع برنامج محذوف.
=====================================================
*/

export const restoreProgram = async (req, res, next) => {
  try {
    const program = await restoreUmrahProgram({
      programId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Umrah program restored successfully",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};
