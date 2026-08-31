import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  setLimit,
  setPage,
  updatePaymentMethod,
  updatePaymentMethodStatus,
  selectPaymentMethodItems,
  selectPaymentMethodPagination,
  selectPaymentMethodListLoading,
  selectPaymentMethodListError,
} from "../../../redux/payments/paymentMethodSlice";
import { paymentMethodFormConfig } from "../../../Components/common/ModalForms/payments/paymentMethodFormConfig";
import { buildQuery } from "../../../Utils/buildQuery";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { handleApiError } from "../../../Utils/handleApiError";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

export default function AdminPaymentMethodsPage() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const paymentMethodsList = useSelector(selectPaymentMethodItems);
  const pagination = useSelector(selectPaymentMethodPagination);
  const loading = useSelector(selectPaymentMethodListLoading);
  const error = useSelector(selectPaymentMethodListError);
  const [filters, setFilters] = useState({ search: "", type: "", isActive: "" });

  const formConfig = useMemo(() => paymentMethodFormConfig(), []);
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const {
    showModal,
    showDetails,
    currentItem: currentMethod,
    formMode,
    formErrors,
    loadingSave,
    deleteModal,
    openCreate,
    openEdit,
    openClone,
    openDetails,
    openDelete,
    closeForm,
    closeDetails,
    closeDelete,
    resetForm,
    setFormErrors,
    setLoadingSave,
  } = useAdminEntityCrudState({
    prepareForForm: (method) => normalizeForForm(method, formConfig),
    prepareClone: (method, normalized) => ({
      ...normalized,
      _id: null,
      code: "",
      nameAr: `${method.nameAr || ""} (نسخة)`,
      nameEn: `${method.nameEn || method.nameAr || ""} (Copy)`,
      isActive: false,
    }),
  });

  useEffect(() => {
    dispatch(fetchPaymentMethods(listQuery));
  }, [dispatch, listQuery]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: createPaymentMethod,
    updateAction: updatePaymentMethod,
    fetchAction: () => fetchPaymentMethods(listQuery),
    getId: (item) => item._id,
    formConfig,
    toast,
    lang,
    closeModal: closeForm,
    resetItem: resetForm,
    setLoading: setLoadingSave,
    setFormErrors,
    useFormData: false,
  });

  const handleStatusChange = async (method) => {
    const isActive = !method.isActive;
    try {
      await dispatch(
        updatePaymentMethodStatus({ id: method._id, data: { isActive } }),
      ).unwrap();
      toast.success(
        isActive
          ? isArabic ? "تم تفعيل طريقة الدفع" : "Payment method activated"
          : isArabic ? "تم تعطيل طريقة الدفع" : "Payment method deactivated",
      );
      dispatch(fetchPaymentMethods(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deletePaymentMethod(deleteModal.id)).unwrap();
      toast.success(isArabic ? "تم حذف طريقة الدفع" : "Payment method deleted");
      dispatch(fetchPaymentMethods(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const typeLabel = (type) => {
    const labels = {
      offline: { ar: "غير إلكتروني", en: "Offline" },
      online: { ar: "إلكتروني", en: "Online" },
      invoice: { ar: "فاتورة", en: "Invoice" },
      cash: { ar: "نقدي", en: "Cash" },
      credit: { ar: "آجل", en: "Credit" },
    };
    return labels[type]?.[isArabic ? "ar" : "en"] || type || "-";
  };

  const requirementsLabel = (method) => {
    const values = [
      method.requiresBankAccount ? (isArabic ? "حساب بنكي" : "Bank Account") : null,
      method.requiresPaymentProvider ? (isArabic ? "مزود دفع" : "Provider") : null,
      method.requiresProofUpload ? (isArabic ? "رفع إثبات" : "Proof Upload") : null,
    ].filter(Boolean);
    return values.join(" • ") || "-";
  };

  const columns = [
    { header: "#", align: "center", exportable: false, render: (_, index) => index + 1 },
    {
      header: isArabic ? "طريقة الدفع" : "Payment Method",
      render: (row) => (
        <div><strong>{isArabic ? row.nameAr : row.nameEn || row.nameAr}</strong><div className="small text-muted">{row.code}</div></div>
      ),
      excelValue: (row) => isArabic ? row.nameAr : row.nameEn || row.nameAr,
    },
    { header: isArabic ? "النوع" : "Type", render: (row) => typeLabel(row.type) },
    { header: isArabic ? "المتطلبات" : "Requirements", render: requirementsLabel, excelValue: requirementsLabel },
    { header: isArabic ? "الترتيب" : "Order", align: "center", render: (row) => row.sortOrder ?? 0, excelValue: (row) => row.sortOrder ?? 0, excelType: "number" },
    {
      header: isArabic ? "الحالة" : "Status",
      align: "center",
      render: (row) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <StatusBadge value={row.isActive ? "active" : "inactive"} type="user" isArabic={isArabic} />
          <ActionButton action={row.isActive ? "deactivate" : "activate"} onClick={() => handleStatusChange(row)} />
        </div>
      ),
    },
    {
      header: isArabic ? "الإجراءات" : "Actions",
      align: "center",
      exportable: false,
      render: (row) => (
        <div className="d-flex justify-content-center gap-1">
          <ActionButton action="edit" onClick={() => openEdit(row)} />
          <ActionButton action="clone" onClick={() => openClone(row)} />
          <ActionButton action="view" onClick={() => openDetails(row)} />
          <ActionButton action="delete" onClick={() => openDelete(row, isArabic ? row.nameAr : row.nameEn || row.nameAr)} />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-3">
      <PageHeader titleAr="إدارة طرق الدفع" titleEn="Payment Methods Management" subtitleAr="إدارة طرق الدفع ومتطلبات كل طريقة وحالة تفعيلها" subtitleEn="Manage payment methods, requirements, status, and display order" actions={<AdminPageActions><ActionButton action="add" size="md" label={isArabic ? "إضافة طريقة دفع" : "Add Payment Method"} onClick={openCreate} /><ExportTableButtons data={paymentMethodsList} columns={columns} fileName="payment-methods" lang={lang} title={isArabic ? "طرق الدفع" : "Payment Methods"} /></AdminPageActions>} />
      <EntityFilter filters={filters} setFilters={setFilters} config={{
        search: { type: "text", col: 4, placeholder: isArabic ? "بحث بالاسم أو الكود" : "Search by name or code" },
        type: { type: "select", col: 4, options: [
          { value: "offline", labelAr: "غير إلكتروني", labelEn: "Offline" },
          { value: "online", labelAr: "إلكتروني", labelEn: "Online" },
          { value: "invoice", labelAr: "فاتورة", labelEn: "Invoice" },
          { value: "cash", labelAr: "نقدي", labelEn: "Cash" },
          { value: "credit", labelAr: "آجل", labelEn: "Credit" },
        ] },
        isActive: { type: "select", col: 4, options: [
          { value: "true", labelAr: "مفعل", labelEn: "Active" },
          { value: "false", labelAr: "غير مفعل", labelEn: "Inactive" },
        ] },
      }} />
      <LoadingOverlay show={loading} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <UniversalTable columns={columns} data={paymentMethodsList} lang={lang} emptyMessage={isArabic ? "لا توجد طرق دفع" : "No payment methods found"} />
      <PaginationComponent total={pagination.total} page={pagination.page} limit={pagination.limit} totalPages={pagination.totalPages} onPageChange={(page) => dispatch(setPage(page))} onLimitChange={(limit) => dispatch(setLimit(limit))} />
      <UniversalFormModal show={showModal} onHide={closeForm} onSave={(data) => handleSave(data, { formMode, currentItem: currentMethod })} config={formConfig} initialData={currentMethod} titleAr={formMode === "edit" ? "تعديل طريقة الدفع" : "إضافة طريقة دفع"} titleEn={formMode === "edit" ? "Edit Payment Method" : "Add Payment Method"} errors={formErrors} loading={loadingSave} />
      <EntityDetailsModal show={showDetails} onHide={closeDetails} title={isArabic ? "تفاصيل طريقة الدفع" : "Payment Method Details"} entity={currentMethod} fields={[
        { label: isArabic ? "الاسم بالعربية" : "Arabic Name", value: currentMethod?.nameAr || "-" },
        { label: isArabic ? "الاسم بالإنجليزية" : "English Name", value: currentMethod?.nameEn || "-" },
        { label: isArabic ? "الكود" : "Code", value: currentMethod?.code || "-" },
        { label: isArabic ? "النوع" : "Type", value: typeLabel(currentMethod?.type) },
        { label: isArabic ? "المتطلبات" : "Requirements", value: currentMethod ? requirementsLabel(currentMethod) : "-" },
        { label: isArabic ? "الحالة" : "Status", value: currentMethod?.isActive ? (isArabic ? "مفعل" : "Active") : (isArabic ? "غير مفعل" : "Inactive") },
      ]} />
      <ConfirmDialog show={deleteModal.show} onHide={closeDelete} onConfirm={confirmDelete} title={isArabic ? "تأكيد الحذف" : "Confirm Delete"} message={isArabic ? `هل أنت متأكد من حذف ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name}?`} confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"} cancelText={isArabic ? "إلغاء" : "Cancel"} variant="danger" />
    </div>
  );
}
