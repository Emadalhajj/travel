import React, { useEffect, useState } from "react";

import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createNewTransport,
  fetchTransports,
  updateExistingTransport,
  deleteTransportById,
} from "../../../redux/transports/transportSlice";
// import { deleteTransport } from "../../../redux/transports/transportSlice";

import { toast } from "react-toastify";
import { motion } from "framer-motion";

import UniversalCard from "../../../Components/common/cards/UniversalCard";
import { formatImagePath } from "../../../Utils/imageUtils";
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

export default function AdminTransportList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar"; // ar أو en
  const [showModal, setShowModal] = useState(false);
  const [currentTransport, setCurrentTransport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formModel, setFormModel] = useState("create"); // create  or update or clone

  //   const [formData, setFormData] = useState({
  //     vehicleType: "", // مهم جدًا
  //   });

  const {
    transportList = [],
    loading,
    error,
  } = useSelector((state) => state.transport);

  // للحذف
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  //filters
  const [filters, setFilters] = useState({
    search: "",
    vehicleType: "",
    fromCity: "",
    toCity: "",
    isActive: "", // "" = الكل، "true" = نشط، "false" = غير نشط
  });

  //تحويل قبل تمريرها للفورم iamges
  const normalizeImagesForForm = (images = []) =>
    images.map((img) => ({
      url: typeof img === "string" ? img : img.url,
      preview: formatImagePath(typeof img === "string" ? img : img.url),
      file: null, // صورة قديمة
      isOld: true,
    }));

  const openCreateModal = () => {
    setFormModel("create");
    setCurrentTransport(null);
    setShowModal(true);
  };
  const openUpdateModal = (transport) => {
    setFormModel("update");
    setShowModal(true);
    setCurrentTransport({
      ...transport,
      images: normalizeImagesForForm(transport.images),
    });
  };
  const openCloneModal = (transport) => {
    setFormModel("clone");
    setShowModal(true);
    setCurrentTransport({
      ...transport,
      nameAr: `${transport.nameAr} (نسخة)`,
      nameEn: `${transport.nameEn} (Copy)`,
      images: normalizeImagesForForm(transport.images),
    });
  };
  useEffect(() => {
    dispatch(fetchTransports());
  }, [dispatch]);

  const handleSave = async (fd) => {
    // console.log("handleSave called → mode:", formModel);
    // console.log("FormData entries:", [...fd.entries()]); // ← مهم جداً
    // ← fd هو FormData
    try {
      let resultAction;
      if (formModel === "update") {
        // console.log("Updating ID:", currentTransport._id);
        resultAction = await dispatch(
          updateExistingTransport({ id: currentTransport._id, payload: fd }),
        ).unwrap();
        toast.success(
          lang === "ar" ? "تم التحديث بنجاح" : "Updated successfully",
        );
      } else {
        // create or clone
        resultAction = await dispatch(createNewTransport(fd)).unwrap();

        // console.log("Mutation نجح → result:", resultAction);

        toast.success(
          formModel === "create"
            ? lang === "ar"
              ? "تم إضافة وسيلة النقل بنجاح"
              : "Transport added successfully"
            : toast.success(
                lang === "ar"
                  ? "تم استنساخ وسيلة النقل بنجاح"
                  : "Transport cloned successfully",
              ),
        );
      }

      setShowModal(false);
      setCurrentTransport(null);
      setFormModel("create");
      // مهم: إعادة جلب البيانات بعد النجاح
      dispatch(fetchTransports());
    } catch (err) {
      //console.error("Save error:", err);
      const msg = err?.data?.message || err?.message || "حدث خطأ غير متوقع";
      toast.error(lang === "ar" ? msg : msg);
    }
  };

  //delete
  const confirmDelete = async () => {
    try {
      await dispatch(deleteTransportById(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      // مهم: إعادة جلب القائمة
      dispatch(fetchTransports());
    } catch (err) {
      toast.error(lang === "ar" ? "حدث خطا ما" : "An error occurred");
    } finally {
      setDeleteModal({
        show: false,
        id: null,
        name: "",
      });
    }
  };

  //filters
  useEffect(() => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
    );
    dispatch(fetchTransports(query));
  }, [filters, dispatch]);

  return (
    <div className="container py-3">
      {/* Header */}
      <PageHeader
        // titleAr="إدارة النقل"
        // titleEn="Transport Management"
        subtitleAr="إدارة كاملة لوسائل النقل، المرافق، أنواع السيارات والسياسات"
        subtitleEn="Full management of transport, facilities, car types and policies"
      />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        {/* Action Buttons */}
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
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
          </div>
        </div>
      </div>
      {/* loadign */}
      <LoadingOverlay
        show={loading}
        text={lang === "ar" ? "جاري التحميل..." : "Loading..."}
      />
      <ErrorOverlay show={!!error} message={error} />
      {/* filters */}

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
              { value: "train", labelAr: "قطار", labelEn: "train" },
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

      {/* {trasport cards} */}
      <UniversalCardsContainer
        items={transportList}
        lang={lang}
        emptyMessageAr="لا توجد فنادق مضافة بعد"
        emptyMessageEn="No hotels added yet"
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
          setCurrentTransport(transport);
          setShowDetails(true);
        }}
        onDuplicate={openCloneModal}
        onEdit={(transport) => openUpdateModal(transport)}
        onDelete={(transport) =>
          setDeleteModal({
            show: true,
            id: transport._id,
            name: lang === "ar" ? transport.nameAr : transport.nameEn,
          })
        }
        onNavigate={(transport) =>
          navigate(`/admin/transport/${transport._id}/MeansOfTransportation`)
        }
      />
   
      {/* modal for editing and adding transport */}
      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        config={transportFormConfig}
        //    formData={formData}
        //   setFormData={setFormData}

        initialData={currentTransport}
        titleAr={
          formModel === "update" ? "تعديل وسيلة النقل" : "إضافة وسيلة نقل"
        }
        titleEn={formModel === "update" ? "Edit Transport" : "Add Transport"}
      />
      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
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
          {
            label: lang === "ar" ? "" : "",
            value: "",
          },
          {
            label: lang === "ar" ? "" : "",
            value: "",
          },
          {
            label: lang === "ar" ? "" : "",
            value: "",
          },
          {
            label: lang === "ar" ? "" : "",
            value: "",
          },
        ]}
        entity={currentTransport}
      />
      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null })}
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
