import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createPaymentProvider,
  deletePaymentProvider,
  fetchPaymentProviderById,
  fetchPaymentProviders,
  updatePaymentProvider,
  updatePaymentProviderStatus,
  selectPaymentProviders,
  selectPaymentProviderPagination,
  selectPaymentProviderListLoading,
  selectPaymentProviderDetailsLoading,
  selectPaymentProviderMutationLoading,
  selectPaymentProviderError,
} from "../../../redux/payments/paymentProviderSlice";
import { paymentProviderFormConfig } from "../../../Components/common/ModalForms/payments/paymentProviderFormConfig";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { serializeForApi } from "../../../Utils/formData/serialize";
import { buildQuery } from "../../../Utils/buildQuery";
import { handleApiError } from "../../../Utils/handleApiError";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

const MASKED_CREDENTIAL_VALUES = new Set(["********", "••••••••", "•••••••", "[REDACTED]"]);
const EMPTY_CREDENTIALS = {
  entityId: "", accessToken: "", webhookSecret: "", publishableKey: "",
  secretKey: "", apiKey: "", merchantId: "", terminalId: "",
  profileId: "", serverKey: "", clientKey: "",
};
const EMPTY_FILTERS = { search: "", environment: "", isActive: "" };

const cleanCredentialsForApi = (credentials = {}) =>
  Object.fromEntries(
    Object.entries(credentials).filter(([, value]) => {
      const normalized = value == null ? "" : String(value).trim();
      return normalized && !MASKED_CREDENTIAL_VALUES.has(normalized);
    }).map(([key, value]) => [key, String(value).trim()]),
  );

const prepareProviderForForm = (provider, config) => ({
  ...normalizeForForm(provider || {}, config),
  credentials: { ...EMPTY_CREDENTIALS },
});

const prepareProviderPayload = (formData, config) => {
  const payload = serializeForApi(formData?.formState || formData || {}, config);
  const credentials = cleanCredentialsForApi(payload.credentials);
  ["_id", "__v", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt",
    "deletedBy", "isDeleted", "credentialStatus"].forEach((key) => delete payload[key]);
  if (Object.keys(credentials).length) payload.credentials = credentials;
  else delete payload.credentials;
  return payload;
};

export default function AdminPaymentProvidersPage() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const paymentProvidersList = useSelector(selectPaymentProviders);
  const reduxPagination = useSelector(selectPaymentProviderPagination);
  const loading = useSelector(selectPaymentProviderListLoading);
  const detailsLoading = useSelector(selectPaymentProviderDetailsLoading);
  const saving = useSelector(selectPaymentProviderMutationLoading);
  const error = useSelector(selectPaymentProviderError);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const crud = useAdminEntityCrudState();
  const {
    showModal, showDetails, currentItem, formMode, formErrors, loadingSave,
    deleteModal, openCreate, openEdit, openClone, openDetails, openDelete,
    closeForm, closeDetails, closeDelete, setFormErrors, setLoadingSave,
  } = crud;

  const formConfig = useMemo(() => paymentProviderFormConfig({
    mode: formMode,
    credentialStatus: formMode === "edit" ? currentItem?.credentialStatus || {} : {},
  }), [formMode, currentItem?.credentialStatus]);
  const query = useMemo(() => buildQuery(filters, pagination), [filters, pagination]);
  const refresh = () => dispatch(fetchPaymentProviders(query));

  useEffect(() => { dispatch(fetchPaymentProviders(query)); }, [dispatch, query]);

  const loadDetails = async (provider) => {
    const response = await dispatch(fetchPaymentProviderById(provider._id)).unwrap();
    return response?.data || response || provider;
  };
  const reportError = (err, fallback) =>
    toast.error(handleApiError(err, (message) => message, lang) || fallback);

  const handleEdit = async (provider) => {
    try {
      const detailed = await loadDetails(provider);
      const config = paymentProviderFormConfig({ mode: "edit", credentialStatus: detailed.credentialStatus || {} });
      openEdit(prepareProviderForForm(detailed, config));
    } catch (err) { reportError(err, isArabic ? "تعذر جلب بيانات المزود" : "Failed to load provider"); }
  };
  const handleClone = async (provider) => {
    try {
      const detailed = await loadDetails(provider);
      const config = paymentProviderFormConfig({ mode: "clone", credentialStatus: {} });
      const prepared = prepareProviderForForm(detailed, config);
      openClone({
        ...prepared, _id: null, code: "", credentialStatus: {},
        credentials: { ...EMPTY_CREDENTIALS }, isActive: false,
        nameAr: `${detailed.nameAr || ""} (نسخة)`,
        nameEn: `${detailed.nameEn || detailed.nameAr || ""} (Copy)`,
      });
    } catch (err) { reportError(err, isArabic ? "تعذر تجهيز النسخة" : "Failed to prepare clone"); }
  };
  const handleDetails = async (provider) => {
    try { openDetails(await loadDetails(provider)); }
    catch (err) { reportError(err, isArabic ? "تعذر جلب التفاصيل" : "Failed to load details"); }
  };
  const handleSave = async (data) => {
    setLoadingSave(true); setFormErrors({});
    try {
      const payload = prepareProviderPayload(data, formConfig);
      if (formMode === "edit") {
        await dispatch(updatePaymentProvider({ providerId: currentItem._id, data: payload })).unwrap();
      } else {
        await dispatch(createPaymentProvider(payload)).unwrap();
      }
      toast.success(isArabic ? "تم حفظ مزود الدفع بنجاح" : "Payment provider saved successfully");
      closeForm(); await refresh().unwrap();
    } catch (err) {
      const errors = err?.errors || err?.data?.errors;
      if (errors && typeof errors === "object") setFormErrors(errors);
      reportError(err, isArabic ? "تعذر حفظ مزود الدفع" : "Failed to save provider");
    } finally { setLoadingSave(false); }
  };
  const handleStatus = async (provider) => {
    try {
      await dispatch(updatePaymentProviderStatus({ providerId: provider._id, isActive: !provider.isActive })).unwrap();
      toast.success(isArabic ? "تم تحديث حالة المزود" : "Provider status updated");
      await refresh().unwrap();
    } catch (err) { reportError(err, isArabic ? "تعذر تحديث الحالة" : "Failed to update status"); }
  };
  const confirmDelete = async () => {
    try {
      await dispatch(deletePaymentProvider(deleteModal.id)).unwrap();
      toast.success(isArabic ? "تم حذف مزود الدفع" : "Payment provider deleted");
      closeDelete(); await refresh().unwrap();
    } catch (err) { reportError(err, isArabic ? "تعذر حذف المزود" : "Failed to delete provider"); }
  };

  const nameOf = (row) => isArabic ? row.nameAr || row.nameEn : row.nameEn || row.nameAr;
  const environmentLabel = (value) => value === "LIVE" ? (isArabic ? "فعلي" : "Live") : (isArabic ? "تجريبي" : "Test");
  const credentialSummary = (row) => {
    const values = Object.values(row?.credentialStatus || {});
    if (!values.length) return isArabic ? "اعرض التفاصيل" : "View details";
    return values.every(Boolean) ? (isArabic ? "تم الإعداد" : "Configured") : `${values.filter(Boolean).length}/${values.length}`;
  };
  const columns = [
    { header: isArabic ? "المزود" : "Provider", render: (row) => <><strong>{nameOf(row)}</strong><div className="small text-muted">{row.code}</div></> },
    { header: isArabic ? "البيئة" : "Environment", align: "center", render: (row) => <StatusBadge value={environmentLabel(row.environment)} isArabic={isArabic} /> },
    { header: isArabic ? "طرق الدفع" : "Payment methods", render: (row) => (row.supportedPaymentMethods || []).join(", ") || "-" },
    { header: isArabic ? "بيانات الاتصال" : "Credentials", align: "center", render: (row) => <StatusBadge value={credentialSummary(row)} isArabic={isArabic} /> },
    { header: isArabic ? "الحالة" : "Status", align: "center", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} type="user" isArabic={isArabic} /> },
    { header: isArabic ? "الإجراءات" : "Actions", align: "center", render: (row) => <div className="d-flex justify-content-center gap-1">
      <ActionButton action="edit" onClick={() => handleEdit(row)} />
      <ActionButton action="clone" onClick={() => handleClone(row)} />
      <ActionButton action="view" onClick={() => handleDetails(row)} />
      <ActionButton action={row.isActive ? "deactivate" : "activate"} disabled={saving} onClick={() => handleStatus(row)} />
      <ActionButton action="delete" onClick={() => openDelete(row, nameOf(row))} />
    </div> },
  ];
  const credentialStatusText = Object.entries(currentItem?.credentialStatus || {})
    .map(([key, configured]) => `${key}: ${configured ? (isArabic ? "تم الإعداد" : "Configured") : (isArabic ? "غير معد" : "Not configured")}`).join(" — ") || "-";

  return <div className="container-fluid py-4">
    <PageHeader titleAr="إدارة مزودي الدفع" titleEn="Payment Providers Management" subtitleAr="إدارة تعريفات مزودي الدفع وبيئات التشغيل دون إظهار بيانات الاتصال السرية" subtitleEn="Manage payment provider definitions and environments without exposing credentials" actions={<AdminPageActions><ActionButton action="add" showLabel label={isArabic ? "إضافة مزود دفع" : "Add Payment Provider"} onClick={openCreate} /></AdminPageActions>} />
    <EntityFilter filters={filters} setFilters={(next) => { setFilters(next); setPagination((value) => ({ ...value, page: 1 })); }} config={{
      search: { type: "text", col: 4, placeholder: isArabic ? "البحث بالاسم أو الكود" : "Search name or code" },
      environment: { type: "select", col: 3, placeholder: isArabic ? "البيئة" : "Environment", options: [{ value: "TEST", labelAr: "تجريبي", labelEn: "Test" }, { value: "LIVE", labelAr: "فعلي", labelEn: "Live" }] },
      isActive: { type: "select", col: 3, placeholder: isArabic ? "الحالة" : "Status", options: [{ value: "true", labelAr: "مفعّل", labelEn: "Active" }, { value: "false", labelAr: "غير مفعّل", labelEn: "Inactive" }] },
    }} />
    <LoadingOverlay show={loading || detailsLoading} text={isArabic ? "جاري التحميل..." : "Loading..."} />
    <ErrorOverlay show={Boolean(error)} message={error?.message || error} />
    <UniversalTable columns={columns} data={paymentProvidersList} lang={lang} emptyMessage={isArabic ? "لا يوجد مزودو دفع" : "No payment providers found"} />
    <PaginationComponent total={reduxPagination.total || 0} page={reduxPagination.page || pagination.page} limit={reduxPagination.limit || pagination.limit} totalPages={reduxPagination.totalPages || 0} onPageChange={(page) => setPagination((value) => ({ ...value, page }))} onLimitChange={(limit) => setPagination({ page: 1, limit })} />
    <UniversalFormModal show={showModal} onHide={closeForm} onSave={handleSave} config={formConfig} initialData={currentItem} errors={formErrors} loading={loadingSave || saving} titleAr={formMode === "edit" ? "تعديل مزود الدفع" : formMode === "clone" ? "نسخ مزود الدفع" : "إضافة مزود دفع"} titleEn={formMode === "edit" ? "Edit Payment Provider" : formMode === "clone" ? "Clone Payment Provider" : "Add Payment Provider"} />
    <EntityDetailsModal show={showDetails} onHide={closeDetails} title={isArabic ? "تفاصيل مزود الدفع" : "Payment Provider Details"} entity={currentItem} fields={[
      { label: isArabic ? "المزود" : "Provider", value: nameOf(currentItem || {}) || "-" },
      { label: isArabic ? "الكود" : "Code", value: currentItem?.code || "-" },
      { label: isArabic ? "البيئة" : "Environment", value: environmentLabel(currentItem?.environment) },
      { label: isArabic ? "رابط الخدمة" : "Base URL", value: currentItem?.baseUrl || "-" },
      { label: isArabic ? "طرق الدفع" : "Payment methods", value: (currentItem?.supportedPaymentMethods || []).join(", ") || "-" },
      { label: isArabic ? "حالة بيانات الاتصال" : "Credentials status", value: credentialStatusText },
      { label: isArabic ? "الحالة" : "Status", value: currentItem?.isActive ? (isArabic ? "مفعّل" : "Active") : (isArabic ? "غير مفعّل" : "Inactive") },
    ]} />
    <ConfirmDialog show={deleteModal.show} onHide={closeDelete} onConfirm={confirmDelete} title={isArabic ? "حذف مزود الدفع؟" : "Delete Payment Provider?"} message={isArabic ? `هل أنت متأكد من حذف ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name}?`} confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"} cancelText={isArabic ? "إلغاء" : "Cancel"} variant="delete" />
  </div>;
}
