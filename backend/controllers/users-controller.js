import User from "../models/user-model.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { buildSearchQuery } from "../utils/Builders/buildSearchQuery.js";
import { buildSort } from "../utils/Builders/buildSort.js";
import { buildPagination } from "../utils/Builders/buildPagination.js";
import { extractUploadedImages } from "../utils/imageManager.js";

// get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, isActive } = req.query;

  const filter = {
    ...buildSearchQuery({
      search,
      searchFields: ["firstName", "lastName", "email", "username"],
    }),
  };
  // 2️⃣ Filters إضافية
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }
  //  3️⃣ Sort + Pagination
  const sortOption = buildSort(req.query);
  const { skip, limit } = buildPagination(req.query);
  // 4️⃣ Query
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "nameEn username")
      .select("-password"), // لا ترجع كلمة المرور
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      total,
    },
  });
});

//get user by id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

//create user
export const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, role } = req.body;
  const hashedPassword = await hashPassword(password);
  const profileImage = extractUploadedImages(req.files, "profileImage")[0];

  const newUser = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    role,
    profileImage,
  });

  res.status(201).json({
    success: true,
    data: newUser,
    message: "User created successfully",
  });
});
//update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, username, email, role, isActive } = req.body;
  const updateData = {
    firstName,
    lastName,
    username,
    email,
    role,
    isActive,
  };

  // إذا تم إرسال كلمة مرور جديدة
  if (req.body.password) {
    updateData.password = await hashPassword(req.body.password);
  }

  // إذا تم رفع صورة جديدة
  const profileImage = extractUploadedImages(req.files, "profileImage")[0];
  if (profileImage) {
    updateData.profileImage = profileImage;
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: "User updated successfully",
  });
});

//delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    data: { id },
    message: "User deleted successfully",
  });
}); 

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  user.isActive = !user.isActive;
  await user.save();
  res.status(200).json({
    success: true,
    data: user,
    message: user.isActive
      ? "User activated successfully"
      : "User deactivated successfully",
  });
});
//change password
export const changePasswordUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "كلمة المرور يجب أن تكون أكثر من 6 أحرف",
    });
  }
  const hashedPasword = await hashPassword(password);

  const userAccount = await User.findByIdAndUpdate(
    id,
    { password: hashedPasword },
    { new: true },
  ).select("-password");
  if (!userAccount) {
    return res
      .status(404)
      .json({ success: false, message: "المستخدم غير موجود" });
  }

  res.status(200).json({
    success: true,
    data: userAccount,
    message: "تم تغيير كلمة المرور بنجاح",
  });
});
