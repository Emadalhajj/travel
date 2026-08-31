/*
هنا نعرف uploaders الجاهزة للاستخدام.
كل uploader هو عبارة عن دالة تأخذ اسم الحقل (field name) وتعيد ميدلوير (middleware) جاهز للتعامل مع رفع الملفات لهذا الحقل.

*/
import { createUploader } from "./uploadFactory.js";


// الامتدادات المسموحة
const IMAGE_EXTENSIONS =
  /\.(jpe?g|png|gif|webp)$/i;
  
  // سيتحقق من هذه الامتدادات للصور فقط

const DOCUMENT_EXTENSIONS =
  /\.(jpe?g|png|gif|webp|pdf|doc|docx)$/i;
  // صور + مستندات (للمرفقات)

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"];
const BOOKING_DOCUMENT_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i;

export const uploadUserProfile = createUploader({
  folder: "users",
  maxSizeMB: 10,
  fieldRules: {
    profileImage: {
      extensions: /\.(jpe?g|png|webp)$/i,
      mimeTypes: IMAGE_MIME_TYPES,
    },
  },
});

// نبقي توافق الـpresets القديمة، بينما مستندات الحجز تستخدم القائمة المقيدة أعلاه.
const legacyImageRule = {
  extensions: IMAGE_EXTENSIONS,
  mimeTypes: [...IMAGE_MIME_TYPES, "image/gif"],
};
const legacyDocumentRule = {
  extensions: DOCUMENT_EXTENSIONS,
  mimeTypes: [
    ...DOCUMENT_MIME_TYPES,
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

/*
تم تعريف المتغيرات بصيغة Constant وهي قيمة ثابتة
تم تعريف المتغيرات الصور والمرفقات بهذ االشكل حتى نعرفه مرة واحدة: فقط ثم نعيد استخدام مثل
uploadHotel
uploadRoomType
uploadTour
uploadTransport
لن تحتاج لتكرار القيم مثل 
jpe?g|png|gif|webp

*/
/*
fieldRules:
نربط كل field بالامتدادات الخاصة به

images → صور فقط
attachments → صور + ملفات
*/
// صور الفندق
export const uploadHotel =
  createUploader({
    folder: "hotels",

    fieldRules: {
      images: legacyImageRule,

      attachments: legacyDocumentRule,
    },
  });


// مرفقات الفندق
// uploadHotelAttachments فاحتفظ به للمستقبل إذا أردت API منفصل لإدارة الملفات فقط.
// export const uploadHotelAttachments =
//   createUploader({
//     folder: "hotels",
//     allowedExtensions:
//       DOCUMENT_EXTENSIONS,
//   });


// ====================== ROOM TYPES ======================
export const uploadRoomType =
  createUploader({
    folder: "room-types",

    fieldRules: {
      images: legacyImageRule,
    },
  });


// النقل
// ====================== TRANSPORT ======================
export const uploadTransport =
  createUploader({
    folder: "transport",

    fieldRules: {
      images: legacyImageRule,
    },
  });


// التأشيرات
// ====================== VISA ======================
export const uploadVisa =
  createUploader({
    folder: "visa",

    fieldRules: {
      documents: legacyDocumentRule,

      images: legacyImageRule,
    },
  });

// برامج العمرة
// ====================== UMRAH PROGRAMS ======================
export const uploadUmrahProgram =
  createUploader({
    folder: "umrah-programs",

    fieldRules: {
      images: legacyImageRule,
    },
  });

  // ============ Extra Services ===========
  export const uploadExtraService = 
  createUploader({
    folder : "extra-service" ,
    fieldRules : {
      images: legacyImageRule
    }
  })

// إثباتات التحويل البنكي
export const uploadPaymentProof =
  createUploader({
    folder: "payment-proofs",
    storageRoot: "private-uploads",

    fieldRules: {
      proofAttachments: legacyDocumentRule,
    },
  });

// مستندات مسودة الحجز: جواز، هوية مستضيف، عنوان وطني وغيرها.
export const uploadDraftDocument =
  createUploader({
    folder: "draft-bookings",
    storageRoot: "private-uploads",

    maxSizeMB: 10,

    fieldRules: {
      document: {
        extensions: BOOKING_DOCUMENT_EXTENSIONS,
        mimeTypes: DOCUMENT_MIME_TYPES,
      },
    },
  });
