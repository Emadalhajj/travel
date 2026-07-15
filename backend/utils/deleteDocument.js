export const deleteDocument = (Model, entityName = "العنصر") => {
  return asyncHandler(async (req, res) => {
    const { id } = req.params;

    // البحث عن الوثيقة
    const document = await Model.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: `${entityName} غير موجود`,
      });
    }

    try {
      // حذف الصور إذا وجدت
      if (document.images?.length > 0) {
        await deleteImagesFromDisk(document.images);
      }

      // حذف المرفقات إذا وجدت
      if (document.attachments?.length > 0) {
        await deleteAttachmentsFromDisk(document.attachments);
      }

      // حذف الوثيقة من قاعدة البيانات
      await document.deleteOne();

      return res.status(200).json({
        success: true,
        message: `تم حذف ${entityName} بنجاح`,
      });
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      
      return res.status(500).json({
        success: false,
        message: `حدث خطأ أثناء حذف ${entityName}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });
};