import { useEffect, useMemo, useState } from "react";
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
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

export default function AdminExtraServiceList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    extraServicesList = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.extraServices || {});

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    isActive: "",
    sort: "createdAt_desc",
  });

  const memoizedConfig = useMemo(() => extraServiceFormConfig(), []);
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const {
    showModal,
    showDetails,
    currentItem: currentService,
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
    prepareForForm: (service) => normalizeForForm(service, memoizedConfig),
    prepareClone: (service, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${service.nameAr} (نسخة)`,
      nameEn: `${service.nameEn} (Copy)`,
    }),
  });

  useEffect(() => {
    dispatch(fetchExtraServices(listQuery));
  }, [dispatch, listQuery]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: createExtraService,
    updateAction: updateExtraService,
    fetchAction: () => fetchExtraServices(listQuery),
    getId: (item) => item._id,
    formConfig: memoizedConfig,
    toast,
    lang,
    closeModal: closeForm,
    resetItem: resetForm,
    setLoading: setLoadingSave,
    setFormErrors,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteExtraService(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم حذف الخدمة" : "Service deleted");
      dispatch(fetchExtraServices(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
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
      exportImageAccessor: "images",
      pdfWidth: 52,
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    {
      header: lang === "ar" ? "اسم الخدمة" : "Service Name",
      accessor: ["nameAr", "nameEn"],
      render: (row) => (lang === "ar" ? row.nameAr : row.nameEn) || "-",
      excelValue: (row) => (lang === "ar" ? row.nameAr : row.nameEn) || "",
    },
    {
      header: lang === "ar" ? "التصنيف" : "Category",
      render: (row) => categoryLabel(row.category),
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
        titleAr="إدارة الخدمات الإضافية"
        titleEn="Extra Services Management"
        subtitleAr="إدارة الخدمات الإضافية والتكميلية"
        subtitleEn="Manage Extra Services"
        actions={
          <AdminPageActions>
          <ActionButton
            size="md"
            action="add"
            label={lang === "ar" ? "إضافة خدمة" : "Add Service"}
            onClick={openCreateModal}
          />
          <ExportTableButtons data={extraServicesList} columns={columns} fileName="extra-services" lang={lang} title={lang === "ar" ? "تقرير الخدمات الإضافية" : "Extra Services Report"} />
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
        onHide={closeForm}
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
        onHide={closeDetails}
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
            value: formatPrice(
              currentService?.pricing?.basePrice,
              currentService?.pricing?.currency || "SAR",
            ),
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

      <UniversalTable
        columns={columns}
        data={extraServicesList}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا توجد خدمات" : "No services found"}
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
