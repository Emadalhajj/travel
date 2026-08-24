import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import PageHeader from "../../../Components/layout/PageHeader";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import PaginationComponent from "../../../Components/common/Pagination";
import ChangePasswordModal from "../../../Components/common/users/ChangePasswordModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import {
  normalizeUserForForm,
  userFormConfig,
} from "../../../Components/common/users/userFormConfig";
import {
  createNewUser,
  deleteUserById,
  fetchUsers,
  toggleStatus,
  updateUser,
} from "../../../redux/auth/usersSlice";
import useAuthorization from "../../../hooks/auth/useAuthorization";
import { USER_ROLES } from "../../../constants/auth/roles";
import { buildFormData } from "../../../Utils/formData/buildFormData";

const errorMessage = (error, fallback) => {
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  return Object.values(error || {}).find((value) => typeof value === "string") || fallback;
};

const fieldErrors = (error) => {
  if (!error || typeof error !== "object") return {};
  return error.errors || (error.message ? {} : error);
};

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar") === "ar";
  const { isSuperAdmin, canManageUser, canDeactivateUser } = useAuthorization();
  const { usersList = [], total = 0, loading = {}, error } = useSelector(
    (state) => state.users,
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formModal, setFormModal] = useState({ show: false, mode: "create", user: null });
  const [formErrors, setFormErrors] = useState({});
  const [detailsUser, setDetailsUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [deactivateUser, setDeactivateUser] = useState(null);

  const loadUsers = useCallback(
    () => dispatch(fetchUsers({ page, limit })),
    [dispatch, page, limit],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const formConfig = useMemo(
    () => userFormConfig({
      isCreate: formModal.mode === "create",
      allowedRoles: isSuperAdmin
        ? Object.values(USER_ROLES)
        : [USER_ROLES.USER],
    }),
    [formModal.mode, isSuperAdmin],
  );

  const closeForm = () => {
    setFormModal({ show: false, mode: "create", user: null });
    setFormErrors({});
  };

  const handleSave = async (payload) => {
    try {
      const requestPayload = payload?.imageState
        ? buildFormData(payload, formConfig)
        : payload;
      if (formModal.mode === "update") {
        await dispatch(
          updateUser({ id: formModal.user._id, payload: requestPayload }),
        ).unwrap();
      } else {
        await dispatch(createNewUser(requestPayload)).unwrap();
      }
      toast.success(
        isArabic
          ? formModal.mode === "update" ? "تم تحديث المستخدم" : "تم إنشاء المستخدم"
          : formModal.mode === "update" ? "User updated" : "User created",
      );
      closeForm();
      loadUsers();
    } catch (operationError) {
      setFormErrors(fieldErrors(operationError));
      toast.error(errorMessage(operationError, isArabic ? "تعذر حفظ المستخدم" : "Unable to save user"));
    }
  };

  const handleActivate = useCallback(async (user) => {
    try {
      await dispatch(toggleStatus(user._id)).unwrap();
      toast.success(isArabic ? "تم تفعيل المستخدم" : "User activated");
    } catch (operationError) {
      toast.error(errorMessage(operationError, isArabic ? "تعذر تفعيل المستخدم" : "Unable to activate user"));
    }
  }, [dispatch, isArabic]);

  const confirmDeactivate = async () => {
    if (!deactivateUser) return;
    try {
      await dispatch(deleteUserById(deactivateUser._id)).unwrap();
      toast.success(isArabic ? "تم تعطيل المستخدم" : "User deactivated");
      setDeactivateUser(null);
      loadUsers();
    } catch (operationError) {
      toast.error(errorMessage(operationError, isArabic ? "تعذر تعطيل المستخدم" : "Unable to deactivate user"));
    }
  };

  const columns = useMemo(() => [
    {
      header: isArabic ? "الاسم الكامل" : "Full name",
      render: (user) => `${user.firstName || ""} ${user.lastName || ""}`.trim() || "-",
    },
    { header: isArabic ? "اسم المستخدم" : "Username", accessor: "username" },
    { header: isArabic ? "البريد الإلكتروني" : "Email", accessor: "email" },
    {
      header: isArabic ? "الدور" : "Role",
      render: (user) => ({
        [USER_ROLES.USER]: isArabic ? "مستخدم" : "User",
        [USER_ROLES.ADMIN]: isArabic ? "مدير" : "Admin",
        [USER_ROLES.SUPER_ADMIN]: isArabic ? "مشرف عام" : "Super Admin",
      })[user.role] || user.role,
    },
    {
      header: isArabic ? "الحالة" : "Status",
      render: (user) => (
        <StatusBadge value={user.isActive ? "active" : "inactive"} type="user" isArabic={isArabic} />
      ),
    },
    {
      header: isArabic ? "الإجراءات" : "Actions",
      render: (user) => (
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <ActionButton action="view" onClick={() => setDetailsUser(user)} />
          {canManageUser(user) && (
            <>
              <ActionButton
                action="edit"
                onClick={() => {
                  setFormErrors({});
                  setFormModal({ show: true, mode: "update", user });
                }}
              />
              <ActionButton action="resetPassword" onClick={() => setPasswordUser(user)} />
              {user.isActive
                ? canDeactivateUser(user) && (
                    <ActionButton action="deactivate" onClick={() => setDeactivateUser(user)} />
                  )
                : <ActionButton action="activate" onClick={() => handleActivate(user)} />}
            </>
          )}
        </div>
      ),
    },
  ], [isArabic, canManageUser, canDeactivateUser, handleActivate]);

  const isBusy = Object.values(loading).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container py-5">
      <PageHeader
        titleAr="إدارة المستخدمين"
        titleEn="Users Management"
        subtitleAr="إدارة الحسابات والأدوار والحالة"
        subtitleEn="Manage accounts, roles and status"
        actions={
          <AdminPageActions>
            <ActionButton
              action="add"
              showLabel
              onClick={() => {
                setFormErrors({});
                setFormModal({ show: true, mode: "create", user: null });
              }}
            />
          </AdminPageActions>
        }
      />

      <div className="position-relative bg-white rounded shadow-sm overflow-hidden">
        <LoadingOverlay show={isBusy} text={isArabic ? "جاري التحميل..." : "Loading..."} />
        <ErrorOverlay show={Boolean(error)} message={errorMessage(error, "Unable to load users")} />
        <UniversalTable
          columns={columns}
          data={usersList}
          lang={isArabic ? "ar" : "en"}
          emptyMessage={isArabic ? "لا يوجد مستخدمون" : "No users found"}
        />
      </div>

      <div className="mt-4">
        <PaginationComponent
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />
      </div>

      <UniversalFormModal
        show={formModal.show}
        onHide={closeForm}
        onSave={handleSave}
        config={formConfig}
        initialData={normalizeUserForForm(formModal.user)}
        errors={formErrors}
        loading={loading.create || loading.update}
        titleAr={formModal.mode === "create" ? "إضافة مستخدم" : "تعديل المستخدم"}
        titleEn={formModal.mode === "create" ? "Create User" : "Edit User"}
      />

      <ChangePasswordModal
        show={Boolean(passwordUser)}
        onHide={() => setPasswordUser(null)}
        userId={passwordUser?._id}
        userName={passwordUser?.username}
        requireCurrentPassword={false}
      />

      <ConfirmDialog
        show={Boolean(deactivateUser)}
        onHide={() => setDeactivateUser(null)}
        onConfirm={confirmDeactivate}
        loading={loading.delete}
        variant="block"
        title={isArabic ? "تعطيل المستخدم" : "Deactivate user"}
        message={isArabic
          ? `هل تريد تعطيل حساب ${deactivateUser?.username || "المستخدم"}؟`
          : `Deactivate ${deactivateUser?.username || "this user"}?`}
        confirmText={isArabic ? "تأكيد التعطيل" : "Deactivate"}
        cancelText={isArabic ? "إلغاء" : "Cancel"}
      />

      <EntityDetailsModal
        show={Boolean(detailsUser)}
        onHide={() => setDetailsUser(null)}
        title={detailsUser?.username || "User"}
        images={detailsUser?.profileImage ? [detailsUser.profileImage] : []}
        fields={detailsUser ? [
          { label: isArabic ? "الاسم" : "Name", value: `${detailsUser.firstName || ""} ${detailsUser.lastName || ""}`.trim() },
          { label: isArabic ? "البريد" : "Email", value: detailsUser.email },
          { label: isArabic ? "الدور" : "Role", value: detailsUser.role },
          { label: isArabic ? "الحالة" : "Status", value: detailsUser.isActive ? (isArabic ? "نشط" : "Active") : (isArabic ? "معطل" : "Inactive") },
        ] : []}
      />
    </div>
  );
}
