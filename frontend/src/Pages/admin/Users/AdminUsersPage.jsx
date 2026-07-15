import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Container, Form, Modal, Tab, Table } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUser,
  fetchUsers,
  resetUserPassword,
  toggleUserStatus,
  updateUser,
} from "../../../redux/users/adminUserActions";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();

  const { users, loading, error } = useSelector(
    (state) => state.AdminUserReducer
  );
  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [modalType, setModalType] = useState("");

  // هذه الصفحة مخصصة لإدارة المستخدمين
  // const [users, setUsers] = useState([]);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers()); // جلب المستخدمين من الخادم
  }, [dispatch]);

  //delete user
  const handleUserDelete = (userId) => {
    if (window.confirm(t("AdminUsersPage.confirm_delete"))) {
      dispatch(deleteUser(userId));
      // هنا يمكنك إضافة منطق لحذف المستخدم من الواجهة
    }
  };

  const handleUserDisable = (userId, isActive) => {
    dispatch(toggleUserStatus({ userId, isActive: !isActive }));
    // هنا يمكنك إضافة منطق لتعطيل أو تفعيل المستخدم من الواجهة
  };

  // edit user information

  // فتح النموذج لتحديث المستخدم
  const handleUpdate = (userId) => {
    setSelectedUserId(userId); // تعيين معرف المستخدم المحدد
    setModalType("edit");
    setShowModal(true); // فتح النموذج
  };

  // مكون النموذج لتحديث المستخدم
  const UpdateUserForm = ({ userId, onClose }) => {
    const [formData, setFormData] = useState({
      username: "",
      email: "",
      password: "",
    });

    // جلب بيانات المستخدم الأصلية عند فتح النموذج
    const currentUser = users.find((user) => user._id === userId) || {
      username: "",
      email: "",
      password: "",
    };

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.username && formData.email) {
        dispatch(updateUser({ userId, userData: formData }))
          .then(() => {
            toast.success(t("AdminUsersPage.toast_success_update"));
            onClose(); // إغلاق النموذج بعد النجاح
          })
          .catch((error) => {
            console.error("فشل في التحديث: update fiald", error);
          });
      }
    };

    useEffect(() => {
      setFormData({
        username: currentUser.username || "",
        email: currentUser.email || "",
        password: currentUser.password || "",
      });
    }, [userId, currentUser]);

    return (
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {t("AdminUsersPage.modal_update_title")}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("AdminUsersPage.modal_update_username")}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("AdminUsersPage.modal_update_email")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white p-2 rounded-md hover:from-blue-700 hover:to-blue-900 transition duration-300"
            >
              {t("AdminUsersPage.modal_update_submit")}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // إعادة تعيين كلمة المرور

  // فتح النموذج لإعادة تعيين كلمة المرور 1
  const handleOpenResetModal = (userId) => {
    setSelectedUserId(userId); // تعيين معرف المستخدم المحدد
    setModalType("reset");
    setShowModal(true); // فتح النموذج
  };

  const ResetUserPasswordForm = ({ userId, onClose }) => {
    const [newPassword, setNewPassword] = useState("");
    const handleChange = (e) => {
      setNewPassword(e.target.value);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!newPassword || newPassword.length < 6) {
        toast.error(t("AdminUsersPage.toast_error_password"));
        return;
      }

      dispatch(resetUserPassword({ userId, newPassword }))
        .then(() => {
          toast.success(t("AdminUsersPage.toast_success_reset"));
          onClose(); // إغلاق النموذج بعد النجاح
        })
        .catch((error) => {
          console.error(
            "فشل في إعادة تعيين كلمة المرور: rest passwords is fiald",
            error
          );
        });
      //console.log("Resetting password for:", userId, newPassword);
    };

    return (
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {t("AdminUsersPage.modal_reset_title")}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("AdminUsersPage.modal_reset_password")}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-600 text-white p-2 rounded-md hover:from-yellow-700 hover:to-yellow-900 transition duration-300"
            >
              {t("AdminUsersPage.modal_reset_submit")}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
  
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-center">
            {t("AdminUsersPage.page_title")}
          </h1>
        </div>
        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-700">{t("AdminUsersPage.loading")}</p>
          </div>
        )}
        {error && (
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {users.length === 0 && !loading && !error && (
          <div className="text-center py-4">
            <p className="text-gray-700">{t("AdminUsersPage.no_users")}</p>
          </div>
        )}
        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden o">
            <div className="overflow-x-auto">
              {" "}
              {/* ✅ يضيف تمرير أفقي للشاشات الصغيرة */}
              <table className="w-full table-fixed text-sm text-gray-700">
                {" "}
                {/* ✅ table-fixed لتوازن الأعمدة */}
                <thead className="bg-blue-100 text-gray-800">
                  <tr>
                    <th className="w-12 py-3 px-4 text-center font-semibold">
                      {t("AdminUsersPage.table_no")}
                    </th>
                    <th className="w-40 py-3 px-4 text-center font-semibold">
                      {t("AdminUsersPage.table_username")}
                    </th>
                    <th className="w-60 py-3 px-4 text-center font-semibold">
                      {t("AdminUsersPage.table_email")}
                    </th>
                    <th className="w-32 py-3 px-4 text-center font-semibold">
                      {t("AdminUsersPage.table_role")}
                    </th>
                    <th className="w-32 py-3 px-4 text-center font-semibold">
                      {t("AdminUsersPage.table_status")}
                    </th>
                    <th className="w-72 py-3 px-4 text-center font-semibold">
                      {t("AdminUsersPage.table_actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user._id}
                      className="border-b hover:bg-gray-50 transition duration-150"
                    >
                      <td className="py-3 px-4 text-center">{index + 1}</td>
                      <td className="py-3 px-4 text-center">{user.username}</td>
                      <td className="py-3 px-4 text-center">{user.email}</td>
                      <td className="py-3 px-4 text-center">{user.role}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2 gap-2">{/* ✅ صف واحد + تباعد منظم */}
                          <Form.Check
                            type="switch"
                            id={`custom-switch-${user._id}`}
                            checked={user.isActive}
                            onChange={() =>
                              handleUserDisable(user._id, user.isActive)
                            }
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                          <span
                            className={
                              user.isActive ? "text-green-600" : "text-red-600"
                            }
                          >
                            {user.isActive
                              ? t("AdminUsersPage.status_active")
                              : t("AdminUsersPage.status_inactive")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <button
                          onClick={() => handleUpdate(user._id)}
                          className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-1 rounded-md hover:from-blue-700 hover:to-blue-900 transition duration-300"
                        >
                          {t("AdminUsersPage.button_edit")}
                        </button>
                        <button
                          onClick={() => handleUserDelete(user._id)}
                          className="bg-gradient-to-r from-red-600 to-red-800 text-white px-3 py-1 rounded-md hover:from-red-700 hover:to-red-900 transition duration-300"
                        >
                          {t("AdminUsersPage.button_delete")}
                        </button>
                        <button
                          onClick={() => handleOpenResetModal(user._id)}
                          className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-3 py-1 rounded-md hover:from-yellow-700 hover:to-yellow-900 transition duration-300"
                        >
                          {t("AdminUsersPage.button_reset_password")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {showModal && modalType === "edit" && selectedUserId && (
          <UpdateUserForm
            userId={selectedUserId}
            onClose={() => {
              setShowModal(false);
              setSelectedUserId(null);
            }}
          />
        )}
        {showModal && modalType === "reset" && selectedUserId && (
          <ResetUserPasswordForm
            userId={selectedUserId}
            onClose={() => {
              setShowModal(false);
              setSelectedUserId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
