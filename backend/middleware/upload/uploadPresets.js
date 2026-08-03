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
      images:
        IMAGE_EXTENSIONS,

      attachments:
        DOCUMENT_EXTENSIONS,
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
      images:
        IMAGE_EXTENSIONS,
    },
  });


// النقل
// ====================== TRANSPORT ======================
export const uploadTransport =
  createUploader({
    folder: "transport",

    fieldRules: {
      images:
        IMAGE_EXTENSIONS,
    },
  });


// التأشيرات
// ====================== VISA ======================
export const uploadVisa =
  createUploader({
    folder: "visa",

    fieldRules: {
      documents:
        DOCUMENT_EXTENSIONS,

      images:
        IMAGE_EXTENSIONS,
    },
  });

// برامج العمرة
// ====================== UMRAH PROGRAMS ======================
export const uploadUmrahProgram =
  createUploader({
    folder: "umrah-programs",

    fieldRules: {
      images:
        IMAGE_EXTENSIONS,
    },
  });

  // ============ Extra Services ===========
  export const uploadExtraService = 
  createUploader({
    folder : "extra-service" ,
    fieldRules : {
      images :
      IMAGE_EXTENSIONS
    }
  })

// إثباتات التحويل البنكي
export const uploadPaymentProof =
  createUploader({
    folder: "payment-proofs",

    fieldRules: {
      proofAttachments:
        DOCUMENT_EXTENSIONS,
    },
  });
