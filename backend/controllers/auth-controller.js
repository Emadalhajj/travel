import User from "../models/user-model.js";

//مكتبة صغيرة جدًا وظيفتها الأساسية:asyncHandler
//🔹 “التعامل مع الأخطاء تلقائيًا داخل الدوال غير المتزامنة (async functions) في Express دون الحاجة لاستخدام try/catch يدويًا.”

import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt"; // لتشفير كلمات المرور
import jwt from "jsonwebtoken";
import { extractUploadedImages } from "../utils/imageManager.js";

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // 1️⃣ تحقق من وجود المستخدم مسبقاً
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already registered" });
  }

  // 2️⃣ تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3️⃣ إنشاء المستخدم
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  await newUser.save();

  // 4️⃣ إنشاء نسخة بدون كلمة المرور
  const userObj = newUser.toObject();
  delete userObj.password;

  // 5️⃣ إنشاء JWT
  const token = jwt.sign(
    {
      userId: newUser._id,
      email: newUser.email, 
      role: newUser.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  res.status(201).json({
    message: "User registered successfully",
    user: userObj,
    token, 

  }); 

  console.log("✅ User registered:", newUser.email);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // تحقق من وجود الإيميل وكلمة المرور
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "الإيميل وكلمة المرور مطلوبين" });
  }

  // 1) العثور على المستخدم

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).json({ message: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message:
        "هذا الحساب غير مفعل حاليًا. يرجى التواصل مع الإدارة لتفعيله.",
    });
  }

  // ← التحقق المهم هنا
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: "هذا الحساب مسجل عبر Google، يرجى تسجيل الدخول باستخدام Google",
    });
  }

  // 2) مقارنة الباسورد
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(404).json({ message: "Invalid credentials" });
  }
  // 3) إنشاء JWT

  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

  // 4) إرجاع المستخدم + توكن

  const userObj = user.toObject(); // عشان نقدر نحذف الباسورد قبل الإرجاع
  delete userObj.password; // ← مهم: لا تُرجع كلمة المرور في أي استجابة

  res.status(200).json({ user: userObj, token });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user; // ← تأكد أن هذا يأتي من الـ auth middleware
  const { firstName, lastName, username, email } = req.body;
  // const profileImage = req.file ? req.file.path : undefined; // إذا تم رفع صورة جديدة

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  // إذا تم رفع صورة جديدة
  // معالجة الصورة بشكل صحيح (دعم fields)
  if (req.files && req.files.profileImage) {
    const profileImageFile = req.files.profileImage[0]; // لأنه array حتى لو ملف واحد
    if (profileImageFile) {
      updateData.profileImage = profileImageFile.path; // أو profileImageFile.filename حسب extractUploadedImages
    }
  }

  // أو لو بتستخدم extractUploadedImages (كما في createUser)
  const profileImage = extractUploadedImages(req.files, "profileImage")[0];
  if (profileImage) {
    updateData.profileImage = profileImage;
  }
  const updatedUser = await User.findByIdAndUpdate(userId._id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({
    success: true,
    data: updatedUser,
    message: "Profile updated successfully",
  });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  // const userId = req.user; // ← تأكد أن هذا يأتي من الـ auth middleware
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // 1. التحقق من الحقول
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res
      .status(400)
      .json({ success: false, message: "جميع الحقول مطلوبة" });
  }
  if (newPassword !== confirmNewPassword) {
    return res
      .status(400)
      .json({ success: false, message: "كلمات المرور الجديدة غير متطابقة" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "كلمة المرور الجديدة يجب أن تكون أكثر من 6 أحرف",
    });
  }
  // 2. التحقق من كلمة المرور الحالية
  const isMatch = await bcrypt.compare(currentPassword, user.password); //مقارنة كلمة المرور الحالية مع المخزنة في قاعدة البيانات
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });
  }
  // 3. تشفير كلمة المرور الجديدة وتحديثها في قاعدة البيانات
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "تم تغيير كلمة المرور بنجاح",
    // data : user
  });
});
 