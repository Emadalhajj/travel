import mongoose from "mongoose";

const userModel = new mongoose.Schema(
  {
    firstName: {
      type: String,
      // required: true,
      trim: true,
    },
    lastName: {
      type: String,
      // required: true,
      trim: true,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      minlength: [6, "(الحد الأدنى 6 أحرف) : must be long 6 minimam"],
      required: function () {
        return !this.googleId;
      },
      select: false, // ← مهم: لا يُرجع كلمة المرور في أي query تلقائيًا
    },
    profileImage: {
      type: String,
    },
    // avatar: { type: String, default: "" },
    resetPasswordToken: String, // رمز إعادة تعيين كلمة المرور
    resetPasswordExpires: Date, // تاريخ انتهاء صلاحية رمز إعادة تعيين كلمة المرور
    googleId: String, // التسجيل من خلال جوجل
    isActive: { type: Boolean, default: true }, // لتحديد ما إذا كان المستخدم نشطًا أم لا

    // إذا كان المستخدم نشطًا، يمكنه تسجيل الدخول واستخدام التطبيق
    role: {
      type: String,
      enum: ["user", "admin", "superAdmin"],
      default: "user",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "User", // اسم المجموعه في قاعدة البيانات
  },
);
export default mongoose.model("User", userModel);
