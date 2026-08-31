import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import {
  upsertInventoryPeriod,
  deleteInventory,
  setPage,
  setLimit,
  fetchInventoryPeriods,
  selectInventoryItems,
  selectInventoryPagination,
  selectInventoryListLoading,
  selectInventoryError,
} from "../../../redux/inventory/inventorySlice";
import { inventoryFormConfig } from "../../../Components/common/ModalForms/inventory/inventoryFormConfig";
import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatDate } from "../../../Utils/dateUtils";
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
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import useAdminLookups from "../../../hooks/admin/useAdminLookups";

const INITIAL_INVENTORY = {
  inventoryType: "roomType",
  itemId: "",
  startDate: "",
  endDate: "",
  total: 1,
  blocked: 0,
  notes: "",
  isActive: true,
};
const INITIAL_FILTERS = { inventoryType: "", startDate: "", endDate: "" };
const INVENTORY_TYPE_OPTIONS = [
  { value: "roomType", labelAr: "نوع غرفة", labelEn: "Room Type" },
  { value: "trip", labelAr: "رحلة", labelEn: "Trip" },
  { value: "transport", labelAr: "وسيلة نقل", labelEn: "Transport" },
  { value: "vehicleRental", labelAr: "تأجير نقل", labelEn: "Vehicle Rental" },
  { value: "extraService", labelAr: "خدمة إضافية", labelEn: "Extra Service" },
  { value: "visa", labelAr: "تأشيرة", labelEn: "Visa" },
];
const prepareInventoryForForm = (item, formConfig) => ({
  ...normalizeForForm(item, formConfig),
  itemId: item?.itemId?._id || item?.itemId?.id || item?.itemId || "",
});

export default function AdminInventoryList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const inventoryList = useSelector(selectInventoryItems);
  const pagination = useSelector(selectInventoryPagination);
  const loading = useSelector(selectInventoryListLoading);
  const error = useSelector(selectInventoryError);
  const { lookups, loadLookup } = useAdminLookups();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const crud = useAdminEntityCrudState();
  const {
    showModal, currentItem, formMode, formErrors, loadingSave, deleteModal,
    openCreate, openEdit, openDelete, closeForm, closeDelete,
    resetForm, setFormErrors, setLoadingSave,
  } = crud;
  const formConfig = useMemo(() => inventoryFormConfig({
    roomTypes: lookups.roomType || [],
    trips: lookups.trip || [],
    transports: lookups.transport || [],
    vehicleRentals: lookups.vehicleRental || [],
    extraServices: lookups.extraService || [],
    visas: lookups.visa || [],
  }), [lookups]);
  const query = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const refreshInventory = () => fetchInventoryPeriods(query);

  useEffect(() => { dispatch(fetchInventoryPeriods(query)); }, [dispatch, query]);

  const openCreateWithLookup = async () => {
    await loadLookup(INITIAL_INVENTORY.inventoryType);
    openCreate(INITIAL_INVENTORY);
  };
  const openEditWithLookup = async (row) => {
    await loadLookup(row.inventoryType);
    openEdit(prepareInventoryForForm(row, formConfig));
  };
  const handleInventoryFormChange = useCallback((state) => {
    if (state?.inventoryType) loadLookup(state.inventoryType);
  }, [loadLookup]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: upsertInventoryPeriod,
    updateAction: ({ data }) => upsertInventoryPeriod(data),
    fetchAction: refreshInventory,
    getId: (item) => item._id,
    formConfig,
    toast,
    lang,
    closeModal: closeForm,
    resetItem: resetForm,
    setLoading: setLoadingSave,
    setFormErrors,
    useFormData: false,
    onError: (err) => toast.error(handleApiError(err, (message) => message, lang)),
  });
  const confirmDelete = async () => {
    try {
      await dispatch(deleteInventory(deleteModal.id)).unwrap();
      toast.success(isArabic ? "تم حذف المخزون" : "Inventory deleted");
      closeDelete();
      await dispatch(fetchInventoryPeriods(query)).unwrap();
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    }
  };
  const typeLabel = (type) => {
    const option = INVENTORY_TYPE_OPTIONS.find((item) => item.value === type);
    return option ? (isArabic ? option.labelAr : option.labelEn) : type || "-";
  };
  const productLabel = (row) => {
    const item = row.itemId;
    if (!item) return "-";
    if (typeof item !== "object") return item;
    return (isArabic ? item.nameAr || item.titleAr || item.nameEn || item.titleEn : item.nameEn || item.titleEn || item.nameAr || item.titleAr) || item._id || "-";
  };
  const columns = [
    { header: isArabic ? "النوع" : "Type", render: (row) => typeLabel(row.inventoryType) },
    { header: isArabic ? "المنتج" : "Product", render: productLabel },
    { header: isArabic ? "الفترة" : "Period", render: (row) => `${formatDate(row.startDate, { isArabic })} - ${formatDate(row.endDate, { isArabic })}` },
    { header: isArabic ? "عدد الأيام" : "Days", align: "center", render: (row) => row.daysCount ?? 0 },
    { header: isArabic ? "الإجمالي" : "Total", align: "center", render: (row) => row.total ?? 0 },
    { header: isArabic ? "المحجوز" : "Reserved", align: "center", render: (row) => row.reserved ?? 0 },
    { header: isArabic ? "الموقوف" : "Blocked", align: "center", render: (row) => row.blocked ?? 0 },
    { header: isArabic ? "المتاح" : "Available", align: "center", render: (row) => <span className={(row.available ?? 0) > 0 ? "fw-semibold text-success" : "fw-semibold text-danger"}>{row.available ?? 0}</span> },
    { header: isArabic ? "الحالة" : "Status", align: "center", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} type="user" isArabic={isArabic} /> },
    { header: isArabic ? "الإجراءات" : "Actions", align: "center", render: (row) => <div className="d-flex gap-1 justify-content-center">
      <ActionButton action="edit" onClick={() => openEditWithLookup(row)} />
      <ActionButton action="delete" onClick={() => openDelete(row, productLabel(row))} />
    </div> },
  ];

  return <div className="container-fluid py-4">
    <PageHeader titleAr="إدارة المخزون" titleEn="Inventory Management" subtitleAr="إدارة فترات مخزون المنتجات والخدمات مع إبقاء المحجوز والمتاح قيمًا مشتقة" subtitleEn="Manage product and service inventory periods while keeping reserved and available quantities derived" actions={<AdminPageActions><ActionButton action="add" showLabel label={isArabic ? "إضافة مخزون لفترة" : "Add Inventory Period"} onClick={openCreateWithLookup} /></AdminPageActions>} />
    <EntityFilter filters={filters} setFilters={(next) => { setFilters(next); dispatch(setPage(1)); }} config={{
      inventoryType: { type: "select", col: 3, placeholder: isArabic ? "نوع المخزون" : "Inventory Type", options: INVENTORY_TYPE_OPTIONS },
      startDate: { type: "date", col: 3, placeholder: isArabic ? "من تاريخ" : "From Date" },
      endDate: { type: "date", col: 3, placeholder: isArabic ? "إلى تاريخ" : "To Date" },
    }} />
    <LoadingOverlay show={loading} text={isArabic ? "جارٍ تحميل المخزون..." : "Loading inventory..."} />
    <ErrorOverlay show={Boolean(error)} message={error?.message || error} />
    <UniversalTable columns={columns} data={inventoryList} lang={lang} emptyMessage={isArabic ? "لا يوجد مخزون" : "No inventory found"} />
    <PaginationComponent total={pagination.total} page={pagination.page} limit={pagination.limit} totalPages={pagination.totalPages} onPageChange={(page) => dispatch(setPage(page))} onLimitChange={(limit) => dispatch(setLimit(limit))} />
    <UniversalFormModal show={showModal} onHide={closeForm} onSave={(data) => handleSave(data, { formMode, currentItem })} config={formConfig} initialData={currentItem || INITIAL_INVENTORY} titleAr={formMode === "edit" ? "تعديل المخزون" : "إضافة مخزون لفترة"} titleEn={formMode === "edit" ? "Edit Inventory" : "Add Inventory Period"} errors={formErrors} loading={loadingSave} onFormStateChange={handleInventoryFormChange} />
    <ConfirmDialog show={deleteModal.show} onHide={closeDelete} onConfirm={confirmDelete} title={isArabic ? "حذف المخزون؟" : "Delete Inventory?"} message={isArabic ? `هل أنت متأكد من حذف مخزون ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name} inventory?`} confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"} cancelText={isArabic ? "إلغاء" : "Cancel"} variant="delete" />
  </div>;
}
