/*
للتحقق من عدم تكرار القيم في الحقول المحددة في قاعدة البيانات.

*/
export const validateUniqueFields = async ({
  Model,// Mongoose model to check against
  query = {},// { nameEn: "Hotel Name", nameAr: "اسم الفندق" }
  excludeId = null,
  message = "البيانات موجودة مسبقًا",
}) => {

  if (excludeId) {
    query._id = {
      $ne: excludeId,
    };
  }

  const exists =
    await Model.findOne(query);

  if (exists) {
    const error =
      new Error(message);

    error.statusCode = 400;

    throw error;
  }

  return true;
};