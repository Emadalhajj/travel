import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createBankAccount,
  deleteBankAccount,
  fetchBankAccounts,
  setLimit,
  setPage,
  updateBankAccount,
  updateBankAccountStatus,
} from "../../../redux/payments/bankAccountSlice";
import { bankAccountFormConfig } from "../../../Components/common/ModalForms/payments/bankAccountFormConfig";
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

const emptyPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

export default function AdminBankAccountsPage() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const {
    bankAccountsList = [],
    loading,
    error,
    pagination = emptyPagination,
  } = useSelector((state) => state.bankAccounts || {});
  const [filters, setFilters] = useState({
    search: "",
    currency: "",
    isActive: "",
    isPublic: "",
  });

  const formConfig = useMemo(() => bankAccountFormConfig(), []);
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const {
    showModal,
    showDetails,
    currentItem: currentAccount,
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
    prepareForForm: (account) => normalizeForForm(account, formConfig),
    prepareClone: (account, normalized) => ({
      ...normalized,
      _id: null,
      bankNameAr: `${account.bankNameAr || ""} (نسخة)`,
      bankNameEn: `${account.bankNameEn || account.bankNameAr || ""} (Copy)`,
      iban: "",
      accountNumber: "",
      isDefault: false,
    }),
  });

  useEffect(() => {
    dispatch(fetchBankAccounts(listQuery));
  }, [dispatch, listQuery]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: createBankAccount,
    updateAction: updateBankAccount,
    fetchAction: () => fetchBankAccounts(listQuery),
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

  const confirmDelete = async () => {
    try {
      await dispatch(deleteBankAccount(deleteModal.id)).unwrap();
      toast.success(isArabic ? "تم حذف الحساب البنكي" : "Bank account deleted");
      dispatch(fetchBankAccounts(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const handleStatusChange = async (account, field, value) => {
    try {
      await dispatch(
        updateBankAccountStatus({ id: account._id, data: { [field]: value } }),
      ).unwrap();
      toast.success(isArabic ? "تم تحديث الحالة" : "Status updated");
      dispatch(fetchBankAccounts(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    }
  };

  const accountName = (account) =>
    (isArabic ? account.bankNameAr : account.bankNameEn || account.bankNameAr) || "-";
  const holderName = (account) =>
    (isArabic ? account.accountNameAr : account.accountNameEn || account.accountNameAr) || "-";

  const columns = [
    {
      header: isArabic ? "البنك" : "Bank",
      render: (row) => <div><strong>{accountName(row)}</strong><div className="small text-muted">{holderName(row)}</div></div>,
      excelValue: accountName,
    },
    { header: isArabic ? "الآيبان" : "IBAN", render: (row) => <span dir="ltr" className="font-monospace">{row.iban || "-"}</span>, excelValue: (row) => row.iban || "" },
    { header: isArabic ? "العملة" : "Currency", accessor: "currency" },
    {
      header: isArabic ? "الحالة" : "Status",
      render: (row) => (
        <div className="d-flex flex-wrap justify-content-center gap-1">
          <StatusBadge value={row.isActive ? "active" : "inactive"} type="user" isArabic={isArabic} />
          <StatusBadge value={row.isPublic ? (isArabic ? "ظاهر للعملاء" : "Public") : (isArabic ? "مخفي" : "Hidden")} isArabic={isArabic} />
          {row.isDefault ? <StatusBadge value={isArabic ? "افتراضي" : "Default"} isArabic={isArabic} /> : null}
        </div>
      ),
    },
    {
      header: isArabic ? "الإجراءات" : "Actions",
      align: "center",
      exportable: false,
      render: (row) => (
        <div className="d-flex flex-wrap justify-content-center gap-1">
          <ActionButton action="edit" onClick={() => openEdit(row)} />
          <ActionButton action="clone" onClick={() => openClone(row)} />
          <ActionButton action="view" onClick={() => openDetails(row)} />
          <ActionButton action={row.isActive ? "deactivate" : "activate"} onClick={() => handleStatusChange(row, "isActive", !row.isActive)} />
          <ActionButton action={row.isPublic ? "hide" : "show"} onClick={() => handleStatusChange(row, "isPublic", !row.isPublic)} />
          {!row.isDefault ? <ActionButton action="default" onClick={() => handleStatusChange(row, "isDefault", true)} /> : null}
          <ActionButton action="delete" onClick={() => openDelete(row, accountName(row))} />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-3">
      <PageHeader titleAr="إدارة الحسابات البنكية" titleEn="Bank Accounts Management" subtitleAr="إدارة الحسابات البنكية الخاصة بطرق الدفع" subtitleEn="Manage payment bank accounts" actions={<AdminPageActions><ActionButton action="add" size="md" label={isArabic ? "إضافة حساب بنكي" : "Add Bank Account"} onClick={openCreate} /><ExportTableButtons data={bankAccountsList} columns={columns} fileName="bank-accounts" lang={lang} title={isArabic ? "الحسابات البنكية" : "Bank Accounts"} /></AdminPageActions>} />
      <EntityFilter filters={filters} setFilters={setFilters} config={{
        search: { type: "text", col: 3, placeholder: isArabic ? "بحث بالبنك أو الآيبان" : "Search bank or IBAN" },
        currency: { type: "select", col: 3, options: [
          { value: "SAR", labelAr: "ريال سعودي", labelEn: "SAR" },
          { value: "USD", labelAr: "دولار أمريكي", labelEn: "USD" },
          { value: "EUR", labelAr: "يورو", labelEn: "EUR" },
          { value: "GBP", labelAr: "جنيه إسترليني", labelEn: "GBP" },
          { value: "AED", labelAr: "درهم إماراتي", labelEn: "AED" },
        ] },
        isActive: { type: "select", col: 3, options: [
          { value: "true", labelAr: "مفعل", labelEn: "Active" },
          { value: "false", labelAr: "غير مفعل", labelEn: "Inactive" },
        ] },
        isPublic: { type: "select", col: 3, options: [
          { value: "true", labelAr: "ظاهر للعملاء", labelEn: "Public" },
          { value: "false", labelAr: "مخفي", labelEn: "Hidden" },
        ] },
      }} />
      <LoadingOverlay show={loading} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <UniversalTable columns={columns} data={bankAccountsList} lang={lang} emptyMessage={isArabic ? "لا توجد حسابات بنكية" : "No bank accounts found"} />
      <PaginationComponent total={pagination.total} page={pagination.page} limit={pagination.limit} totalPages={pagination.totalPages} onPageChange={(page) => dispatch(setPage(page))} onLimitChange={(limit) => dispatch(setLimit(limit))} />
      <UniversalFormModal show={showModal} onHide={closeForm} onSave={(data) => handleSave(data, { formMode, currentItem: currentAccount })} config={formConfig} initialData={currentAccount} titleAr={formMode === "edit" ? "تعديل الحساب البنكي" : "إضافة حساب بنكي"} titleEn={formMode === "edit" ? "Edit Bank Account" : "Add Bank Account"} errors={formErrors} loading={loadingSave} />
      <EntityDetailsModal show={showDetails} onHide={closeDetails} title={isArabic ? "تفاصيل الحساب البنكي" : "Bank Account Details"} entity={currentAccount} fields={[
        { label: isArabic ? "اسم البنك" : "Bank Name", value: currentAccount ? accountName(currentAccount) : "-" },
        { label: isArabic ? "اسم الحساب" : "Account Name", value: currentAccount ? holderName(currentAccount) : "-" },
        { label: isArabic ? "اسم المستفيد" : "Beneficiary", value: currentAccount?.beneficiaryName || "-" },
        { label: isArabic ? "رقم الحساب" : "Account Number", value: currentAccount?.accountNumber || "-" },
        { label: isArabic ? "الآيبان" : "IBAN", value: currentAccount?.iban || "-" },
        { label: "SWIFT / BIC", value: currentAccount?.swiftCode || "-" },
        { label: isArabic ? "العملة" : "Currency", value: currentAccount?.currency || "SAR" },
        { label: isArabic ? "الحالة" : "Status", value: currentAccount?.isActive ? (isArabic ? "مفعل" : "Active") : (isArabic ? "غير مفعل" : "Inactive") },
      ]} />
      <ConfirmDialog show={deleteModal.show} onHide={closeDelete} onConfirm={confirmDelete} title={isArabic ? "تأكيد الحذف" : "Confirm Delete"} message={isArabic ? `هل أنت متأكد من حذف ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name}?`} confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"} cancelText={isArabic ? "إلغاء" : "Cancel"} variant="danger" />
    </div>
  );
}
