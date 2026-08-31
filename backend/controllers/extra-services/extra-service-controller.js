import asyncHandler from "express-async-handler";
import ExtraService from "../../models/extra-services/extra-service-model.js";
import AppError from "../../utils/AppError.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { deleteImagesFromDisk } from "../../utils/imageManager.js";

const getUploadedImages = (req) =>
  (req.files?.images || []).map(
    (file) => `/uploads/extra-service/${file.filename}`,
  );

const normalizeImages = (images = []) => {
  if (Array.isArray(images)) return images.filter(Boolean);
  return images ? [images] : [];
};

const getDeletedImages = (body = {}) => {
  const deleted =
    body["deleteImages[]"] ||
    body.deleteImages ||
    body["imagesDeleted[]"] ||
    [];

  if (Array.isArray(deleted)) return deleted;
  return deleted ? [deleted] : [];
};

export const getAllExtraServices = asyncHandler(async (req, res) => {
     const isArabic = isArabicRequest(req);
  const filter = {
    isDeleted: { $ne: true },
  };

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.search) {
    filter.$or = [
      { nameAr: { $regex: req.query.search, $options: "i" } },
      { nameEn: { $regex: req.query.search, $options: "i" } },
    ];
  }
  const { page, skip, limit } = buildPagination(req.query);
  const [items, total] = await Promise.all([
    ExtraService.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName username email")
      .populate("updatedBy", "firstName lastName username email"),

    ExtraService.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    data: items,
  });
});

export const getOneExtraService = asyncHandler(async(req , res)=>{
    // const {id} = req.params
     const isArabic = isArabicRequest(req);
     const service = await ExtraService.findOne({
        _id : req.params.id,
        isDeleted : {$ne : true}

     })
     if(!service){
         throw new AppError(
      isArabic ? "الخدمة غير موجودة" : "Service not found",
      404,
      "extraService",
    )
     }

     res.status(200).json({
         success: true,
    data: service,
     })
})

export const createExtraService = asyncHandler(async(req , res)=>{
    const isArabic = isArabicRequest(req);
    const uploadedImages = getUploadedImages(req);

    const service = await ExtraService.create({
        ...req.body ,
        images: [...normalizeImages(req.body.images), ...uploadedImages],
        createdBy : req.user?._id
    })
    res.status(201).json({
        success : true ,
          message: isArabic
      ? "تم إنشاء الخدمة بنجاح"
      : "Extra service created successfully",
        data: service
    })
})

export const updateExtraService = asyncHandler(async(req , res)=>{
     const isArabic = isArabicRequest(req);
      const service = await ExtraService.findById(req.params.id)

      if (!service) {
    throw new AppError(
      isArabic ? "الخدمة غير موجودة" : "Service not found",
      404,
      "extraService",
    );
  }
  const uploadedImages = getUploadedImages(req);
  const deletedImages = getDeletedImages(req.body);

  if (deletedImages.length > 0) {
    await deleteImagesFromDisk(deletedImages);
  }

  const remainingImages = (service.images || []).filter(
    (image) => !deletedImages.includes(image),
  );

  Object.assign(service , {
    ...req.body,
    images:
      uploadedImages.length > 0 || deletedImages.length > 0
        ? [...remainingImages, ...uploadedImages]
        : service.images,
  })
  service.updatedBy = req.user?._id

  await service.save()

  res.status(200).json({
     success: true,
    message: isArabic
      ? "تم تحديث الخدمة بنجاح"
      : "Extra service updated successfully",
    data: service,
  
  })
})

export const deleteExtraService = asyncHandler(async(req , res)=>{
    const isArabic = isArabicRequest(req);

    const service = await ExtraService.findById(req.params.id)

      if (!service) {
    throw new AppError(
      isArabic ? "الخدمة غير موجودة" : "Service not found",
      404,
      "extraService",
    );
  }
    await deleteImagesFromDisk(service.images);
    //   await service.deleleOne()

  service.isDeleted = true
  service.deletedAt = new Date()
  service.deletedBy = req.user?._id

  await service.save()
  res.status(200).json({
    success: true,
    message: isArabic
      ? "تم حذف الخدمة بنجاح"
      : "Extra service deleted successfully",
  });

})

export const toggleExtraServiceStatus = asyncHandler(async(req , res)=>{
    const service = ExtraService.findById(req.params.id)
      if (!service) {
    throw new AppError(
      isArabic ? "الخدمة غير موجودة" : "Service not found",
      404,
      "extraService",
    );
      }

    service.isActive = !service.isActive

    await service.save()
    res.status(200).json({
        success : true ,
        data : service ,
        message : isArabic
      ? "تم تحديث الخدمة بنجاح"
      : "Extra service updated successfully",
  
    })
})
