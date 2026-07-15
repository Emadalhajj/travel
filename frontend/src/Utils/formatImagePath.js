
// src/utils/imageUtils.js
// src/utils/imageUtils.js


export const formatImagePath = (image) => {
  // 1. إذا كان null أو undefined → placeholder
  if (!image) {
    return "/placeholder-image.png";
  }

  // 2. إذا كان File أو Blob (صورة جديدة تم رفعها)
  if (image instanceof File || image instanceof Blob) {
    return URL.createObjectURL(image); // معاينة فورية
  }

  // 3. إذا كان object فيه url (مثل { url: "/uploads/..." })
  if (image && typeof image === "object" && image.url) {
    const url = image.url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads")) return `http://localhost:5000${url}`;
    return `http://localhost:5000/uploads/${url.replace(/^\/+/, "")}`;
  }

  // 4. إذا كان string (رابط قديم من الداتابيز)
  if (typeof image === "string") {
    const cleanPath = image.trim();
    if (!cleanPath) return "/placeholder-image.png";

    // لو الرابط كامل بالفعل (http أو https)
    if (cleanPath.startsWith("http")) return cleanPath;

    // لو الرابط نسبي (يبدأ بـ /uploads أو بدون سلاش)
    if (cleanPath.startsWith("/uploads")) {
      return `http://localhost:5000${cleanPath}`;
    }

    // لو الرابط بدون سلاش أو مجرد اسم الملف
    return `http://localhost:5000/uploads/${cleanPath.replace(/^\/+/, "")}`;
  }

  // في كل الحالات الأخرى → placeholder
  return "/placeholder-image.png";
};

