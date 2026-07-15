import asyncHandler from "express-async-handler";
import VisaType from "../models/visaType-model.js";

// 🟢 جلب كل الأنواع
export const getAllVisaTypes = asyncHandler(async (req, res) => {
  const visaTypes = await VisaType.find().sort({ createdAt: -1 });
  res.status(200).json({ visaTypes });
});

// 🟢 إنشاء نوع تأشيرة
export const createVisaType = asyncHandler(async (req, res) => {
  const {nameEn, nameAr } = req.body;
  
  if (!nameEn || !nameAr) {
    res.status(400);
    throw new Error("Both Arabic and English names are required");
  }

    const exists = await VisaType.findOne({
    $or: [{ nameEn: nameEn.trim() }, { nameAr: nameAr.trim() }]// تحقق من وجود الاسمين مسبقًا
  });

  if (exists) {
    return res.status(400).json({ message: "نوع التأشيرة موجود مسبقًا" });
  }

  const visaType = new VisaType({ nameEn, nameAr });
  await visaType.save();
  res.status(201).json({ message: "تم إنشاء نوع التأشيرة بنجاح", visaType });
});
// 🟢 تحديث نوع تأشيرة
export const updateVisaType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameEn, nameAr } = req.body;
  const updatedVisaType = await VisaType.findByIdAndUpdate(id, {
    nameEn, 
    nameAr,
   
  } , { new: true});
  if (!updatedVisaType){
        return res.status(404).json({ message: "نوع التأشيرة غير موجود" });

  }
  res.status(200).json({ message: "تم التحديث بنجاح", updatedVisaType })

});
// 🟢 حذف نوع تأشيرة

export const deleteVisaType  = asyncHandler(async(req , res)=>{
    const {id} = req.params
    const deletedVisaType = await VisaType.findByIdAndDelete(id)
      if (!deletedVisaType) {
    return res.status(404).json({ message: "نوع التأشيرة غير موجود" });
  }
  res.status(200).json({ message: "تم الحذف بنجاح" });

})