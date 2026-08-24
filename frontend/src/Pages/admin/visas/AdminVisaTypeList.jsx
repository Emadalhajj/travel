import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createVisaType,
  deleteVisaType,
  fetchVisaTypes,
  updateVisaType,
} from "../../../redux/visas/visaTypeSlice";
import { visaTypeFormConfig } from "../../../Components/common/ModalForms/visa/visaTypeFormConfig";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { handleApiError } from "../../../Utils/handleApiError";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

export default function AdminVisaTypeList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const {
    visaTypes = [],
    loading,
    error,
  } = useSelector((state) => state.visaTypes || {});

  const formConfig = useMemo(() => visaTypeFormConfig(), []);
  const {
    showModal,
    showDetails,
    currentItem,
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
    prepareForForm: (item) => normalizeForForm(item, formConfig),
    prepareClone: (item, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${item.nameAr} (نسخة)`,
      nameEn: `${item.nameEn} (Copy)`,
    }),
  });

  useEffect(() => {
    dispatch(fetchVisaTypes());
  }, [dispatch]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: createVisaType,
    updateAction: updateVisaType,
    fetchAction: fetchVisaTypes,
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
      await dispatch(deleteVisaType(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const columns = [
    {
      header: "#",
      align: "center",
      accessor: "_rowNumber",
      render: (_, index) => index + 1,
    },
    {
      header: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
      accessor: "nameAr",
    },
    {
      header: lang === "ar" ? "الاسم بالإنجليزية" : "English Name",
      accessor: "nameEn",
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <StatusBadge
          value={row.isActive === false ? "inactive" : "active"}
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
          <ActionButton action="edit" onClick={() => openEdit(row)} />
          <ActionButton action="clone" onClick={() => openClone(row)} />
          <ActionButton action="view" onClick={() => openDetails(row)} />
          <ActionButton
            action="delete"
            onClick={() => openDelete(row, lang === "ar" ? row.nameAr : row.nameEn)}
          />
        </div>
      ),
    },
  ];

  const exportData = visaTypes.map((item, index) => ({
    ...item,
    _rowNumber: index + 1,
  }));

  return (
    <div className="container py-3">
      <PageHeader
        titleAr="إدارة أنواع التأشيرات"
        titleEn="Manage Visa Types"
        subtitleAr="إضافة وتعديل وحذف أنواع التأشيرات"
        subtitleEn="Create, edit, and delete visa types"
        actions={
          <AdminPageActions>
          <ActionButton
            action="add"
            size="md"
            label={lang === "ar" ? "إضافة نوع تأشيرة" : "Add Visa Type"}
            onClick={openCreate}
          />
          <ExportTableButtons data={exportData} columns={columns} fileName="visa-types" lang={lang} title={lang === "ar" ? "أنواع التأشيرات" : "Visa Types"} />
          </AdminPageActions>
        }
      />

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <UniversalTable
        columns={columns}
        data={visaTypes}
        lang={lang}
        emptyMessage={
          lang === "ar" ? "لا توجد أنواع تأشيرات" : "No visa types found"
        }
      />

      <UniversalFormModal
        show={showModal}
        onHide={closeForm}
        onSave={(data) => handleSave(data, { formMode, currentItem })}
        config={formConfig}
        initialData={currentItem}
        titleAr={formMode === "edit" ? "تعديل نوع التأشيرة" : "إضافة نوع تأشيرة"}
        titleEn={formMode === "edit" ? "Edit Visa Type" : "Add Visa Type"}
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
        title={lang === "ar" ? "تفاصيل نوع التأشيرة" : "Visa Type Details"}
        entity={currentItem}
        fields={[
          { label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name", value: currentItem?.nameAr || "-" },
          { label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name", value: currentItem?.nameEn || "-" },
          { label: lang === "ar" ? "الحالة" : "Status", value: currentItem?.isActive === false ? (lang === "ar" ? "غير نشط" : "Inactive") : (lang === "ar" ? "نشط" : "Active") },
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
