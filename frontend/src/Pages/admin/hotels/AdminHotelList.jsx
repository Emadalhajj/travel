import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHotels,
  fetchHotelsById,
  createHotel,
  updateHotel,
  deleteHotel,
  toggleHotelStatus,
  setPaginationLimit,
  setPaginationPage,
} from "../../../redux/hotels/hotelSlice";

import { toast } from "react-toastify";

import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TruncatedText from "../../../Components/common/TruncatedText"; // مكون لعرض النص المختصر
import { formatImagePath } from "../../../Utils/imageUtils";
import ReusableModalForm from "../../../Components/common/modals/ReusableModalForm";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import HotelFormModal from "../../../Components/common/ModalForms/hotel/HotelFormModal";
import UniversalCard from "../../../Components/common/cards/UniversalCard";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import { cloneEntity } from "../../../Utils/cloneEntity";
import PageHeader from "../../../Components/layout/PageHeader";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ActionButton from "../../../Components/common/buttons/ActionButton";
// import UniversalFormModal from "../../../Components/common/ModalForms/UniversalFormModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import { hotelFormConfig } from "../../../Components/common/ModalForms/hotel/hotelFormConfig";

import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import {
  selectedKeysFromObject,
  toBoolean,
  toNumber,
  toStringList,
} from "../../../Utils/formData/converters";
import {
  buildPayloadFromConfig,
  createRequestFormData,
  extractFormDataEntries,
} from "../../../Utils/formData/formSerializer";
import {
  buildCloneExistingImages,
  withExistingImages,
} from "../../../Utils/formData/images";
// import { serializeForApi } from "../../../Utils/formData/serialize";
import { buildFormData } from "../../../Utils/formData/buildFormData";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import PaginationComponent from "../../../Components/common/Pagination";

// import  ImageUploader from "../../../Components/common/ImageUploader";

export default function AdminHotelList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar"; // ar أو en

  const {
    hotelslist: hotels = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.hotels || {});

  const [showModal, setShowModal] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(null); // يستخدم لكل من create و edit و clone
  const [formMode, setFormMode] = useState("create"); // create | edit | clone
  const [showDetails, setShowDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

  const [loadingSave, setLoadingSave] = useState(false);
  const [filters, setFilters] = useState({
    hotelType: "",
    country: "",
    city: "",
    stars: "",
    search: "",
  });

  const [formErrors, setFormErrors] = useState({});
  // const [loading , setLoading] = useState(false);

  // const [formModel, setFormModel] = useState("create"); // create  or update or clone

  // Memoized Config for UniversalFormModal
  const memoizedConfig = useMemo(() => hotelFormConfig(), []);

  //
  // const normalizeHotelForForm = (hotel) => {
  //   if (!hotel) return null;

  //   const toMultilineText = (value) =>
  //     Array.isArray(value) ? value.filter(Boolean).join("\n") : value || "";

  //   return {
  //     ...hotel,

  //     /* ================= CONTACT ================= */
  //     contact: {
  //       phone: toMultilineText(hotel?.contact?.phone),

  //       email: Array.isArray(hotel?.contact?.email)
  //         ? hotel.contact.email[0] || ""
  //         : hotel?.contact?.email || "",

  //       whatsapp: toMultilineText(hotel?.contact?.whatsapp),

  //       website: Array.isArray(hotel?.contact?.website)
  //         ? hotel.contact.website[0] || ""
  //         : hotel?.contact?.website || "",
  //     },

  //     /* ================= LOCATION ================= */
  //     location: {
  //       country: {
  //         ar: hotel?.location?.country?.ar || "",
  //         en: hotel?.location?.country?.en || "",
  //         code: hotel?.location?.country?.code || "",
  //       },

  //       city: {
  //         ar: hotel?.location?.city?.ar || "",
  //         en: hotel?.location?.city?.en || "",
  //       },

  //       area: hotel?.location?.area || "",

  //       address: {
  //         ar: hotel?.location?.address?.ar || "",
  //         en: hotel?.location?.address?.en || "",
  //       },

  //       coordinates: {
  //         lat: hotel?.location?.coordinates?.lat || "",
  //         lng: hotel?.location?.coordinates?.lng || "",
  //       },
  //     },

  //     /* ================= ARRAYS ================= */
  //     features: Array.isArray(hotel?.facilities)
  //       ? hotel.facilities.reduce((acc, item) => {
  //           if (item) acc[item] = true;
  //           return acc;
  //         }, {})
  //       : {},

  //     // roomTypes: Array.isArray(hotel?.roomTypes)
  //     //   ? hotel.roomTypes.map((r) => r._id || r)
  //     //   : [],

  //     images: hotel?.images || [],
  //   };
  // };

  //fetch hotels
  useEffect(() => {
    // 1. تنظيف الفلاتر - إزالة الفارغة
    const filteredEntries = Object.entries(filters).filter(
      ([_, v]) => v !== "",
    ); // ← احتفظ فقط بقيم غير فارغة
    // 2. تحويل إلى كائن
    const filteredObject = Object.fromEntries(filteredEntries);
    // 3. إنشاء Query String
    const query = new URLSearchParams(filteredObject);
    // 4. إضافة معاملات الصفحة
    query.append("page", pagination.page);
    query.append("limit", pagination.limit);
    // 5. إرسال الطلب

    dispatch(fetchHotels(query));
  }, [filters, pagination.page, pagination.limit, dispatch]);

  /* ================================
     Modal Handlers  
  ================================= */
  const openCreateModal = () => {
    setFormMode("create");
    setCurrentHotel(null); // تنظيف البيانات الحالية
    setShowModal(true); // فتح المودال
    setFormErrors({}); // تنظيف الأخطاء
  };
  const openEditModal = (hotel) => {
    setFormMode("edit");
    setCurrentHotel(normalizeForForm(hotel, memoizedConfig)); // تجهيز البيانات للفورم
    setShowModal(true);
    setFormErrors({}); // تنظيف الأخطاء
  };
  const openCloneModal = (hotel) => {
    const normalizedHotel = normalizeForForm(hotel, memoizedConfig);

    setFormMode("clone");
    setCurrentHotel({
      ...normalizedHotel,
      _id: null,
      nameAr: `${hotel.nameAr} (نسخة)`,
      nameEn: `${hotel.nameEn} (Copy)`,
    });
    setShowModal(true);
  };

  // دالة الحفظ المحسنة (الأهم)
  const handleSave = createHandleSave({
    dispatch,
    createAction: createHotel,
    updateAction: updateHotel,
    fetchAction: fetchHotels,
    getId: (item) => item._id,
    formConfig: memoizedConfig,

    toast,
    lang,
    closeModal: () => setShowModal(false),
    resetItem: () => setCurrentHotel(null),
    resetMode: () => setFormMode("create"),
    setLoading: setLoadingSave,

    // setLoading,
    setFormErrors,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteHotel(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");

      dispatch(fetchHotels());
    } catch (err) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  const cancellationPolicy = (() => {
    const days = currentHotel?.policies?.cancellationDays;
    if (days === 0) return lang === "ar" ? "إلغاء مجاني" : "Free Cancellation";
    if (typeof days === "number")
      return `${days} ${
        lang === "ar" ? "أيام قبل الوصول" : "days before arrival"
      }`;
    return lang === "ar" ? "غير محددة" : "Not specified";
  })();

  return (
    <div className="container py-2">
      {/* Header */}
      <PageHeader
        // titleAr="إدارة الفنادق"
        // titleEn="Hotels Management"
        subtitleAr="إدارة كاملة للفنادق، المرافق، أنواع الغرف والسياسات"
        subtitleEn="Full management of hotels, facilities, room types and policies"
      />
      {/* Action Buttons Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Action Buttons */}
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
            <ActionButton
              size="md"
              action="add"
              label={lang === "ar" ? "إضافة فندق جديد" : "Add New Hotel"}
              onClick={openCreateModal}
            />
            <Link to="/admin/room-types">
              <ActionButton
                size="md"
                action="edit"
                label={
                  lang === "ar" ? "إدارة أنواع الغرف" : "Manage Room Types"
                }
              />
            </Link>
          </div>
        </div>
        <ExportTableButtons />
      </div>
      <LoadingOverlay show={loading} />
      {/* <ErrorOverlay show={!!error} message={error} /> */}
      {/* filters */}
      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",
            col: 3,
            placeholder:
              lang === "ar" ? "ابحث باسم الفندق" : "Search by hotel name",
          },
          hotelType: {
            type: "select",
            col: 2,
            placeholder: lang === "ar" ? "اختر النوع" : "Select Type",
            options: [
              { value: "hotel", labelAr: "فندق", labelEn: "Hotel" },
              { value: "resort", labelAr: "منتجع", labelEn: "Resort" },
              { value: "apartment", labelAr: "شقق", labelEn: "Apartment" },
              { value: "hostel", labelAr: "هوستل", labelEn: "Hostel" },
              { value: "villa", labelAr: "فيلا", labelEn: "Villa" },
            ],
          },
          country: {
            col: 2,
            type: "select",
            placeholder: lang === "ar" ? "اختر الدولة" : "Select Country",
            options: (() => {
              const countriesMap = new Map();
              hotels.forEach((h) => {
                const en = h.location?.country?.en;
                const ar = h.location?.country?.ar;
                if (en && ar) {
                  countriesMap.set(en, ar);
                }
              });
              return [
                { value: "", labelAr: "الكل", labelEn: "All" },
                ...Array.from(countriesMap).map(([en, ar]) => ({
                  value: en,
                  labelAr: ar,
                  labelEn: en,
                })),
              ];
            })(),
          },
          city: {
            type: "select",
            col: 2,
            placeholder: lang === "ar" ? "اختر المدينة" : "Select City",
            options: (() => {
              const citiesMap = new Map();
              hotels.forEach((h) => {
                const en = h.location?.city?.en;
                const ar = h.location?.city?.ar;
                if (en && ar) {
                  citiesMap.set(en, ar);
                }
              });
              return [
                { value: "", labelAr: "الكل", labelEn: "All" },
                ...Array.from(citiesMap).map(([en, ar]) => ({
                  value: en,
                  labelAr: ar,
                  labelEn: en,
                })),
              ];
            })(),
          },
          isActive: {
            type: "select",
            col: 2,
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
        // onSave={handleSave}
        onSave={(data) =>
          handleSave(data, {
            formMode: formMode, // ← مهم جداً
            currentItem: currentHotel, // ← مهم جداً
          })
        }
        config={memoizedConfig}
        initialData={currentHotel}
        titleAr={
          formMode === "edit"
            ? lang === "ar"
              ? "تعديل الفندق"
              : "Edit Hotel"
            : lang === "ar"
              ? "إضافة فندق جديد"
              : "Add New Hotel"
        }
        titleEn={
          formMode === "edit"
            ? lang === "ar"
              ? "Edit Hotel"
              : "Edit Hotel"
            : lang === "ar"
              ? "Add New Hotel"
              : "Add New Hotel"
        }
        errors={formErrors}
        loading={loadingSave}
        // resetForm={formMode === "create" ? null : currentHotel} // إعادة تعيين النموذج بعد الحفظ في حالة الإنشاء
      />
      {/* detailse */}
      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={
          currentHotel
            ? lang === "ar"
              ? currentHotel.nameAr
              : currentHotel.nameEn
            : ""
        }
        images={currentHotel?.images || []}
        fields={[
          // 1. Basic Info
          {
            label: lang === "ar" ? "الاسم" : "Name",
            value: currentHotel
              ? lang === "ar"
                ? currentHotel.nameAr
                : currentHotel.nameEn
              : "",
          },
          {
            label: lang === "ar" ? "الوصف" : "Description",
            value: currentHotel
              ? lang === "ar"
                ? currentHotel.descriptionAr
                : currentHotel.descriptionEn
              : "",
          },
          {
            label: lang === "ar" ? "العنوان" : "Address",
            value: currentHotel
              ? lang === "ar"
                ? currentHotel.addressAr
                : currentHotel.addressEn
              : "",
          },
          {
            label: lang === "ar" ? "البريد الإلكتروني" : "Email",
            value: currentHotel?.email || "",
          },
          {
            label: lang === "ar" ? "رقم الهاتف" : "Phone Number",
            value: currentHotel?.phone || "",
          },
          {
            label: lang === "ar" ? "الموقع على الخريطة" : "Location on Map",
            value: currentHotel?.googleMapsLink ? (
              <a
                href={currentHotel.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {lang === "ar" ? "عرض على جوجل مابس" : "View on Google Maps"}
              </a>
            ) : (
              ""
            ),
          },
          {
            label: lang === "ar" ? "سياسة الإلغاء" : "Cancellation Policy",
            value: cancellationPolicy,
          },
          {
            label: lang === "ar" ? "النوع" : "Type",
            value: currentHotel?.hotelType
              ? currentHotel.hotelType.toUpperCase()
              : "",
          },
          {
            label: lang === "ar" ? "عدد النجوم" : "Stars",
            value: currentHotel?.stars || "",
          },
          // 2. Location
          {
            label: lang === "ar" ? "الدولة" : "Country",
            value: currentHotel?.location?.country
              ? lang === "ar"
                ? currentHotel.location.country.ar
                : currentHotel.location.country.en
              : "",
          },
          {
            label: lang === "ar" ? "المدينة" : "City",
            value: currentHotel?.location?.city
              ? lang === "ar"
                ? currentHotel.location.city.ar
                : currentHotel.location.city.en
              : "",
          },
          // 3. Facilities
          {
            label: lang === "ar" ? "المرافق" : "Facilities",
            value: currentHotel?.facilities
              ? Array.isArray(currentHotel.facilities)
                ? currentHotel.facilities.join(", ")
                : typeof currentHotel.facilities === "string"
                  ? currentHotel.facilities
                  : ""
              : "",
          },
          // 4. Room Types
          {
            label: lang === "ar" ? "أنواع الغرف" : "Room Types",
            value: currentHotel?.roomTypes
              ? Array.isArray(currentHotel.roomTypes)
                ? currentHotel.roomTypes
                    .map((rt) => (lang === "ar" ? rt.nameAr : rt.nameEn))
                    .join(", ")
                : ""
              : "",
          },
          //created by and created at
          {
            label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",
            value: currentHotel
              ? new Date(currentHotel.createdAt).toLocaleDateString(lang)
              : "",
          },
          {
            label: lang === "ar" ? "تم الإنشاء بواسطة" : "Created By",
            value: currentHotel?.createdBy
              ? lang === "ar"
                ? currentHotel.createdBy.nameAr
                : currentHotel.createdBy.nameEn
              : "",
          },
          //attachments

          {
            label: lang === "ar" ? "المرفقات" : "Attachments",
            value: currentHotel?.attachments,
            type: "attachments",
            col: "col-md-12",
          },
        ]}
      />
      {/* Pagination */}

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPaginationPage(newPage))}
        onLimitChange={(newLimit) => {
          dispatch(setPaginationLimit(newLimit));
          dispatch(setPaginationPage(1)); // العودة للصفحة الأولى عند تغيير العدد
        }}
      />

      {/*cards */}
      <UniversalCardsContainer
        items={hotels}
        lang={lang}
        emptyMessageAr="لا توجد فنادق مضافة بعد"
        emptyMessageEn="No hotels added yet"
        // تخصيص البيانات للفنادق
        getImage={(hotel) =>
          hotel.images?.[0] ? formatImagePath(hotel.images[0]) : null
        }
        getTitle={(hotel) => (lang === "ar" ? hotel.nameAr : hotel.nameEn)}
        getSubtitle={(hotel) =>
          lang === "ar" ? hotel.descriptionAr : hotel.descriptionEn
        }

        getBadges={(hotel)=>[
          {
            label: hotel.hotelType?.toUpperCase() || "HOTEL",
      variant: "primary",
          },
          // {
          //   label: lang === "ar" ? "الغرف"  : "Rooms",
          //   variant: "info" ,
          //   as : "link" ,
          //   to: `/admin/hotel/${hotel._id}/rooms`

          // }
        ]}

            // الدوال
        onView={(hotel) => {
          setCurrentHotel(hotel);
          setShowDetails(true);
        }}
        onEdit={openEditModal}
        onDelete={(hotel) =>
          setDeleteModal({
            show: true,
            id: hotel._id,
            name: lang === "ar" ? hotel.nameAr : hotel.nameEn,
          })
        }
        onDuplicate={openCloneModal}
        onNavigate={(hotel)=>
          navigate(`/admin/hotel/${hotel._id}/rooms`)
        }

      />

      {/* Confirm Delete */}
      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "حذف الفندق؟" : "Delete Hotel?"}
        message={
          <span>
            {lang === "ar"
              ? "هل أنت متأكد من حذف الفندق:"
              : "Are you sure you want to delete:"}{" "}
            <strong>{deleteModal.name}</strong>؟
            <br />
            <small className="text-danger">
              {lang === "ar"
                ? "هذا الإجراء لا يمكن التراجع عنه!"
                : "This action cannot be undone!"}
            </small>
          </span>
        }
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />
    </div>
  );
}
