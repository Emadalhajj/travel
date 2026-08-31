import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createNewTrip,
  deleteTrip,
  fetchTrips,
  setLimit,
  setPage,
  updateExistingTrip,
  selectTripItems,
  selectTripPagination,
  selectTripListLoading,
  selectTripError,
} from "../../../redux/transports/tripSlice";
import { buildQuery } from "../../../Utils/buildQuery";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatPrice } from "../../../Utils/roundPrice";
import { tripFormConfig } from "../../../Components/common/ModalForms/transport/tripFormConfig";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import TruncatedText from "../../../Components/common/TruncatedText";
import PaginationComponent from "../../../Components/common/Pagination";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import useAdminLookups from "../../../hooks/admin/useAdminLookups";

const EMPTY_LOOKUP = [];

export default function TransportTrips() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const tripList = useSelector(selectTripItems);
  const pagination = useSelector(selectTripPagination);
  const loading = useSelector(selectTripListLoading);
  const error = useSelector(selectTripError);
  const { lookups, loadLookup } = useAdminLookups();
  const transportList = lookups.transport || EMPTY_LOOKUP;

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    fromCity: "",
    toCity: "",
    isActive: "",
  });

  const formConfig = useMemo(
    () => tripFormConfig(transportList),
    [transportList],
  );
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );

  useEffect(() => {
    dispatch(fetchTrips(listQuery));
  }, [dispatch, listQuery]);

  const prepareTripForForm = (trip) => ({
    ...normalizeForForm(trip, formConfig),
    vehicleType:
      typeof trip.vehicleType === "object"
        ? trip.vehicleType?._id || ""
        : trip.vehicleType || "",
  });
  const {
    showModal,
    showDetails,
    currentItem: currentTrip,
    formMode,
    formErrors,
    loadingSave,
    deleteModal,
    openCreate: openCreateBase,
    openEdit: openEditBase,
    openClone: openCloneBase,
    openDetails,
    openDelete,
    closeForm,
    closeDetails,
    closeDelete,
    resetForm,
    setFormErrors,
    setLoadingSave,
  } = useAdminEntityCrudState({
    prepareForForm: prepareTripForForm,
    prepareClone: (trip, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${trip.nameAr} (نسخة)`,
      nameEn: `${trip.nameEn} (Copy)`,
    }),
  });

  const openCreateModal = async () => {
    await loadLookup("transport");
    openCreateBase();
  };
  const openEditModal = async (item) => {
    await loadLookup("transport");
    openEditBase(item);
  };
  const openCloneModal = async (item) => {
    await loadLookup("transport");
    openCloneBase(item);
  };

  const handleSave = createHandleSave({
    dispatch,
    createAction: createNewTrip,
    updateAction: updateExistingTrip,
    fetchAction: () => fetchTrips(listQuery),
    getId: (item) => item._id,
    formConfig,
    toast,
    lang,
    closeModal: closeForm,
    resetItem: resetForm,
    setLoading: setLoadingSave,
    setFormErrors,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteTrip(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchTrips(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const tripTypeLabel = (value) => {
    const field = formConfig.commonFields.find((item) => item.name === "tripType");
    const option = field?.options?.find((item) => item.value === value);
    return (lang === "ar" ? option?.labelAr : option?.labelEn) || value || "-";
  };

  const columns = [
    {
      header: lang === "ar" ? "الرقم" : "No",
      align: "center",
      exportable: false,
      render: (_, index) => index + 1,
    },
    {
      header: lang === "ar" ? "الصور" : "Images",
      align: "center",
      exportImageAccessor: "images",
      pdfWidth: 52,
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    {
      header: lang === "ar" ? "الاسم" : "Name",
      render: (row) => (lang === "ar" ? row.nameAr : row.nameEn) || "-",
      excelValue: (row) => (lang === "ar" ? row.nameAr : row.nameEn) || "",
    },
    {
      header: lang === "ar" ? "الوصف" : "Description",
      render: (row) => (
        <TruncatedText
          text={lang === "ar" ? row.descriptionAr : row.descriptionEn}
          limit={8}
        />
      ),
      excelValue: (row) =>
        (lang === "ar" ? row.descriptionAr : row.descriptionEn) || "",
    },
    {
      header: lang === "ar" ? "نوع الرحلة" : "Trip Type",
      render: (row) => tripTypeLabel(row.tripType),
    },
    {
      header: lang === "ar" ? "المسار" : "Route",
      render: (row) => [row.fromCity, row.toCity].filter(Boolean).join(" → ") || "-",
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      render: (row) =>
        formatPrice(row.pricing?.basePrice, row.pricing?.currency || "SAR"),
      excelValue: (row) => row.pricing?.basePrice ?? 0,
      excelType: "number",
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <StatusBadge
          value={row.isActive ? "active" : "inactive"}
          type="user"
          isArabic={lang === "ar"}
        />
      ),
    },
    {
      header: lang === "ar" ? "الإجراءات" : "Actions",
      align: "center",
      exportable: false,
      render: (row) => (
        <div className="d-flex justify-content-center gap-1">
          <ActionButton action="edit" onClick={() => openEditModal(row)} />
          <ActionButton action="clone" onClick={() => openCloneModal(row)} />
          <ActionButton
            action="view"
            onClick={() => {
              openDetails(row);
            }}
          />
          <ActionButton
            action="delete"
            onClick={() =>
              openDelete(row, lang === "ar" ? row.nameAr : row.nameEn)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-3">
      <PageHeader
        titleAr="إدارة الرحلات"
        titleEn="Trips Management"
        subtitleAr="إضافة وتعديل وحذف الرحلات"
        subtitleEn="Create, edit, and delete trips"
        actions={
          <AdminPageActions>
          <ActionButton
            action="add"
            size="md"
            label={lang === "ar" ? "إضافة رحلة جديدة" : "Add Trip"}
            onClick={openCreateModal}
          />
          <ExportTableButtons data={tripList} columns={columns} fileName="trips" lang={lang} title={lang === "ar" ? "قائمة الرحلات" : "Trips List"} />
          </AdminPageActions>
        }
      />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",
            col: 3,
            placeholder: lang === "ar" ? "بحث بالاسم" : "Search by name",
          },
          type: {
            type: "select",
            col: 2,
            options: [
              { value: "tour", labelAr: "جولة", labelEn: "Tour" },
              { value: "transport", labelAr: "نقل", labelEn: "Transport" },
              { value: "package", labelAr: "باقة", labelEn: "Package" },
              { value: "activity", labelAr: "نشاط", labelEn: "Activity" },
            ],
          },
          fromCity: {
            type: "text",
            col: 2,
            placeholder: lang === "ar" ? "من المدينة" : "From City",
          },
          toCity: {
            type: "text",
            col: 2,
            placeholder: lang === "ar" ? "إلى المدينة" : "To City",
          },
          isActive: {
            type: "select",
            col: 2,
            options: [
              { value: "true", labelAr: "نشط", labelEn: "Active" },
              { value: "false", labelAr: "غير نشط", labelEn: "Inactive" },
            ],
          },
        }}
      />

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <UniversalTable
        columns={columns}
        data={tripList}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا توجد رحلات" : "No trips found"}
      />
      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(page) => dispatch(setPage(page))}
        onLimitChange={(limit) => dispatch(setLimit(limit))}
      />

      <UniversalFormModal
        show={showModal}
        onHide={closeForm}
        onSave={(data) => handleSave(data, { formMode, currentItem: currentTrip })}
        config={formConfig}
        initialData={currentTrip}
        titleAr={formMode === "edit" ? "تعديل الرحلة" : "إضافة رحلة"}
        titleEn={formMode === "edit" ? "Edit Trip" : "Add Trip"}
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
        title={lang === "ar" ? "تفاصيل الرحلة" : "Trip Details"}
        images={currentTrip?.images || []}
        entity={currentTrip}
        fields={[
          { label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name", value: currentTrip?.nameAr || "-" },
          { label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name", value: currentTrip?.nameEn || "-" },
          { label: lang === "ar" ? "نوع الرحلة" : "Trip Type", value: tripTypeLabel(currentTrip?.tripType) },
          { label: lang === "ar" ? "من المدينة" : "From City", value: currentTrip?.fromCity || "-" },
          { label: lang === "ar" ? "إلى المدينة" : "To City", value: currentTrip?.toCity || "-" },
          { label: lang === "ar" ? "السعر الأساسي" : "Base Price", value: formatPrice(currentTrip?.pricing?.basePrice, currentTrip?.pricing?.currency || "SAR") },
          { label: lang === "ar" ? "الحالة" : "Status", value: currentTrip?.isActive ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "غير نشط" : "Inactive") },
        ]}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={closeDelete}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={lang === "ar" ? `هل أنت متأكد من حذف ${deleteModal.name}؟` : `Are you sure you want to delete ${deleteModal.name}?`}
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />
    </div>
  );
}
