import { useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import {
  fetchExtraServices,
  createExtraService,
  updateExtraService,
  deleteExtraService,
  setPage,
  setLimit,
} from "../../../redux/extraServices/extraServiceSlice";

import { extraServiceFormConfig } from "../../../Components/common/ModalForms/extraServices/extraServiceFormConfig";

import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";

export default function AdminExtraServiceList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    extraServicesList = [],
    loading,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.extraServices || {});

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentService, setCurrentService] = useState(null);
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
    category: "",
    isActive: "",
    sort: "createdAt_desc",
  });

  const memoizedConfig = useMemo(() => extraServiceFormConfig(), []);

  useEffect(() => {
    const query = buildQuery(filters, pagination);
    dispatch(fetchExtraServices(query));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentService(null);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setFormMode("edit");
    setCurrentService(normalizeForForm(service, memoizedConfig));
    setFormErrors({});
    setShowModal(true);
  };

  const openCloneModal = (service) => {
    const normalized = normalizeForForm(service, memoizedConfig);

    setFormMode("clone");
    setCurrentService({
      ...normalized,
      _id: null,
      nameAr: `${service.nameAr} (نسخة)`,
      nameEn: `${service.nameEn} (Copy)`,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = createHandleSave({
    dispatch,
    createAction: createExtraService,
    updateAction: updateExtraService,
    fetchAction: fetchExtraServices,
    getId: (item) => item._id,
    formConfig: memoizedConfig,
    toast,
    lang,
    closeModal: () => setShowModal(false),
    resetItem: () => setCurrentService(null),
    resetMode: () => setFormMode("create"),
    setLoading: setLoadingSave,
    setFormErrors,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteExtraService(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم حذف الخدمة" : "Service deleted");
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ أثناء الحذف" : "Delete failed");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  const categoryLabel = (value) => {
    const labels = {
      airport_service: lang === "ar" ? "خدمة مطار" : "Airport Service",
      insurance: lang === "ar" ? "تأمين" : "Insurance",
      meal: lang === "ar" ? "وجبات" : "Meals",
      religious_guide: lang === "ar" ? "إرشاد ديني" : "Religious Guide",
      vip_service: lang === "ar" ? "خدمة VIP" : "VIP Service",
      sim_card: lang === "ar" ? "شريحة اتصال" : "SIM Card",
      wheelchair: lang === "ar" ? "كرسي متحرك" : "Wheelchair",
      other: lang === "ar" ? "أخرى" : "Other",
    };

    return labels[value] || value || "-";
  };

  const columns = [
    {
      header: lang === "ar" ? "الرقم" : "No",
      align: "center",
      render: (_, index) => <span>{index + 1}</span>,
    },
    {
      header: lang === "ar" ? "الصورة" : "Image",
      align: "center",
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    {
      header: lang === "ar" ? "اسم الخدمة" : "Service Name",
      accessor: ["nameAr", "nameEn"],
    },
    {
      header: lang === "ar" ? "التصنيف" : "Category",
      render: (row) => categoryLabel(row.category),
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      render: (row) =>
        `${row.pricing?.basePrice || 0} ${row.pricing?.currency || "SAR"}`,
    },
    {
      header: lang === "ar" ? "التوفر" : "Availability",
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
              setCurrentService(row);
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
        subtitleAr="إدارة الخدمات الإضافية والتكميلية"
        subtitleEn="Manage Extra Services"
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 d-flex justify-content-center">
          <ActionButton
            size="md"
            action="add"
            label={lang === "ar" ? "إضافة خدمة" : "Add Service"}
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
              lang === "ar" ? "ابحث باسم الخدمة" : "Search service name",
          },
          category: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "التصنيف" : "Category",
            options: [
              { value: "airport_service", labelAr: "خدمة مطار", labelEn: "Airport Service" },
              { value: "insurance", labelAr: "تأمين", labelEn: "Insurance" },
              { value: "meal", labelAr: "وجبات", labelEn: "Meals" },
              { value: "religious_guide", labelAr: "إرشاد ديني", labelEn: "Religious Guide" },
              { value: "vip_service", labelAr: "خدمة VIP", labelEn: "VIP Service" },
              { value: "sim_card", labelAr: "شريحة اتصال", labelEn: "SIM Card" },
              { value: "wheelchair", labelAr: "كرسي متحرك", labelEn: "Wheelchair" },
              { value: "other", labelAr: "أخرى", labelEn: "Other" },
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
            currentItem: currentService,
          })
        }
        config={memoizedConfig}
        initialData={currentService}
        titleAr={formMode === "edit" ? "تعديل الخدمة" : "إضافة خدمة"}
        titleEn={formMode === "edit" ? "Edit Service" : "Add Service"}
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={lang === "ar" ? "تفاصيل الخدمة" : "Service Details"}
        images={currentService?.images || []}
        fields={[
          {
            label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
            value: currentService?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name",
            value: currentService?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "التصنيف" : "Category",
            value: categoryLabel(currentService?.category),
          },
          {
            label: lang === "ar" ? "السعر" : "Price",
            value: `${currentService?.pricing?.basePrice || 0} ${
              currentService?.pricing?.currency || "SAR"
            }`,
          },
          {
            label: lang === "ar" ? "التوفر" : "Availability",
            value: currentService?.isAlwaysAvailable
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
        data={extraServicesList}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا توجد خدمات" : "No services found"}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "حذف الخدمة؟" : "Delete Service?"}
        message={
          <span>
            {lang === "ar"
              ? "هل أنت متأكد من حذف الخدمة: "
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