import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  setPaginationLimit,
  setPaginationPage,
  selectHotelItems,
  selectHotelPagination,
  selectHotelListLoading,
  selectHotelError,
} from "../../../redux/hotels/hotelSlice";

import { toast } from "react-toastify";

import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatImagePath } from "../../../Utils/imageUtils";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import PageHeader from "../../../Components/layout/PageHeader";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import { hotelFormConfig } from "../../../Components/common/ModalForms/hotel/hotelFormConfig";

import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import PaginationComponent from "../../../Components/common/Pagination";
import { buildQuery } from "../../../Utils/buildQuery";
import { handleApiError } from "../../../Utils/handleApiError";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import AdminPageActions from "../../../Components/layout/AdminPageActions";

export default function AdminHotelList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar"; // ar أو en

  const hotels = useSelector(selectHotelItems);
  const pagination = useSelector(selectHotelPagination);
  const loading = useSelector(selectHotelListLoading);
  const error = useSelector(selectHotelError);

  const [filters, setFilters] = useState({
    hotelType: "",
    country: "",
    city: "",
    stars: "",
    search: "",
     isActive: "",
  });

  const {
    showModal,
    showDetails,
    currentItem: currentHotel,
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
    prepareForForm: (hotel) => normalizeForForm(hotel, memoizedConfig),
    prepareClone: (hotel, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${hotel.nameAr} (نسخة)`,
      nameEn: `${hotel.nameEn} (Copy)`,
    }),
  });
  const cancellationPolicy = (() => {
    const days = currentHotel?.policies?.cancellationDays;
    if (days === 0) return lang === "ar" ? "إلغاء مجاني" : "Free Cancellation";
    if (typeof days === "number")
      return `${days} ${
        lang === "ar" ? "أيام قبل الوصول" : "days before arrival"
      }`;
    return lang === "ar" ? "غير محددة" : "Not specified";
  })();

  // إنشاء تكوين النموذج مرة واحدة فقط عند تحميل المكون

  const memoizedConfig = useMemo(() => hotelFormConfig(), []);
  const listQuery = useMemo(
    () =>
      buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  // بناءً على الفلاتر الحالية، يتم إنشاء استعلام جديد لجلب البيانات من الخادم.
  const filterConfig = useMemo(() => {
    const countriesMap = new Map(); // new Map عبارة عن هيكل بيانات لتخزين أزواج المفتاح والقيمة، حيث المفتاح هو اسم الدولة باللغة الإنجليزية والقيمة هي اسم الدولة باللغة العربية. هذا يسمح بالوصول السريع إلى أسماء الدول باللغتين عند إنشاء خيارات الفلترة.
    const citiesMap = new Map();

    hotels.forEach((hotel) => {
      const countryEn = hotel.location?.country?.en;
      const countryAr = hotel.location?.country?.ar;

      const cityEn = hotel.location?.city?.en;
      const cityAr = hotel.location?.city?.ar;

      if (countryEn && countryAr) {
        countriesMap.set(countryEn, countryAr);
      }

      if (cityEn && cityAr) {
        citiesMap.set(cityEn, cityAr);
      }
    });

    return {
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
          {
            value: "hotel",
            labelAr: "فندق",
            labelEn: "Hotel",
          },
          {
            value: "resort",
            labelAr: "منتجع",
            labelEn: "Resort",
          },
          {
            value: "apartment",
            labelAr: "شقق",
            labelEn: "Apartment",
          },
          {
            value: "hostel",
            labelAr: "هوستل",
            labelEn: "Hostel",
          },
          {
            value: "villa",
            labelAr: "فيلا",
            labelEn: "Villa",
          },
        ],
      },

      country: {
        type: "select",
        col: 2,
        placeholder: lang === "ar" ? "اختر الدولة" : "Select Country",

        options: [
          ...Array.from(countriesMap).map(([en, ar]) => ({
            value: en,
            labelAr: ar,
            labelEn: en,
          })),
        ],
      },

      city: {
        type: "select",
        col: 2,
        placeholder: lang === "ar" ? "اختر المدينة" : "Select City",

        options: [
          ...Array.from(citiesMap).map(([en, ar]) => ({
            value: en,
            labelAr: ar,
            labelEn: en,
          })),
        ],
      },

      isActive: {
        type: "select",
        col: 2,
        placeholder: lang === "ar" ? "الحالة" : "Status",

        options: [
          {
            value: "true",
            labelAr: "نشط",
            labelEn: "Active",
          },
          {
            value: "false",
            labelAr: "غير نشط",
            labelEn: "Inactive",
          },
        ],
      },
    };
  }, [hotels, lang]);

  // عرض تفاصيل الفندق في نافذة منبثقة
  const detailsFields = useMemo(() => {
    if (!currentHotel) {
      return [];
    }

    const isArabic = lang === "ar";

    return [
      {
        label: isArabic ? "الاسم" : "Name",
        value: isArabic ? currentHotel.nameAr : currentHotel.nameEn,
      },
      {
        label: isArabic ? "الوصف" : "Description",
        value: isArabic
          ? currentHotel.descriptionAr
          : currentHotel.descriptionEn,
      },
      {
        label: isArabic ? "العنوان" : "Address",
        value: isArabic ? currentHotel.addressAr : currentHotel.addressEn,
      },
      {
        label: isArabic ? "البريد الإلكتروني" : "Email",
        value: currentHotel.email || "",
      },
      {
        label: isArabic ? "رقم الهاتف" : "Phone Number",
        value: currentHotel.phone || "",
      },
      {
        label: isArabic ? "سياسة الإلغاء" : "Cancellation Policy",
        value: cancellationPolicy,
      },
      {
        label: isArabic ? "النوع" : "Type",
        value: currentHotel.hotelType?.toUpperCase() || "",
      },
      {
        label: isArabic ? "عدد النجوم" : "Stars",
        value: currentHotel.stars || "",
      },
      {
        label: isArabic ? "الدولة" : "Country",
        value: isArabic
          ? currentHotel.location?.country?.ar
          : currentHotel.location?.country?.en,
      },
      {
        label: isArabic ? "المدينة" : "City",
        value: isArabic
          ? currentHotel.location?.city?.ar
          : currentHotel.location?.city?.en,
      },
      {
        label: isArabic ? "المرافق" : "Facilities",
        value: Array.isArray(currentHotel.facilities)
          ? currentHotel.facilities.join(", ")
          : currentHotel.facilities || "",
      },
      {
        label: isArabic ? "أنواع الغرف" : "Room Types",
        value: Array.isArray(currentHotel.roomTypes)
          ? currentHotel.roomTypes
              .map((roomType) => (isArabic ? roomType.nameAr : roomType.nameEn))
              .filter(Boolean)
              .join(", ")
          : "",
      },
      {
        label: isArabic ? "تاريخ الإنشاء" : "Created At",
        value: currentHotel.createdAt
          ? new Date(currentHotel.createdAt).toLocaleDateString(lang)
          : "",
      },
      {
        label: isArabic ? "تم الإنشاء بواسطة" : "Created By",

        value: currentHotel.createdBy
          ? isArabic
            ? currentHotel.createdBy.nameAr
            : currentHotel.createdBy.nameEn
          : "",
      },
      {
        label: isArabic ? "المرفقات" : "Attachments",
        value: currentHotel.attachments,
        type: "attachments",
        col: "col-md-12",
      },
    ];
  }, [currentHotel, lang, cancellationPolicy]);

  useEffect(() => {
    dispatch(fetchHotels(listQuery));
  }, [dispatch, listQuery]);

  const handleSave = createHandleSave({
    dispatch,
    createAction: createHotel,
    updateAction: updateHotel,
    fetchAction: () => fetchHotels(listQuery),
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
      await dispatch(deleteHotel(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");

      dispatch(fetchHotels(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  return (
    <div className="container-fluid">
      <PageHeader
        titleAr="إدارة الفنادق"
        titleEn="Hotels Management"
        subtitleAr="إدارة كاملة للفنادق، المرافق، أنواع الغرف والسياسات"
        subtitleEn="Full management of hotels, facilities, room types and policies"
        actions={
          <AdminPageActions>
            <ActionButton
              size="md"
              action="add"
              label={lang === "ar" ? "إضافة فندق جديد" : "Add New Hotel"}
              onClick={openCreateModal}
            />
            <Link to="/admin/room-types">
              <ActionButton
                size="md"
                action="manage"
                label={
                  lang === "ar" ? "إدارة أنواع الغرف" : "Manage Room Types"
                }
              />
            </Link>
          </AdminPageActions>
        }
      />

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={filterConfig}
      />

      <UniversalFormModal
        show={showModal}
        onHide={closeForm}
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
      />
      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
        title={
          currentHotel
            ? lang === "ar"
              ? currentHotel.nameAr
              : currentHotel.nameEn
            : ""
        }
        images={currentHotel?.images || []}
        fields={detailsFields}
      />

      <UniversalCardsContainer
        items={hotels}
        lang={lang}
        emptyMessageAr="لا توجد فنادق مضافة بعد"
        emptyMessageEn="No hotels added yet"
        getImage={(hotel) =>
          hotel.images?.[0] ? formatImagePath(hotel.images[0]) : null
        }
        getTitle={(hotel) => (lang === "ar" ? hotel.nameAr : hotel.nameEn)}
        getSubtitle={(hotel) =>
          lang === "ar" ? hotel.descriptionAr : hotel.descriptionEn
        }
        getBadges={(hotel) =>
          [
            hotel.hotelType && {
              key: "type",
              label: hotel.hotelType.toUpperCase(),
            },

            hotel.stars && {
              key: "stars",
              label: `${hotel.stars} ★`,
            },
          ].filter(Boolean)
        }
        getMeta={(hotel) =>
          [
            {
              key: "country",
              label:
                lang === "ar"
                  ? hotel.location?.country?.ar
                  : hotel.location?.country?.en,
            },

            {
              key: "city",
              label:
                lang === "ar"
                  ? hotel.location?.city?.ar
                  : hotel.location?.city?.en,
            },
          ].filter((item) => item.label)
        }
        getIsActive={(hotel) => hotel.isActive ?? true}
        onView={openDetails}
        onEdit={openEditModal}
        onDelete={(hotel) =>
          openDelete(hotel, lang === "ar" ? hotel.nameAr : hotel.nameEn)
        }
        onDuplicate={openCloneModal}
        onNavigate={(hotel) => navigate(`/admin/hotel/${hotel._id}/rooms`)}
        clickable
      />
      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPaginationPage(newPage))}
        onLimitChange={(newLimit) => {
          dispatch(setPaginationLimit(newLimit));
          dispatch(setPaginationPage(1));
        }}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={closeDelete}
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
