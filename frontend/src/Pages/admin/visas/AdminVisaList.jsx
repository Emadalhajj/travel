import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createVisa,
  deleteVisa,
  fetchVisas,
  setLimit,
  setPage,
  toggleVisa,
  updateVisa,
} from "../../../redux/visas/visaSlice";
import { fetchVisaTypes } from "../../../redux/visas/visaTypeSlice";
import { buildQuery } from "../../../Utils/buildQuery";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatPrice } from "../../../Utils/roundPrice";
import { visaFormConfig } from "../../../Components/common/ModalForms/visa/visaFormConfig";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import PaginationComponent from "../../../Components/common/Pagination";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

const emptyPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

export default function AdminVisaList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const {
    list: visas = [],
    loading,
    error,
    pagination = emptyPagination,
  } = useSelector((state) => state.visas || {});
  const { visaTypes = [] } = useSelector((state) => state.visaTypes || {});

  const [filters, setFilters] = useState({
    search: "",
    visaType: "",
    isActive: "",
  });

  const formConfig = useMemo(() => visaFormConfig(visaTypes), [visaTypes]);
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );

  useEffect(() => {
    dispatch(fetchVisaTypes());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchVisas(listQuery));
  }, [dispatch, listQuery]);

  const prepareVisaForForm = (visa) => ({
    ...normalizeForForm(visa, formConfig),
    visaType:
      typeof visa.visaType === "object"
        ? visa.visaType?._id || ""
        : visa.visaType || "",
  });
  const {
    showModal,
    showDetails,
    currentItem: currentVisa,
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
    prepareForForm: prepareVisaForForm,
    prepareClone: (visa, normalized) => ({
      ...normalized,
      _id: null,
      name: {
        ar: `${visa.name?.ar || ""} (نسخة)`,
        en: `${visa.name?.en || ""} (Copy)`,
      },
    }),
  });

  const handleSave = createHandleSave({
    dispatch,
    createAction: createVisa,
    updateAction: updateVisa,
    fetchAction: () => fetchVisas(listQuery),
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
      await dispatch(deleteVisa(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchVisas(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const handleToggleStatus = async (visa) => {
    try {
      await dispatch(toggleVisa(visa._id)).unwrap();
      toast.success(
        lang === "ar"
          ? visa.isActive
            ? "تم تعطيل التأشيرة"
            : "تم تفعيل التأشيرة"
          : visa.isActive
            ? "Visa deactivated"
            : "Visa activated",
      );
      dispatch(fetchVisas(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    }
  };

  const getVisaTypeName = (visa) =>
    (lang === "ar" ? visa.visaType?.nameAr : visa.visaType?.nameEn) || "-";

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
      render: (row) => <ImagePreviewCell images={row.images || []} />,
    },
    {
      header: lang === "ar" ? "الاسم" : "Name",
      render: (row) => (lang === "ar" ? row.name?.ar : row.name?.en) || "-",
      excelValue: (row) => (lang === "ar" ? row.name?.ar : row.name?.en) || "",
    },
    {
      header: lang === "ar" ? "نوع التأشيرة" : "Visa Type",
      render: getVisaTypeName,
      excelValue: getVisaTypeName,
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      render: (row) => formatPrice(row.price, row.currency || "SAR"),
      excelValue: (row) => row.price ?? 0,
      excelType: "number",
    },
    {
      header: lang === "ar" ? "المدة" : "Duration",
      render: (row) => row.duration || "-",
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      align: "center",
      render: (row) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <StatusBadge
            value={row.isActive ? "active" : "inactive"}
            type="user"
            isArabic={lang === "ar"}
          />
          <ActionButton
            action={row.isActive ? "deactivate" : "activate"}
            onClick={() => handleToggleStatus(row)}
          />
        </div>
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
              openDelete(row, lang === "ar" ? row.name?.ar : row.name?.en)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-3">
      <PageHeader
        titleAr="إدارة خدمات التأشيرات"
        titleEn="Visa Services Management"
        subtitleAr="إضافة وتعديل وحذف خدمات التأشيرات"
        subtitleEn="Create, edit, and delete visa services"
        actions={
          <AdminPageActions>
          <ActionButton
            size="md"
            action="add"
            label={lang === "ar" ? "إضافة تأشيرة جديدة" : "Add Visa"}
            onClick={openCreateModal}
          />
          <Link to="/admin/visa-types">
            <ActionButton
              size="md"
              action="edit"
              label={lang === "ar" ? "إدارة أنواع التأشيرات" : "Manage Visa Types"}
            />
          </Link>
          <ExportTableButtons data={visas} columns={columns} fileName="visas" lang={lang} title={lang === "ar" ? "قائمة التأشيرات" : "Visas List"} />
          </AdminPageActions>
        }
      />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",
            col: 4,
            placeholder: lang === "ar" ? "بحث بالاسم" : "Search by name",
          },
          visaType: {
            type: "select",
            col: 4,
            options: visaTypes.map((type) => ({
              value: type._id,
              labelAr: type.nameAr,
              labelEn: type.nameEn,
            })),
          },
          isActive: {
            type: "select",
            col: 4,
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
        data={visas}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا توجد تأشيرات" : "No visas found"}
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
        onSave={(data) => handleSave(data, { formMode, currentItem: currentVisa })}
        config={formConfig}
        initialData={currentVisa}
        titleAr={formMode === "edit" ? "تعديل التأشيرة" : "إضافة تأشيرة"}
        titleEn={formMode === "edit" ? "Edit Visa" : "Add Visa"}
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
        title={lang === "ar" ? "تفاصيل التأشيرة" : "Visa Details"}
        images={currentVisa?.images || []}
        entity={currentVisa}
        fields={[
          { label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name", value: currentVisa?.name?.ar || "-" },
          { label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name", value: currentVisa?.name?.en || "-" },
          { label: lang === "ar" ? "نوع التأشيرة" : "Visa Type", value: currentVisa ? getVisaTypeName(currentVisa) : "-" },
          { label: lang === "ar" ? "السعر" : "Price", value: formatPrice(currentVisa?.price, currentVisa?.currency || "SAR") },
          { label: lang === "ar" ? "المدة" : "Duration", value: currentVisa?.duration || "-" },
          { label: lang === "ar" ? "الصلاحية" : "Validity", value: currentVisa?.validity || "-" },
          { label: lang === "ar" ? "الدولة" : "Country", value: (lang === "ar" ? currentVisa?.country?.ar : currentVisa?.country?.en) || "-" },
          { label: lang === "ar" ? "الحالة" : "Status", value: currentVisa?.isActive ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "غير نشط" : "Inactive") },
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
