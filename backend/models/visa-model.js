import mongoose, { Schema } from "mongoose";

const visaSchema = new Schema(
  {
    //id
    // visaId:{ type: Number , unique : true} ,
    // اسم نوع التأشيرة (مثل: تأشيرة زيارة عائلية)
    name: {
      ar: {
        type: String,
        required: [true, "اسم التأشيرة بالعربية مطلوب"],
        trim: true,
      },
      en: {
        type: String,
        required: [true, "اسم التأشيرة بالإنجليزية مطلوب"],
        trim: true,
      },
    },
    // وصف التأشيرة وتفاصيلها
    description: {
         ar: {
        type: String,
        required: [true, "الوصف بالعربية مطلوب"],
        trim: true,
      },
      en: {
        type: String,
        required: [true, "الوصف بالإنجليزية مطلوب"],
        trim: true,
      },
    },
    // مدة الإقامة المسموح بها
    duration: {
      type: String,
      required: [true, "مدة التأشيرة مطلوبة"],
    },
    // مدة الصلاحية (مثلاً: 3 أشهر من تاريخ الإصدار)
    validity: {
      type: String,
      required: [true, "صلاحية التأشيرة مطلوبة"],
    },
    // السعر (لأغراض الفواتير والعروض)
    price: {
      type: Number,
      required: [true, "السعر مطلوب"],
    },
    // صورة أو أيقونة للتأشيرة
    images: [{ type: String }],   // ← مصفوفة من المسارات
    // نوع التأشيرة (زيارة – عمل – حج – عمرة – أخرى)
    visaType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisaType",
      required: true,
    },
    // الدولة المستهدفة (اختياري)
  
  country: {
    ar: { type: String, required: true, default: "المملكة العربية السعودية" },
    en: { type: String, required: true, default: "Saudi Arabia" },
  },
  // منتج من ضمن المنتجات الدائمة الوفرة 
  isAlwaysAvailable: {
  type: Boolean,
  default: true,
},
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
    // حالة التأشيرة (نشطة أو متوقفة)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "Visas" }
);
export default  mongoose.model("Visa" , visaSchema)