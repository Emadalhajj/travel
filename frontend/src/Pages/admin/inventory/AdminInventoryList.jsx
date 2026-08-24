import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import {
  upsertInventoryPeriod,
  updateInventory,
  deleteInventory,
  setPage,
  setLimit,
  fetchInventoryPeriods,
} from "../../../redux/inventory/inventorySlice";
import { fetchRoomTypes } from "../../../redux/hotels/roomtypeSlice";
import { fetchTrips } from "../../../redux/transports/tripSlice";
import { fetchTransports } from "../../../redux/transports/transportSlice";
import { fetchVehicleRentals } from "../../../redux/transports/vehicleRentalSlice";
import { fetchExtraServices } from "../../../redux/extraServices/extraServiceSlice";
import { fetchVisas } from "../../../redux/visas/visaSlice";
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
  const {
    inventoryList = [], loading, error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.inventory || {});
  const { roomTypesList = [] } = useSelector((state) => state.roomTypes || {});
  const { tripList = [] } = useSelector((state) => state.trip || {});
  const { transportList = [] } = useSelector((state) => state.transport || {});
  const { list: visasList = [] } = useSelector((state) => state.visas || {});
  const { vehicleRentalsList = [] } = useSelector((state) => state.vehicleRentals || {});
  const { extraServicesList = [] } = useSelector((state) => state.extraServices || {});
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const crud = useAdminEntityCrudState();
  const {
    showModal, currentItem, formMode, formErrors, loadingSave, deleteModal,
    openCreate, openEdit, openDelete, closeForm, closeDelete,
    resetForm, setFormErrors, setLoadingSave,
  } = crud;
  const formConfig = useMemo(() => inventoryFormConfig({
    roomTypes: roomTypesList,
    trips: tripList,
    transports: transportList,
    vehicleRentals: vehicleRentalsList,
    extraServices: extraServicesList,
    visas: visasList,
  }), [roomTypesList, tripList, transportList, vehicleRentalsList, extraServicesList, visasList]);
  const query = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const refreshInventory = () => fetchInventoryPeriods(query);

  useEffect(() => {
    dispatch(fetchRoomTypes({ page: 1, limit: 1000 }));
    dispatch(fetchTrips({ page: 1, limit: 1000 }));
    dispatch(fetchTransports({ page: 1, limit: 1000 }));
    dispatch(fetchVehicleRentals({ page: 1, limit: 1000 }));
    dispatch(fetchExtraServices({ page: 1, limit: 1000 }));
    dispatch(fetchVisas({ page: 1, limit: 1000 }));
  }, [dispatch]);
  useEffect(() => { dispatch(fetchInventoryPeriods(query)); }, [dispatch, query]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: upsertInventoryPeriod,
    updateAction: updateInventory,
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
      <ActionButton action="edit" onClick={() => openEdit(prepareInventoryForForm(row, formConfig))} />
      <ActionButton action="delete" onClick={() => openDelete(row, productLabel(row))} />
    </div> },
  ];

  return <div className="container-fluid py-4">
    <PageHeader titleAr="إدارة المخزون" titleEn="Inventory Management" subtitleAr="إدارة فترات مخزون المنتجات والخدمات مع إبقاء المحجوز والمتاح قيمًا مشتقة" subtitleEn="Manage product and service inventory periods while keeping reserved and available quantities derived" actions={<AdminPageActions><ActionButton action="add" showLabel label={isArabic ? "إضافة مخزون لفترة" : "Add Inventory Period"} onClick={openCreate} /></AdminPageActions>} />
    <EntityFilter filters={filters} setFilters={(next) => { setFilters(next); dispatch(setPage(1)); }} config={{
      inventoryType: { type: "select", col: 3, placeholder: isArabic ? "نوع المخزون" : "Inventory Type", options: INVENTORY_TYPE_OPTIONS },
      startDate: { type: "date", col: 3, placeholder: isArabic ? "من تاريخ" : "From Date" },
      endDate: { type: "date", col: 3, placeholder: isArabic ? "إلى تاريخ" : "To Date" },
    }} />
    <LoadingOverlay show={loading} text={isArabic ? "جارٍ تحميل المخزون..." : "Loading inventory..."} />
    <ErrorOverlay show={Boolean(error)} message={error?.message || error} />
    <UniversalTable columns={columns} data={inventoryList} lang={lang} emptyMessage={isArabic ? "لا يوجد مخزون" : "No inventory found"} />
    <PaginationComponent total={pagination.total} page={pagination.page} limit={pagination.limit} totalPages={pagination.totalPages} onPageChange={(page) => dispatch(setPage(page))} onLimitChange={(limit) => dispatch(setLimit(limit))} />
    <UniversalFormModal show={showModal} onHide={closeForm} onSave={(data) => handleSave(data, { formMode, currentItem })} config={formConfig} initialData={currentItem || INITIAL_INVENTORY} titleAr={formMode === "edit" ? "تعديل المخزون" : "إضافة مخزون لفترة"} titleEn={formMode === "edit" ? "Edit Inventory" : "Add Inventory Period"} errors={formErrors} loading={loadingSave} />
    <ConfirmDialog show={deleteModal.show} onHide={closeDelete} onConfirm={confirmDelete} title={isArabic ? "حذف المخزون؟" : "Delete Inventory?"} message={isArabic ? `هل أنت متأكد من حذف مخزون ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name} inventory?`} confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"} cancelText={isArabic ? "إلغاء" : "Cancel"} variant="delete" />
  </div>;
}
