import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import PageHeader from "../../../Components/layout/PageHeader";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PaginationComponent from "../../../Components/common/Pagination";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import buildPaymentConfigurationFormConfig from "../../../Components/common/ModalForms/payments/paymentConfigurationFormConfig";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import { handleApiError } from "../../../Utils/handleApiError";
import { buildQuery } from "../../../Utils/buildQuery";

import {
  fetchPaymentConfigurations, createPaymentConfiguration, updatePaymentConfiguration,
  updatePaymentConfigurationStatus, deletePaymentConfiguration,
  selectPaymentConfigurations, selectPaymentConfigurationPagination,
  selectPaymentConfigurationLoading, selectPaymentConfigurationActionLoading,
  selectPaymentConfigurationError, selectPaymentConfigurationFieldErrors,
} from "../../../redux/payments/paymentConfigurationSlice";
import { fetchPaymentMethods } from "../../../redux/payments/paymentMethodSlice";
import { fetchPaymentProviders } from "../../../redux/payments/paymentProviderSlice";
import { fetchBankAccounts } from "../../../redux/payments/bankAccountSlice";
import { PAYMENT_SECTION_OPTIONS, isPaymentMethodAvailableForConfiguration } from "../../../constants/payments/paymentConfigurationConstants";

const PAGE_LIMIT = 10;
const EMPTY_FILTERS = { search: "", sectionCode: "", paymentMethodCode: "", configurationType: "", isActive: "" };
const getId = (item) => item?._id || item?.id || null;
const relationId = (value) => value?._id || value?.id || value || "";
const relationIds = (values) => Array.isArray(values) ? values.map(relationId).filter(Boolean) : [];
const dateForForm = (value) => value ? String(value).slice(0, 10) : "";
const prepareForForm = (item = {}) => ({
  ...item,
  providerId: relationId(item.providerId),
  bankAccountIds: relationIds(item.bankAccountIds),
  supportedCurrencies: Array.isArray(item.supportedCurrencies) ? item.supportedCurrencies : ["SAR"],
  availableFrom: dateForForm(item.availableFrom),
  availableUntil: dateForForm(item.availableUntil),
});
const prepareClone = (item) => {
  const prepared = prepareForForm(item);
  ["_id", "id", "createdAt", "updatedAt", "createdBy", "updatedBy"].forEach((key) => delete prepared[key]);
  return { ...prepared, isActive: false };
};
const preparePayload = (formData) => {
  const state = formData?.formState || formData || {};
  const payload = {
    ...state,
    providerId: relationId(state.providerId) || null,
    bankAccountIds: Array.isArray(state.bankAccountIds) ? state.bankAccountIds : [],
    supportedCurrencies: Array.isArray(state.supportedCurrencies) ? state.supportedCurrencies : [],
    minimumAmount: state.minimumAmount === "" || state.minimumAmount == null ? null : Number(state.minimumAmount),
    maximumAmount: state.maximumAmount === "" || state.maximumAmount == null ? null : Number(state.maximumAmount),
    sortOrder: Number(state.sortOrder) || 0,
    availableFrom: state.availableFrom || null,
    availableUntil: state.availableUntil || null,
    isActive: state.isActive !== false,
    requiresAttachment: Boolean(state.requiresAttachment),
    requiresReference: Boolean(state.requiresReference),
  };
  ["displayNameAr", "displayNameEn", "instructionsAr", "instructionsEn"].forEach((key) => {
    if (typeof payload[key] === "string" && !payload[key].trim()) delete payload[key];
  });
  return payload;
};

export default function AdminPaymentConfigurationsPage() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const configurations = useSelector(selectPaymentConfigurations);
  const pagination = useSelector(selectPaymentConfigurationPagination);
  const loading = useSelector(selectPaymentConfigurationLoading);
  const actionLoading = useSelector(selectPaymentConfigurationActionLoading);
  const error = useSelector(selectPaymentConfigurationError);
  const sliceFieldErrors = useSelector(selectPaymentConfigurationFieldErrors);
  const paymentMethods = useSelector((state) => state.paymentMethods?.paymentMethodsList || []);
  const paymentProviders = useSelector((state) => state.paymentProviders?.paymentProvidersList || []);
  const bankAccounts = useSelector((state) => state.bankAccounts?.bankAccountsList || []);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT);
  const crud = useAdminEntityCrudState();
  const {
    showModal, showDetails, currentItem, formMode, formErrors, loadingSave,
    deleteModal, openCreate, openEdit, openClone, openDetails, openDelete,
    closeForm, closeDetails, closeDelete, setFormErrors, setLoadingSave,
  } = crud;
  const query = useMemo(() => buildQuery(filters, { page: currentPage, limit: pageLimit }), [filters, currentPage, pageLimit]);
  const loadConfigurations = useCallback(() => dispatch(fetchPaymentConfigurations(query)), [dispatch, query]);
  const formConfig = useMemo(() => buildPaymentConfigurationFormConfig({ paymentMethods, paymentProviders, bankAccounts }), [paymentMethods, paymentProviders, bankAccounts]);
  const mergedErrors = useMemo(() => {
    const errors = { ...(sliceFieldErrors || {}), ...(formErrors || {}) };
    if (errors.configurationType && !errors.paymentMethodCode) errors.paymentMethodCode = errors.configurationType;
    return errors;
  }, [sliceFieldErrors, formErrors]);

  useEffect(() => { loadConfigurations(); }, [loadConfigurations]);
  useEffect(() => {
    dispatch(fetchPaymentMethods({ page: 1, limit: 100, isActive: true }));
    dispatch(fetchPaymentProviders({ page: 1, limit: 100, isActive: true }));
    dispatch(fetchBankAccounts({ page: 1, limit: 100, isActive: true }));
  }, [dispatch]);

  const reportError = (err, fallback) => toast.error(handleApiError(err, (message) => message, lang) || fallback);
  const handleSave = async (data) => {
    setLoadingSave(true); setFormErrors({});
    try {
      const payload = preparePayload(data);
      if (formMode === "edit") await dispatch(updatePaymentConfiguration({ configurationId: getId(currentItem), payload })).unwrap();
      else await dispatch(createPaymentConfiguration(payload)).unwrap();
      toast.success(isArabic ? "تم حفظ إعداد الدفع" : "Payment configuration saved");
      closeForm(); await loadConfigurations().unwrap();
    } catch (err) {
      const errors = err?.errors || err?.data?.errors;
      if (errors && typeof errors === "object") setFormErrors(errors);
      reportError(err, isArabic ? "تعذر حفظ إعداد الدفع" : "Failed to save payment configuration");
    } finally { setLoadingSave(false); }
  };
  const handleToggle = async (item) => {
    try {
      await dispatch(updatePaymentConfigurationStatus({ configurationId: getId(item), isActive: !item.isActive })).unwrap();
      toast.success(isArabic ? "تم تحديث حالة الإعداد" : "Configuration status updated");
      await loadConfigurations().unwrap();
    } catch (err) { reportError(err, isArabic ? "تعذر تحديث الحالة" : "Failed to update status"); }
  };
  const confirmDelete = async () => {
    try {
      await dispatch(deletePaymentConfiguration(deleteModal.id)).unwrap();
      toast.success(isArabic ? "تم حذف إعداد الدفع" : "Payment configuration deleted");
      closeDelete(); await loadConfigurations().unwrap();
    } catch (err) { reportError(err, isArabic ? "تعذر حذف الإعداد" : "Failed to delete configuration"); }
  };
  const sectionLabel = (code) => {
    const option = PAYMENT_SECTION_OPTIONS.find((item) => item.value === code);
    return option ? (isArabic ? option.labelAr : option.labelEn) : code || "—";
  };
  const methodLabel = (item) => {
    const method = item.paymentMethod || paymentMethods.find((value) => value.code === item.paymentMethodCode);
    return isArabic ? method?.nameAr || method?.nameEn || item.paymentMethodCode : method?.nameEn || method?.nameAr || item.paymentMethodCode;
  };
  const typeLabel = (type) => ({ PROVIDER: isArabic ? "مزود دفع" : "Provider", BANK_ACCOUNT: isArabic ? "حساب بنكي" : "Bank account", MANUAL: isArabic ? "يدوي" : "Manual" }[type] || type || "—");
  const providerLabel = (item) => {
    const provider = typeof item.providerId === "object" ? item.providerId : paymentProviders.find((value) => String(value._id) === String(item.providerId));
    return provider ? (isArabic ? provider.nameAr || provider.nameEn || provider.code : provider.nameEn || provider.nameAr || provider.code) : "—";
  };
  const columns = [
    { header: "#", align: "center", render: (_row, index) => (currentPage - 1) * pageLimit + index + 1 },
    { header: isArabic ? "القسم" : "Section", render: (row) => <><strong>{sectionLabel(row.sectionCode)}</strong><div className="small text-muted">{row.sectionCode}</div></> },
    { header: isArabic ? "طريقة الدفع" : "Payment method", render: (row) => <><strong>{methodLabel(row)}</strong><div className="small text-muted">{row.paymentMethodCode}</div></> },
    { header: isArabic ? "نوع الإعداد" : "Type", align: "center", render: (row) => <StatusBadge value={typeLabel(row.configurationType)} isArabic={isArabic} /> },
    { header: isArabic ? "المزود" : "Provider", render: providerLabel },
    { header: isArabic ? "العملات" : "Currencies", render: (row) => (row.supportedCurrencies || []).join(", ") || "—" },
    { header: isArabic ? "الحالة" : "Status", align: "center", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} type="user" isArabic={isArabic} /> },
    { header: isArabic ? "الإجراءات" : "Actions", align: "center", render: (row) => <div className="d-flex justify-content-center gap-1">
      <ActionButton action="edit" onClick={() => openEdit(prepareForForm(row))} />
      <ActionButton action="clone" onClick={() => openClone(prepareClone(row))} />
      <ActionButton action="view" onClick={() => openDetails(row)} />
      <ActionButton action={row.isActive ? "deactivate" : "activate"} disabled={actionLoading} onClick={() => handleToggle(row)} />
      <ActionButton action="delete" onClick={() => openDelete(row, methodLabel(row))} />
    </div> },
  ];
  const filterConfig = {
    search: { type: "text", col: 4, placeholder: isArabic ? "البحث بالاسم أو الطريقة" : "Search name or method" },
    sectionCode: { type: "select", col: 2, placeholder: isArabic ? "القسم" : "Section", options: PAYMENT_SECTION_OPTIONS },
    paymentMethodCode: { type: "select", col: 2, placeholder: isArabic ? "طريقة الدفع" : "Payment method", options: paymentMethods.filter(isPaymentMethodAvailableForConfiguration).map((method) => ({ value: method.code, labelAr: method.nameAr || method.nameEn || method.code, labelEn: method.nameEn || method.nameAr || method.code })) },
    configurationType: { type: "select", col: 2, placeholder: isArabic ? "نوع الإعداد" : "Type", options: [{ value: "PROVIDER", labelAr: "مزود دفع", labelEn: "Provider" }, { value: "BANK_ACCOUNT", labelAr: "حساب بنكي", labelEn: "Bank Account" }, { value: "MANUAL", labelAr: "يدوي", labelEn: "Manual" }] },
    isActive: { type: "select", col: 2, placeholder: isArabic ? "الحالة" : "Status", options: [{ value: "true", labelAr: "مفعّل", labelEn: "Active" }, { value: "false", labelAr: "غير مفعّل", labelEn: "Inactive" }] },
  };

  return <div className="container-fluid py-4">
    <PageHeader titleAr="إعدادات الدفع" titleEn="Payment Configurations" subtitleAr="ربط طرق الدفع بالأقسام والمزودين والحسابات البنكية" subtitleEn="Assign payment methods to sections, providers, and bank accounts" actions={<AdminPageActions><ActionButton action="add" showLabel label={isArabic ? "إضافة إعداد دفع" : "Add Configuration"} onClick={openCreate} /></AdminPageActions>} />
    <EntityFilter filters={filters} setFilters={(next) => { setFilters(next); setCurrentPage(1); }} config={filterConfig} />
    <LoadingOverlay show={loading} text={isArabic ? "جارٍ تحميل إعدادات الدفع..." : "Loading payment configurations..."} />
    <ErrorOverlay show={Boolean(error)} message={error?.message || error} />
    <UniversalTable columns={columns} data={configurations} lang={lang} emptyMessage={isArabic ? "لا توجد إعدادات دفع" : "No payment configurations found"} />
    <PaginationComponent total={pagination.total || 0} page={pagination.page || currentPage} limit={pagination.limit || pageLimit} totalPages={pagination.totalPages || 0} onPageChange={setCurrentPage} onLimitChange={(limit) => { setPageLimit(limit); setCurrentPage(1); }} />
    <UniversalFormModal show={showModal} onHide={closeForm} onSave={handleSave} config={formConfig} initialData={currentItem || {}} errors={mergedErrors} loading={loadingSave || actionLoading} titleAr={formMode === "edit" ? "تعديل إعداد الدفع" : formMode === "clone" ? "نسخ إعداد الدفع" : "إضافة إعداد دفع"} titleEn={formMode === "edit" ? "Edit Payment Configuration" : formMode === "clone" ? "Clone Payment Configuration" : "Create Payment Configuration"} />
    <EntityDetailsModal show={showDetails} onHide={closeDetails} title={isArabic ? "تفاصيل إعداد الدفع" : "Payment Configuration Details"} entity={currentItem} fields={[
      { label: isArabic ? "القسم" : "Section", value: sectionLabel(currentItem?.sectionCode) },
      { label: isArabic ? "طريقة الدفع" : "Payment method", value: currentItem ? methodLabel(currentItem) : "—" },
      { label: isArabic ? "نوع الإعداد" : "Type", value: typeLabel(currentItem?.configurationType) },
      { label: isArabic ? "مزود الدفع" : "Provider", value: currentItem ? providerLabel(currentItem) : "—" },
      { label: isArabic ? "العملات" : "Currencies", value: (currentItem?.supportedCurrencies || []).join(", ") || "—" },
      { label: isArabic ? "الحالة" : "Status", value: currentItem?.isActive ? (isArabic ? "مفعّل" : "Active") : (isArabic ? "غير مفعّل" : "Inactive") },
    ]} />
    <ConfirmDialog show={deleteModal.show} onHide={closeDelete} onConfirm={confirmDelete} loading={actionLoading} title={isArabic ? "حذف إعداد الدفع" : "Delete Payment Configuration"} message={isArabic ? `هل أنت متأكد من حذف ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name}?`} confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"} cancelText={isArabic ? "إلغاء" : "Cancel"} variant="delete" />
  </div>;
}
