import asyncHandler from "express-async-handler";
import Hotel from "../../models/hotels/hotel-model.js";
import {
  extractUploadedImages,
  deleteImagesFromDisk,
  deleteAttachmentsFromDisk,
  updateImageArray,
} from "../../utils/imageManager.js";

import { buildSearchQuery } from "../../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../../utils/Builders/buildSort.js";
import { buildPagination } from "../../utils/Builders/buildPagination.js";
import { handleMongooseValidation } from "../../utils/handleMongooseValidation.js";
import { validateUniqueFields } from "../../validators/validateUniqueFields.js";
import { safeJsonParse } from "../../utils/generic/safeJsonParse.js";
import { normalizeString } from "../../utils/generic/normalizeString.js";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";
import { processAttachments } from "../../utils/domain/processAttachments.js";

// import {
//   extractUploadedImages,
//   deleteImagesFromDisk,
//   updateImageArray,
// } from "../../utils/imageManager.js";

// ====================== GET ALL HOTELS ======================

export const getAllHotels = asyncHandler(async (req, res) => {
  const { search, city, stars, isActive, hotelType, sort, order } = req.query;
  let filter = {
    ...buildSearchQuery({
      search,
      searchFields: ["nameEn", "nameAr", "descriptionEn", "descriptionAr"],
    }),
  };
  // فلاتر إضافية
  if (city) filter["location.city.en"] = city; /// أو location.city.ar حسب الحاجة
  if (stars) filter.stars = Number(stars);
  if (hotelType) filter.hotelType = hotelType;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (sort) sortOption[sort] = order === "desc" ? -1 : 1;

  const sortOption = buildSort(req.query);
  const { page, skip, limit } = buildPagination(req.query);
  const [hotels, total] = await Promise.all([
    // Promise يستخدم لتنفيذ استعلامين في نفس الوقت
    Hotel.find(filter) //
      .sort(sortOption) // .sort({ createdAt: -1 }) // الترتيب حسب الأحدث
      .skip(skip) // تخطي عدد معين من النتائج (للباجينيشن)
      .limit(limit) // تحديد عدد النتائج المعروضة (للباجينيشن)
      .populate("roomTypes", "nameAr nameEn"), // جلب بيانات نوع الغرفة المرتبطة بالفندق
    Hotel.countDocuments(filter), // عد عدد الفنادق التي تطابق الفلتر (للباجينيشن)
  ]);

  // const hotels = await Hotel.find(filter)
  //   .populate({
  //     path: "roomTypes",
  //     select: "nameAr nameEn",
  //   })
  //   .sort(sortOption);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    hotels,
  });
});

// ====================== GET HOTEL BY ID ======================

export const getHotelById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const oneHotel = await Hotel.findById(id).populate(
    "roomTypes",
    "nameAr nameEn",
  );
  if (!oneHotel) {
    res.status(400).json({
      success: false,
      message: " hotel not fount -  غير موجود",
      errors: error.details.reduce((acc, item) => {
        acc[item.path.join(".")] = item.message;
        return acc;
      }, {}),
    });
  }

  res.status(200).json({
    success: true,
    oneHotel,
  });
});

export const createHotel = asyncHandler(async (req, res) => {
  try {
    // 1️⃣ parse data
    // let data = req.body.data ? JSON.parse(req.body.data) : req.body;
    let data = safeJsonParse(req.body.data , req.body) 
     const isArabic = isArabicRequest (req);
   
    // unique validation
    await validateUniqueFields({
      Model: Hotel,
      query: {
       $or:[
        { nameEn : normalizeString(data.nameEn)},
        { nameAr : normalizeString(data.nameAr)}

       ]
      },
      message: isArabic
        ? "اسم الفندق موجود مسبقًا"
        : "Hotel name already exists",
    });

    const contact = {
      phone: (data?.contact?.phone || "").trim(),
      email: (data?.contact?.email || "").trim(),
      website: (data?.contact?.website || "").trim(),
      whatsapp: (data?.contact?.whatsapp || "").trim(),
    };

    const facilities = Array.isArray(data.facilities)
      ? data.facilities.filter(Boolean)
      : data.facilities
        ? [data.facilities]
        : [];

    const roomTypes = Array.isArray(data.roomTypes)
      ? data.roomTypes.filter(Boolean)
      : [];

    // 3️⃣ images
    const existingImages = Array.isArray(data.existingImages)
      ? data.existingImages.filter(Boolean)
      : data.existingImages
        ? [data.existingImages]
        : [];

    const newImages = extractUploadedImages(req, "hotels");
    const images = [...existingImages, ...newImages];

    // attachments - معالجة المرفقات المرفوعة
    let attachments = 
    await processAttachments(
      req,// الطلب الذي يحتوي على البيانات والملفات المرفقة
      [],// لا توجد مرفقات موجودة مسبقًا في حالة الإنشاء
      "hotels"
    )
    ;
    
    // if (req.files?.attachments) {
    //   attachments = req.files.attachments.map((file) => ({
    //     fileName: file.filename,
    //     url: `/uploads/hotels/${file.filename}`,
    //     originalName: file.originalname,
    //     uploadedAt: new Date(),
    //   }));
    // }

   

    // تنظيف الحقول غير المطلوبة
    if (data.location?.coordinates) {
      data.location.coordinates = {
        lat: data.location.coordinates.lat || undefined,
        lng: data.location.coordinates.lng || undefined,
      };
    }
    // المرفقات الأخرى (عقود، صور إضافية...) - دمج مع المرفقات المرفوعة

    // const existingAttachments = Array.isArray(data.attachments)
    //   ? data.attachments.filter(Boolean)
    //   : data.attachments
    //     ? [data.attachments]
    //     : [];

    // attachments = [...existingAttachments, ...attachments];

    // 4️⃣ create
    // إزالة attachments من data لأننا نتعامل معها بشكل منفصل
    const { attachments: _, ...dataWithoutAttachments } = data;// حذف الحقل من البيانات التي سيتم تخزينها في الـ DB لأننا نتعامل معه بشكل منفصل
    const newHotel = await Hotel.create({
      ...dataWithoutAttachments,
      contact,
      facilities,
      roomTypes,
      images,
      attachments,
      createdBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      hotel: newHotel,
    });
  } catch (error) {
    if (handleMongooseValidation(error, res)) return; // التعامل مع أخطاء التحقق من Mongoose

    // التعامل مع أخطاء التكرار والأخطاء العادية
    if (error.statusCode === 400 || error.message) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
        errors: {
          nameEn: error.message,
          nameAr: error.message,
        },
      });
    }

    throw error;
  }
});

// ====================== UPDATE HOTEL ======================

export const updateHotel = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
      });
    }


    // 1️⃣ parse
    let data = req.body.data ? JSON.parse(req.body.data) : req.body;
     const isArabic = isArabicRequest (req);


    // unique validation (exclude current hotel)
    await validateUniqueFields({
      Model: Hotel,
      query: {
        nameEn: data.nameEn,
        nameAr: data.nameAr,
      },
      excludeId: id,
      message: isArabic
        ? "اسم الفندق موجود مسبقًا"
        : "Hotel name already exists",
    });

    // 2️⃣ normalize
    if (data.contact) {
      data.contact = {
        phone: (data.contact.phone || "").trim(),
        email: (data.contact.email || "").trim(),
        website: (data.contact.website || "").trim(),
        whatsapp: (data.contact.whatsapp || "").trim(),
      };
    }

    if (data.facilities !== undefined) {
      data.facilities = Array.isArray(data.facilities)
        ? data.facilities.filter(Boolean)
        : data.facilities
          ? [data.facilities]
          : [];
    }

    if (data.roomTypes) {
      data.roomTypes = Array.isArray(data.roomTypes)
        ? data.roomTypes.filter(Boolean)
        : [];
    }

    // ===== الصور =====

    const newImages = extractUploadedImages(req, "hotels");

    let deleteImages = req.body["deleteImages[]"] || [];

    if (!Array.isArray(deleteImages)) {
      deleteImages = [deleteImages];
    }

    if (deleteImages.length > 0) {
      await deleteImagesFromDisk(deleteImages);
    }

    hotel.images = updateImageArray({
      currentImages: hotel.images,
      imagesToDelete: deleteImages,
      newImages,
    });

    // ===== المرفقات =====

    hotel.attachments = 
    await processAttachments(
      req,// الطلب الذي يحتوي على البيانات والملفات المرفقة
      hotel.attachments,// المرفقات الحالية المرتبطة بالكيان
      "hotels")
     /* 
    let keptAttachments = [];

    if (data.attachments) {
      keptAttachments = Array.isArray(data.attachments)
        ? data.attachments.filter(Boolean)
        : [data.attachments];
    }

    let newAttachments = [];

    if (req.files?.attachments) {
      newAttachments = req.files.attachments.map((file) => ({
        fileName: file.filename,
        url: `/uploads/hotels/${file.filename}`,
        originalName: file.originalname,
        uploadedAt: new Date(),
      }));
    }

    let deleteAttachments = req.body["deleteAttachments[]"] || [];

    if (!Array.isArray(deleteAttachments)) {
      deleteAttachments = [deleteAttachments];
    }

    if (deleteAttachments.length > 0) {
      await deleteAttachmentsFromDisk(deleteAttachments);
    }

    hotel.attachments = [...keptAttachments, ...newAttachments];
*/
    // ===== باقي البيانات =====

    const { attachments, existingImages, ...cleanData } = data;

    Object.assign(hotel, cleanData);

    await hotel.save();

    res.status(200).json({
      success: true,
      upHotel: hotel,
    });
  } catch (error) {
    if (handleMongooseValidation(error, res)) return;

    // التعامل مع أخطاء التكرار والأخطاء العادية
    if (error.statusCode === 400 || error.message) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
        errors: {
          nameEn: error.message,
          nameAr: error.message,
        },
      });
    }

    throw error;
  }
});
// hotel delete  حذف نوع

export const deleteHotel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return res.status(400).json({
      success: false,
      message: "hotel not found  غير موجود",
    });
  }

  // ✅ حذف جميع الصور والمرفقات باستخدام المساعد
  deleteImagesFromDisk(hotel.images);
  deleteAttachmentsFromDisk(hotel.attachments);

  await Hotel.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "تم الحذف بنجاح",
  });
});
// toggle hotel active status
export const toggleHotelStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return res.status(400).json({
      success: false,
      message: "hotel not found  غير موجود",
    });
  }
  hotel.isActive = !hotel.isActive;
  await hotel.save();
  res.status(200).json({
    success: true,
    message: "تم التغيير بنجاح",
    hotel,
  });
});
