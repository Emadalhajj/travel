import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createNewTransport,
  fetchTransports,
  updateExistingTransport,
  deleteTransportById,
} from "../../../redux/transports/transportSlice";

import { toast } from "react-toastify";
import { formatImagePath } from "../../../Utils/imageUtils";
import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { handleApiError } from "../../../Utils/handleApiError";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import { transportFormConfig } from "../../../Components/common/ModalForms/transport/transportFormConfig";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import EntityFilter from "../../../Components/common/EntityFilter";
import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

export default function AdminTransportList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const {
    transportList = [],
    loading,
    error,
  } = useSelector((state) => state.transport);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    isActive: "",
  });
  const memoizedConfig = useMemo(() => transportFormConfig, []);
  const listQuery = useMemo(() => buildQuery(filters), [filters]);
  const {
    showModal,
    showDetails,
    currentItem: currentTransport,
    formMode,
    formErrors,
    loadingSave,
    deleteModal,
    openCreate: openCreateModal,
    openEdit: openUpdateModal,
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
    prepareForForm: (transport) => normalizeForForm(transport, memoizedConfig),
    prepareClone: (transport, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${transport.nameAr} (نسخة)`,
      nameEn: `${transport.nameEn} (Copy)`,
    }),
  });
  useEffect(() => {
    dispatch(fetchTransports(listQuery));
  }, [dispatch, listQuery]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: createNewTransport,
    updateAction: updateExistingTransport,
    fetchAction: () => fetchTransports(listQuery),
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
      await dispatch(deleteTransportById(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchTransports(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  return (
    <div className="container py-3">
      <PageHeader
        titleAr="إدارة وسائل النقل"
        titleEn="Transport Management"
        subtitleAr="إدارة كاملة لوسائل النقل، المرافق، أنواع السيارات والسياسات"
        subtitleEn="Full management of transport, facilities, car types and policies"
        actions={
          <AdminPageActions>
            <ActionButton
              action="add"
              onClick={() => openCreateModal()}
              label={lang === "ar" ? "إضافة وسيلة نقل" : "Add Transport"}
              size="md"
            />
            <ActionButton
              action="edit"
              onClick={() => navigate("/admin/trips")}
              label={lang === "ar" ? "تعديل الرحلات" : "Trip Edit"}
              size="md"
              className="bg-green-100 text-green-700 hover:bg-green-200"
            />
            <ActionButton
            action= "add"
            onClick={() => navigate("/admin/vehicle-rentals")}
            label={lang === "ar" ? "إدارة تأجير النقل" : "Manage Vehicle Rentals"}
            size="md"
            className="bg-blue-100 text-blue-700 hover:bg-blue-200"
            />
          </AdminPageActions>
        }
      />
      <LoadingOverlay
        show={loading}
        text={lang === "ar" ? "جاري التحميل..." : "Loading..."}
      />
      <ErrorOverlay show={!!error} message={error} />
      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          type: {
            type: "select",
            col: 4,
            options: [
              { value: "bus", labelAr: "باص", labelEn: "Bus" },
              { value: "van", labelAr: "فان", labelEn: "Van" },
              { value: "car", labelAr: "سيارة", labelEn: "Car" },
              { value: "plane", labelAr: "طائرة", labelEn: "Plane" },
              { value: "ship", labelAr: "سفينة", labelEn: "Ship" },
              { value: "train", labelAr: "قطار", labelEn: "Train" },
            ],
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

      <UniversalCardsContainer
        items={transportList}
        lang={lang}
        emptyMessageAr="لا توجد وسائل نقل مضافة بعد"
        emptyMessageEn="No transports added yet"
        getImage={(transport) =>
          transport.images?.[0] ? formatImagePath(transport.images[0]) : null
        }
        getTitle={(transport) =>
          lang === "ar" ? transport.nameAr : transport.nameEn
        }
        getSubtitle={(transport) =>
          lang === "ar" ? transport.descriptionAr : transport.descriptionEn
        }
        getBadges={(transport) => [
          {
            label: transport.transportType?.toUpperCase() || "Transport",
          },
        ]}
        onView={(transport) => {
          openDetails(transport);
        }}
        onDuplicate={openCloneModal}
        onEdit={(transport) => openUpdateModal(transport)}
        onDelete={(transport) =>
          openDelete(
            transport,
            lang === "ar" ? transport.nameAr : transport.nameEn,
          )
        }
        onNavigate={(transport) =>
          navigate(`/admin/transport/${transport._id}/MeansOfTransportation`)
        }
      />
   
      <UniversalFormModal
        show={showModal}
        onHide={closeForm}
        onSave={handleSave}
        config={transportFormConfig}
        initialData={currentTransport}
        titleAr={
          formMode === "edit" ? "تعديل وسيلة النقل" : "إضافة وسيلة نقل"
        }
        titleEn={formMode === "edit" ? "Edit Transport" : "Add Transport"}
        errors={formErrors}
        loading={loadingSave}
      />
      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
        title={lang === "ar" ? "عرض التفاصيل" : "Transport details show"}
        images={currentTransport?.images || []}
        fields={[
          {
            label: lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
            value: currentTransport?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
            value: currentTransport?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
            value: currentTransport?.descriptionAr || "غير متوفر",
          },
          {
            label: lang === "en" ? "الوصف (إنجليزي)" : "Description (English)",
            value: currentTransport?.descriptionEn || "غير متوفر",
          },
        ]}
        entity={currentTransport}
      />
      <ConfirmDialog
        show={deleteModal.show}
        onHide={closeDelete}
        title={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={
          lang === "ar"
            ? `هل أنت متأكد من حذف ${deleteModal.name}?`
            : `Are you sure you want to delete ${deleteModal.name}?`
        }
        onConfirm={confirmDelete}
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />
    </div>
  );
}
