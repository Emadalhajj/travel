// src/pages/client/Profile.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { updateMyProfile } from "../../redux/auth/authSlice"; // افترض أنك أضفت الـ thunk ده
import ImageUploader from "../../Components/common/ImageUploader";
import ChangePasswordModal from "../../Components/common/users/ChangePasswordModal";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authState = useSelector((state) => state.auth);
  const loading = authState?.loading;
  const currentUser = authState?.currentUser?.user || authState?.currentUser;

  //password change
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    profileImage: null,
  });

  useEffect(() => {
    if (currentUser) {
      setForm({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        profileImage: null,
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (data) => {
    if (data.newImages?.length > 0) {
      setForm({ ...form, profileImage: data.newImages[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("firstName", form.firstName);
    fd.append("lastName", form.lastName);
    fd.append("username", form.username);
    fd.append("email", form.email);
    if (form.profileImage instanceof File) {
      fd.append("profileImage", form.profileImage);
    }

    try {
      await dispatch(updateMyProfile(fd)).unwrap();
      toast.success(
        lang === "ar"
          ? "تم تحديث الملف الشخصي"
          : "Profile updated successfully",
      );
    } catch (err) {
      toast.error(
        err?.message || (lang === "ar" ? "حدث خطأ" : "An error occurred"),
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {lang === "ar" ? "يرجى تسجيل الدخول" : "Please sign in"}
          </h3>
          <Button variant="primary" onClick={() => navigate("/authpage")}>
            {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              {lang === "ar" ? "الملف الشخصي" : "My Profile"}
            </h1>
            <p className="text-indigo-100">
              {lang === "ar"
                ? "قم بتحديث بياناتك الشخصية هنا"
                : "Update your personal information here"}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 lg:p-12">
            <div className="flex flex-col items-center mb-10">
              <div className="relative">
                <ImageUploader
                  initialImages={
                    currentUser?.profileImage
                      ? [
                          {
                            url: currentUser.profileImage.startsWith("http")
                              ? currentUser.profileImage
                              : `http://localhost:5000/${currentUser.profileImage}`,
                            isOld: true,
                          },
                        ]
                      : []
                  }
                  onChange={handleImageChange}
                  multiple={false}
                  maxImages={1}
                />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                {currentUser.firstName} {currentUser.lastName}
              </h2>
              <p className="text-gray-500">{currentUser.email}</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Group>
                  <Form.Label className="font-medium text-gray-700">
                    {lang === "ar" ? "الاسم الأول" : "First Name"}
                  </Form.Label>
                  <Form.Control
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="font-medium text-gray-700">
                    {lang === "ar" ? "الاسم الأخير" : "Last Name"}
                  </Form.Label>
                  <Form.Control
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="font-medium text-gray-700">
                    {lang === "ar" ? "اسم المستخدم" : "Username"}
                  </Form.Label>
                  <Form.Control
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="font-medium text-gray-700">
                    {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                  </Form.Label>
                  <Form.Control
                    disabled
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </Form.Group>

                <Button
                  variant="outline-primary"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="mt-4"
                >
                  {lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                </Button>
              </div>

              <div className="mt-10">
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner animation="border" size="sm" />
                      <span>
                        {lang === "ar" ? "جاري الحفظ..." : "Saving..."}
                      </span>
                    </div>
                  ) : lang === "ar" ? (
                    "حفظ التغييرات"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
      <ChangePasswordModal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          toast.info(lang === "ar" ? "تم التحديث" : "Updated");
          // اختياري: إعادة جلب القائمة إذا أردت
          // dispatch(fetchUsers());
        }}
        requireCurrentPassword={true}
      />
    </div>
  );
}
