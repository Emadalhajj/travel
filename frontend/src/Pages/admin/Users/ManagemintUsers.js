import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import { formatImagePath } from "../../../Utils/imageUtils";
import { Badge, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import TruncatedText from "../../../Components/common/TruncatedText";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import { cardShadow, flexBetween, flexCenter } from "../../../Utils/classes";
import PageHeader from "../../../Components/layout/PageHeader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import { tripFormConfig } from "../../../Components/common/ModalForms/transport/tripFormConfig";
import { fetchTransports } from "../../../redux/transports/transportSlice";
import EntityFilter from "../../../Components/common/EntityFilter";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";

import {
  fetchUsers,
  fetchUserById,
  createNewUser,
  updateUser,
  deleteUserById,
  toggleStatus,
} from "../../../redux/auth/usersSlice";
import { userFormConfig } from "../../../Components/common/users/userFormConfig";
import ChangePasswordModal from "../../../Components/common/users/ChangePasswordModal";

export default function ManagemintUsers() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const {
    usersList = [],
    loading,
    error,
  } = useSelector((state) => state.users);

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formMode, setFormMode] = useState("create"); // create - update
  //كلمة المرور
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);

  //delete
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  //filters
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    search: "",
  });

  //تحويل قبل تمريرها للفورم iamges
  // const normalizeImagesForForm = (images = []) =>
  //   images.map((img) => ({
  //     url: typeof img === "string" ? img : img.url,
  //     preview: formatImagePath(typeof img === "string" ? img : img.url),
  //     file: null, // صورة قديمة
  //     isOld: true,
  //   }));
  /* ================================
     Helpers
  ================================= */

  const normalizeImagesForForm = (image) =>
    image.find((img) => ({
      url: typeof img === "string" ? img : img.url,
      preview: formatImagePath(typeof img === "string" ? img : img.url),
      file: null, // صورة قديمة
      isOld: true,
    }));

  //open create
  const openCreateModal = () => {
    setFormMode("create");
    setCurrentUser(null);
    setShowModal(true);
  };
  //open update
  const opentUpdateModal = (user) => {
    setFormMode("update");
    setCurrentUser(user);
    setShowModal(true);
  };
  //open details
  const openDetailsModal = (user) => {
    setCurrentUser(user);
    setShowDetails(true);
  };
  /* ================================
     API Calls
  ================================= */
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  //handle save

  const handleSave = async (fd) => {
    // ← إضافة الصورة يدويًا إذا وُجدت
    // if (formState.profileImage instanceof File) {
    //   fd.append("profileImage", formState.profileImage);
console.log("FormData sent:", [...fd.entries()]); // ← أضف ده عشان تشوف إيه بيترسل (شوف username و profileImage)
    try {
      let resultAction;
      if (formMode === "update") {
        resultAction = await dispatch(
          updateUser({ id: currentUser._id, payload: fd }),
        ).unwrap();
        toast.success(
          lang === "ar"
            ? "تم تحديث المستخدم بنجاح"
            : "User updated successfully",
        );
      } else {
        //create
        resultAction = await dispatch(createNewUser(fd)).unwrap();
        toast.success(
          lang === "ar"
            ? "تم إنشاء المستخدم بنجاح"
            : "User created successfully",
        );
      }
      setShowModal(false);
      setCurrentUser(null);
      setFormMode("create");
      dispatch(fetchUsers());
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.message ||
        (lang === "ar" ? "حدث خطأ ما" : "Something went wrong");
      toast.error(msg);
    }
  };
  //handle delete
  const confirmDelete = async () => {
    try {
      await dispatch(deleteUserById(deleteModal.id)).unwrap();
      toast.success(
        lang === "ar" ? "تم حذف المستخدم بنجاح" : "User deleted successfully",
      );
      dispatch(fetchUsers());
    } catch (err) {
      toast.error(lang === "ar" ? "حدث خطا ما" : "An error occurred");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  /* ================================
     Table Columns
  ================================= */
  // دالة مساعدة للحصول على القيمة المحلية (العربية أو الإنجليزية) لأي حقل
  const getLocalizedValue = (row, field, lang) => {
    if (!row) return "";

    const key = lang === "ar" ? `${field}Ar` : `${field}En`;

    return row[key] ?? "";
  };
  const columns = [
    {
      header: lang === "ar" ? "الاسم الكامل" : "Full Name",
      render: (row) => `${row.firstName || ""} ${row.lastName || ""}`,
    },
    {
      header: "Email",
      render: (row) => row.email || "-",
    },
    {
      header: "Username",
      render: (row) => row.username || "-",
    },
    {
      header: lang === "ar" ? "الدور" : "Role",
      render: (row) => {
        const role = row.role;
        return (
          <span
            className={`badge bg-${role === "admin" ? "primary" : "secondary"}`}
          >
            {role === "admin"
              ? lang === "ar"
                ? "مدير"
                : "Admin"
              : lang === "ar"
                ? "مستخدم"
                : "User"}
          </span>
        );
      },
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <span className={`badge bg-${row.isActive ? "success" : "danger"}`}>
          {row.isActive
            ? lang === "ar"
              ? "نشط"
              : "Active"
            : lang === "ar"
              ? "معطل"
              : "Inactive"}
        </span>
      ),
    },
    {
      header: lang === "ar" ? "الإجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <div className="d-flex gap-2 justify-content-center">
          <ActionButton
            action="edit"
            onClick={() => opentUpdateModal(row)}
            size="sm"
          />
          {/* زر تغيير كلمة المرور */}
          <Button
            size="sm"
            variant="outline-warning"
            onClick={() => {
              setSelectedUserForPassword(row);
              setShowPasswordModal(true);
            }}
          >
            {lang === "ar" ? "تعيير كلمة المرور" : "change Password"}
          </Button>
          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,
                id: row._id,
                name: `${row.firstName || ""} ${row.lastName || ""}`,
              })
            }
            size="sm"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-5">
      <PageHeader
        titleAr="إدارة المستخدمين"
        titleEn="Users Management"
        subtitleAr="إضافة وتعديل وحذف المستخدمين"
        subtitleEn="Add, edit, and delete users"
      >
        {/* Action Buttons Row */}
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* Add Button */}
          <div className="position-absolute start-50 translate-middle-x">
            <ActionButton
              action="add"
              onClick={() => openCreateModal()}
              showLabel={true}
              size="md"
            />
          </div>

          {/* Export Buttons */}
          <ExportTableButtons
            data={usersList}
            columns={columns}
            lang={lang}
            filename="Users List"
            title={lang === "ar" ? "قائمة المستخدمين" : "Users List"}
          />
        </div>
      </PageHeader>
      {/* loadign */}
      <div className={`${flexBetween} ${cardShadow} position-relative`}>
        <LoadingOverlay
          show={loading?.fetch || loading?.update || loading?.delete}
          text={lang === "ar" ? "جاري التحميل..." : "Loading..."}
        />
      </div>
      <ErrorOverlay show={!!error} message={error} />

      <UniversalTable
        columns={columns}
        data={usersList}
        emptyMessage={lang === "ar" ? "لا توجد بيانات" : "No data found"}
      />
      {/* details modal */}
      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
      />
      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={
          formMode === "create"
            ? lang === "ar"
              ? "إنشاء مستخدم جديد"
              : "Create New User"
            : lang === "ar"
              ? "تحديث المستخدم"
              : "Update User"
        }
        onSave={handleSave}
        initialData={currentUser}
        config={userFormConfig({ isCreate: formMode === "create" })}
        titleAr={formMode === "create" ? "إنشاء مستخدم جديد" : "تحديث المستخدم"}
        titleEn={formMode === "create" ? "Create New User" : "Update User"}
      />
      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: null })}
        title={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={
          lang === "ar"
            ? `هل أنت متأكد من حذف المستخدم ${deleteModal.name}؟`
            : `Are you sure you want to delete the user ${deleteModal.name}?`
        }
        onConfirm={confirmDelete}
        confirmText={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />
<ChangePasswordModal
  show={showPasswordModal}
  onHide={() => {
    setShowPasswordModal(false);
    setSelectedUserForPassword(null);
  }}
  userId={selectedUserForPassword?._id}
  userName={
    selectedUserForPassword
      ? `${selectedUserForPassword.firstName || ""} ${selectedUserForPassword.lastName || ""}`
      : ""
  }
  onSuccess={() => {
    toast.info(lang === "ar" ? "تم التحديث" : "Updated");
    // اختياري: إعادة جلب القائمة إذا أردت
    // dispatch(fetchUsers());
  }}
  requireCurrentPassword={false} // ← الأدمن لا يحتاج كلمة المرور الحالية
/>
    </div>
  );
}
