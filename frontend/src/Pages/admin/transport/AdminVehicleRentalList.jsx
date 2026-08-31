import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import {
  fetchVehicleRentals,
  createVehicleRental,
  updateVehicleRental,
  deleteVehicleRental,
  setPage,
  setLimit,
} from "../../../redux/transports/vehicleRentalSlice";

import {
  fetchTransports,
  selectTransportItems,
} from "../../../redux/transports/transportSlice";

// import { vehicleRentalFormConfig } from "../../../Components/common/ModalForms/transports/vehicleRentalFormConfig";

import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatPrice } from "../../../Utils/roundPrice";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import { vehicleRentalFormConfig } from "../../../Components/common/ModalForms/transport/vehicleRentalFormConfig";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

export default function AdminVehicleRentalList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    vehicleRentalsList = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.vehicleRentals || {});

  const transportList = useSelector(selectTransportItems);

  const [filters, setFilters] = useState({
    search: "",
    rentalType: "",
    isActive: "",
    sort: "createdAt_desc",
  });

  const memoizedConfig = useMemo(
    () => vehicleRentalFormConfig(transportList),
    [transportList],
  );
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const prepareRental = (rental) => ({
    ...normalizeForForm(rental, memoizedConfig),
    transport:
      typeof rental.transport === "object"
        ? rental.transport?._id
        : rental.transport,
  });
  const {
    showModal,
    showDetails,
    currentItem: currentRental,
    formMode,
    formErrors,
    loadingSave,
    deleteModal,
    openCreate: openCreateModal,
    openEdit: openEditModal,
    openClone: openCloneModal,
    openDetails,
    openDelete,
    closeForm,
    closeDetails,
    closeDelete,
    resetForm,
    setFormErrors,
    setLoadingSave,
  } = useAdminEntityCrudState({
    prepareForForm: prepareRental,
    prepareClone: (rental, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${rental.nameAr} (نسخة)`,
      nameEn: `${rental.nameEn} (Copy)`,
    }),
  });

  useEffect(() => {
    dispatch(fetchVehicleRentals(listQuery));
  }, [dispatch, listQuery]);

  useEffect(() => {
    dispatch(fetchTransports({ page: 1, limit: 1000 }));
  }, [dispatch]);

  const rentalTypeLabel = (value) => {
    const labels = {
      hourly: lang === "ar" ? "بالساعة" : "Hourly",
      daily: lang === "ar" ? "باليوم" : "Daily",
      monthly: lang === "ar" ? "بالشهر" : "Monthly",
      yearly: lang === "ar" ? "بالسنة" : "Yearly",
      trip: lang === "ar" ? "بالرحلة" : "Per Trip",
    };

    return labels[value] || value || "-";
  };

  const handleSave = createHandleSave({
    dispatch,
    createAction: createVehicleRental,
    updateAction: updateVehicleRental,
    fetchAction: () => fetchVehicleRentals(listQuery),
    getId: (item) => item._id,
    formConfig: memoizedConfig,
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
      await dispatch(deleteVehicleRental(deleteModal.id)).unwrap();
      toast.success(
        lang === "ar"
          ? "تم حذف عرض التأجير بنجاح"
          : "Vehicle rental deleted successfully",
      );
      dispatch(fetchVehicleRentals(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const columns = [
    {
      header: lang === "ar" ? "الرقم" : "No",
      align: "center",
      width: "60px",
      render: (_, index) => <span className="fw-bold">{index + 1}</span>,
    },
    {
      header: lang === "ar" ? "اسم العرض" : "Rental Name",
      accessor: ["nameAr", "nameEn"],
      render: (row) => (lang === "ar" ? row.nameAr : row.nameEn) || "-",
      excelValue: (row) => (lang === "ar" ? row.nameAr : row.nameEn) || "",
    },
    {
      header: lang === "ar" ? "وسيلة النقل" : "Vehicle",
      render: (row) =>
        lang === "ar"
          ? row.transport?.nameAr || "-"
          : row.transport?.nameEn || "-",
    },
    {
      header: lang === "ar" ? "نوع المركبة" : "Vehicle Type",
      render: (row) => row.transport?.vehicleType || "-",
    },
    {
      header: lang === "ar" ? "السعة" : "Capacity",
      align: "center",
      render: (row) => row.transport?.capacity || "-",
      excelValue: (row) => row.transport?.capacity ?? null,
      excelType: "number",
    },
    {
      header: lang === "ar" ? "نوع التأجير" : "Rental Type",
      render: (row) => rentalTypeLabel(row.rentalType),
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      render: (row) =>
        formatPrice(row.pricing?.basePrice, row.pricing?.currency || "SAR"),
      excelValue: (row) => row.pricing?.basePrice || 0,
      excelType: "number",
    },
    {
      header: lang === "ar" ? "التوفر" : "Availability",
      align: "center",
      render: (row) => (
        <StatusBadge
          value={row.isAlwaysAvailable
            ? lang === "ar"
              ? "دائم التوفر"
              : "Always Available"
            : lang === "ar"
              ? "حسب المخزون"
              : "By Inventory"}
          isArabic={lang === "ar"}
        />
      ),
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      align: "center",
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
    <div className="container py-2">
      <PageHeader
        titleAr="إدارة تأجير وسائل النقل"
        titleEn="Vehicle Rentals Management"
        subtitleAr="إدارة عروض تأجير وسائل النقل"
        subtitleEn="Manage Vehicle Rental Offers"
        actions={
          <AdminPageActions>
          <ActionButton
            size="md"
            action="add"
            label={
              lang === "ar"
                ? "إضافة عرض تأجير"
                : "Add Vehicle Rental"
            }
            onClick={openCreateModal}
          />
          <ExportTableButtons data={vehicleRentalsList} columns={columns} fileName="vehicle-rentals" lang={lang} title={lang === "ar" ? "تقرير تأجير المركبات" : "Vehicle Rentals Report"} />
          </AdminPageActions>
        }
      />

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={Boolean(error)} message={error} />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",
            col: 4,
            placeholder:
              lang === "ar"
                ? "ابحث باسم العرض"
                : "Search rental name",
          },
          rentalType: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "نوع التأجير" : "Rental Type",
            options: [
              { value: "hourly", labelAr: "بالساعة", labelEn: "Hourly" },
              { value: "daily", labelAr: "باليوم", labelEn: "Daily" },
              { value: "monthly", labelAr: "بالشهر", labelEn: "Monthly" },
              { value: "yearly", labelAr: "بالسنة", labelEn: "Yearly" },
              { value: "trip", labelAr: "بالرحلة", labelEn: "Per Trip" },
            ],
          },
          isActive: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "الحالة" : "Status",
            options: [
              { value: "true", labelAr: "نشط", labelEn: "Active" },
              { value: "false", labelAr: "غير نشط", labelEn: "Inactive" },
            ],
          },
        }}
      />

      <UniversalFormModal
        show={showModal}
        onHide={closeForm}
        onSave={(data) =>
          handleSave(data, {
            formMode,
            currentItem: currentRental,
          })
        }
        config={memoizedConfig}
        initialData={currentRental}
        titleAr={
          formMode === "edit"
            ? "تعديل عرض التأجير"
            : "إضافة عرض تأجير"
        }
        titleEn={
          formMode === "edit"
            ? "Edit Vehicle Rental"
            : "Add Vehicle Rental"
        }
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
        title={
          lang === "ar"
            ? "تفاصيل عرض التأجير"
            : "Vehicle Rental Details"
        }
        images={currentRental?.images || currentRental?.transport?.images || []}
        fields={[
          {
            label: lang === "ar" ? "اسم العرض بالعربية" : "Arabic Name",
            value: currentRental?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "اسم العرض بالإنجليزية" : "English Name",
            value: currentRental?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "وسيلة النقل" : "Vehicle",
            value:
              lang === "ar"
                ? currentRental?.transport?.nameAr || "غير متوفر"
                : currentRental?.transport?.nameEn || "N/A",
          },
          {
            label: lang === "ar" ? "نوع المركبة" : "Vehicle Type",
            value: currentRental?.transport?.vehicleType || "غير متوفر",
          },
          {
            label: lang === "ar" ? "السعة" : "Capacity",
            value: currentRental?.transport?.capacity ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "نوع التأجير" : "Rental Type",
            value: rentalTypeLabel(currentRental?.rentalType),
          },
          {
            label: lang === "ar" ? "السعر الأساسي" : "Base Price",
            value: formatPrice(
              currentRental?.pricing?.basePrice,
              currentRental?.pricing?.currency || "SAR",
            ),
          },
          {
            label: lang === "ar" ? "التوفر" : "Availability",
            value: currentRental?.isAlwaysAvailable
              ? lang === "ar"
                ? "دائم التوفر"
                : "Always Available"
              : lang === "ar"
                ? "حسب المخزون"
                : "By Inventory",
          },
        ]}
      />

      <UniversalTable
        columns={columns}
        data={vehicleRentalsList}
        lang={lang}
        emptyMessage={
          lang === "ar"
            ? "لا توجد عروض تأجير"
            : "No vehicle rentals found"
        }
      />

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={closeDelete}
        onConfirm={confirmDelete}
        title={
          lang === "ar"
            ? "حذف عرض التأجير؟"
            : "Delete Vehicle Rental?"
        }
        message={
          <span>
            {lang === "ar"
              ? "هل أنت متأكد من حذف عرض التأجير: "
              : "Are you sure you want to delete: "}
            <strong>{deleteModal.name}</strong>
          </span>
        }
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="delete"
      />
    </div>
  );
}
