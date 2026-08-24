import asyncHandler from "express-async-handler";
import Visa from "../models/visa-model.js";
import { buildSearchQuery } from "../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../utils/Builders/buildSort.js";
import { buildPagination } from "../utils/Builders/buildPagination.js";
import { deleteImagesFromDisk } from "../utils/imageManager.js";

// 🟢 جلب جميع  التأشيرات
export const getAllVisas = asyncHandler(async (req, res) => {
  const { search, visaType, country, isActive } = req.query;
  // بناء فلتر البحث
  const filter = {
    ...buildSearchQuery({
      search,
      searchFields: ["name.ar", "name.en", "description.ar", "description.en"],
    }),
  };
  if (visaType) filter.visaType = visaType;
  if (country) {
    filter["country.en"] = country;
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }
  //  3️⃣ Sort + Pagination
  const sortOption = buildSort(req.query);
  const { skip, limit } = buildPagination(req.query);
  const [visas, total] = await Promise.all([
    // Promise يستخدم لتنفيذ استعلامين في نفس الوقت
    Visa.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "nameEn username")
      .populate("updatedBy", "nameEn username")
      .populate("visaType", "nameEn nameAr"),
    Visa.countDocuments(filter),
  ]);
  //    5️⃣ Response
  res.status(200).json({
    success: true,
    total,
    page: Number(req.query.page) || 1,
    limit,
    totalPages: Math.ceil(total / limit),
    visas,
  });

  // const visas = await Visa.find()
  //     .populate({
  //       path: "visaType",
  //       select: "nameAr nameEn", // يجلب name ككائن { ar, en }
  //     })
  //     .sort({ createdAt: -1 });

  //   res.status(200).json({ visas });
});

// 🟢 إنشاء  تأشيرة جديد
export const createVisa = asyncHandler(async (req, res) => {
  // const data = JSON.parse(req.body.data); // لأننا نرسل data كـ JSON

  const {
    name,
    description,
    price,
    duration,
    validity,
    visaType,
    country,
    isActive,
    isAlwaysAvailable,
  } = req.body;

  if (
    !name?.ar ||
    !name?.en ||
    !description?.ar ||
    !description?.en ||
    !visaType ||
    !country?.ar ||
    !country?.en
  ) {
    return res
      .status(400)
      .json({ message: "جميع الحقول المطلوبة يجب تعبئتها" });
  }
  // جمع مسارات الصور الجديدة
  const imagePaths =
    req.files?.images?.map((file) => `/uploads/visa/${file.filename}`) || [];

  const visa = await Visa.create({
    name,
    description,
    price: parseFloat(price),
    duration,
    validity,
    createdBy: req.user._id,
    country: {
      ar: country?.ar || req.body.country?.ar || "المملكة العربية السعودية",
      en: country?.en || req.body.country?.en || "Saudi Arabia",
    },
    visaType,
    images: imagePaths, // ← مصفوفة من المسارات
    isActive: isActive ?? true, // استخدم القيمة المرسلة أو القيمة الافتراضية true
    isAlwaysAvailable: isAlwaysAvailable ?? true,
  });

  // Populate لإرجاع البيانات الكاملة
  await visa.populate("createdBy", "nameEn username");
  await visa.populate("visaType", "nameEn nameAr");

  res.status(201).json({
    message: "تم إنشاء التأشيرة بنجاح",
    visa,
  });
});

// 🟢 تتحديث تأشيرة (يدعم إضافة + حذف صور)
export const updateVisa = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const existingVisa = await Visa.findById(id);

  if (!existingVisa) {
    return res.status(404).json({ message: "لم يتم العثور على التأشيرة" });
  }

  // 1. الصور الجديدة
  const newImagePaths =
    req.files?.images?.map((file) => `/uploads/visa/${file.filename}`) || [];

  // 2. الصور القديمة المحذوفة (نستقبلها كـ مصفوفة)
  let deleteImages =
    req.body["imagesDeleted[]"] || req.body["deleteImages[]"] || [];
  if (!Array.isArray(deleteImages)) {
    deleteImages = [deleteImages];
  }

  if (deleteImages.length > 0) {
    await deleteImagesFromDisk(deleteImages);
  }

  // const deleteImages = Array.isArray(req.body["deleteImages[]"])
  //   ? req.body["deleteImages[]"]
  //   : req.body.deleteImages
  //     ? [req.body.deleteImages]
  //     : [];

  // // حذف الصور من السيرفر
  // deleteImages.forEach((imgPath) => {
  //   const fullPath = path.join(
  //     process.cwd(),
  //     "public",
  //     imgPath.replace(/^\/uploads/, ""),
  //   );
  //   if (fs.existsSync(fullPath)) {
  //     fs.unlinkSync(fullPath);
  //   }
  // });

  // تحديث قاعدة البيانات

  const updateData = {
    ...data,
    price: data.price === undefined ? undefined : parseFloat(data.price),
    updatedBy: req.user._id,
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });
  delete updateData["imagesDeleted[]"];
  delete updateData["deleteImages[]"];
  updateData.images = [
    ...(existingVisa.images || []).filter(
      (image) => !deleteImages.includes(String(image)),
    ),
    ...newImagePaths,
  ];

  const updatevisa = await Visa.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .populate({
      path: "visaType",
      select: "nameAr nameEn",
    })
    .populate("createdBy", "nameEn username")
    .populate("updatedBy", "nameEn username");

  res.status(200).json({
    message: "تم تحديث التأشيرة بنجاح",
    updatevisa,
  });
});

// 🟢 حذف التأشيرة
export const deleteVisa = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const visa = await Visa.findById(id);
  if (!visa) {
    return res.status(404).json({
      success: false,
      message: "لم يتم العثور على التأشيرة ❌",
    });
  }
  await visa.deleteOne();
  // حذف الصور المرتبطة بالتأشيرة من السيرفر
  await deleteImagesFromDisk(visa.images);
  res.status(200).json({
    success: true,
    message: "تم حذف التأشيرة بنجاح ✅",
  });
});

// 🟢 جلب تأشيرة معينة
export const getVisaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const visa = await Visa.findById(id);
  if (!visa) {
    return res.status(404).json({ message: "لم يتم العثور على التأشيرة ❌" });
  }
  res.status(200).json({ visa });
});

// 🟢 تبديل حالة التأشيرة (نشطة / متوقفة)

export const toggleVisaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const visa = await Visa.findById(id);

  if (!visa) {
    return res.status(404).json({ message: "لم يتم العثور على التأشيرة ❌" });
  }

  visa.isActive = !visa.isActive;
  visa.updatedBy = req.user._id;
  await visa.save();

  // Populate
  await visa.populate("createdBy", "nameEn username");
  await visa.populate("updatedBy", "nameEn username");
  await visa.populate("visaType", "nameEn nameAr");

  res.status(200).json({
    message: "تم تبديل حالة التأشيرة بنجاح ✅",
    visa,
  });
});

// عند الإنشاء أو التعديل
