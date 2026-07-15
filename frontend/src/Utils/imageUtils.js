// src/utils/imageUtils.js
export const formatImagePath = (image) => {
  if (!image) return null;

  // دعم كلا النوعين: سلسلة نصية أو كائن صورة { url, path, filename }
  let imgStr = null;
  if (typeof image === "string") {
    imgStr = image;
  } else if (typeof image === "object" && image !== null) {
    imgStr = image.url || image.path || image.filename || null;
  }

  if (!imgStr) return null;

  imgStr = String(imgStr).trim();

  // إذا كانت URL كاملة فأعدها كما هي
  if (/^https?:\/\//i.test(imgStr)) return imgStr;

  // إزالة أي /uploads/ أو uploads/ من البداية
  imgStr = imgStr.replace(/^\/?uploads\/?/, "");

  // توحيد الفواصل
  imgStr = imgStr.replace(/\\/g, "/");

  const path = `http://localhost:5000/uploads/${imgStr}`;
  return path;
};
