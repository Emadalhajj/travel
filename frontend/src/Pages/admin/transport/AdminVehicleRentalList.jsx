import { useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
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

import { fetchTransports } from "../../../redux/transports/transportSlice";

// import { vehicleRentalFormConfig } from "../../../Components/common/ModalForms/transports/vehicleRentalFormConfig";

import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { serializeForApi } from "../../../Utils/formData/serialize";

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
import { vehicleRentalFormConfig } from "../../../Components/common/ModalForms/transport/vehicleRentalFormConfig";

export default function AdminVehicleRentalList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    vehicleRentalsList = [],
    loading,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.vehicleRentals || {});

  const { transportList = [] } = useSelector(
    (state) => state.transport || {},
  );

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentRental, setCurrentRental] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formErrors, setFormErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

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

  useEffect(() => {
    const query = buildQuery(filters, pagination);
    dispatch(fetchVehicleRentals(query));
  }, [dispatch, filters, pagination.page, pagination.limit]);

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

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentRental(null);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (rental) => {
    const normalized = normalizeForForm(rental, memoizedConfig);

    setFormMode("edit");
    setCurrentRental({
      ...normalized,
      transport:
        typeof rental.transport === "object"
          ? rental.transport?._id
          : rental.transport,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openCloneModal = (rental) => {
    const normalized = normalizeForForm(rental, memoizedConfig);

    setFormMode("clone");
    setCurrentRental({
      ...normalized,
      _id: null,
      transport:
        typeof rental.transport === "object"
          ? rental.transport?._id
          : rental.transport,
      nameAr: `${rental.nameAr} (نسخة)`,
      nameEn: `${rental.nameEn} (Copy)`,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async (data, context = {}) => {
    try {
      setLoadingSave(true);
      setFormErrors({});

      const formState = data?.formState || data;
      const payload = serializeForApi(formState, memoizedConfig);

      if (context.formMode === "edit") {
        await dispatch(
          updateVehicleRental({
            id: context.currentItem?._id,
            payload,
          }),
        ).unwrap();

        toast.success(
          lang === "ar"
            ? "تم تحديث عرض التأجير بنجاح"
            : "Vehicle rental updated successfully",
        );
      } else {
        await dispatch(createVehicleRental(payload)).unwrap();

        toast.success(
          lang === "ar"
            ? "تم إنشاء عرض التأجير بنجاح"
            : "Vehicle rental created successfully",
        );
      }

      setShowModal(false);
      setCurrentRental(null);
      setFormMode("create");
      dispatch(fetchVehicleRentals(buildQuery(filters, pagination)));
    } catch (err) {
      const backendErrors =
        err?.errors ||
        err?.payload?.errors ||
        err?.data?.errors ||
        err?.response?.data?.errors ||
        {};

      setFormErrors(backendErrors);

      toast.error(
        err?.message ||
          err?.data?.message ||
          err?.response?.data?.message ||
          (lang === "ar" ? "حدث خطأ أثناء الحفظ" : "Save failed"),
      );
    } finally {
      setLoadingSave(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteVehicleRental(deleteModal.id)).unwrap();
      toast.success(
        lang === "ar"
          ? "تم حذف عرض التأجير بنجاح"
          : "Vehicle rental deleted successfully",
      );
    } catch {
      toast.error(
        lang === "ar"
          ? "حدث خطأ أثناء الحذف"
          : "Delete failed",
      );
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
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
    },
    {
      header: lang === "ar" ? "نوع التأجير" : "Rental Type",
      render: (row) => rentalTypeLabel(row.rentalType),
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      render: (row) =>
        `${row.pricing?.basePrice || 0} ${
          row.pricing?.currency || "SAR"
        }`,
    },
    {
      header: lang === "ar" ? "التوفر" : "Availability",
      align: "center",
      render: (row) => (
        <Badge bg={row.isAlwaysAvailable ? "success" : "warning"}>
          {row.isAlwaysAvailable
            ? lang === "ar"
              ? "دائم التوفر"
              : "Always Available"
            : lang === "ar"
              ? "حسب المخزون"
              : "By Inventory"}
        </Badge>
      ),
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      align: "center",
      render: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive
            ? lang === "ar"
              ? "نشط"
              : "Active"
            : lang === "ar"
              ? "غير نشط"
              : "Inactive"}
        </Badge>
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
              setCurrentRental(row);
              setShowDetails(true);
            }}
          />
          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,
                id: row._id,
                name: lang === "ar" ? row.nameAr : row.nameEn,
              })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-2">
      <PageHeader
        subtitleAr="إدارة عروض تأجير وسائل النقل"
        subtitleEn="Manage Vehicle Rental Offers"
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 d-flex justify-content-center">
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
        </div>

        <ExportTableButtons />
      </div>

      <LoadingOverlay show={loading} />

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
        onHide={() => setShowModal(false)}
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
        onHide={() => setShowDetails(false)}
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
            value: `${currentRental?.pricing?.basePrice || 0} ${
              currentRental?.pricing?.currency || "SAR"
            }`,
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

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
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

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: "" })}
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
