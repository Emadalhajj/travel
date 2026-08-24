import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  setPaginationLimit,
  setPaginationPage,
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

  const {
    hotelslist: hotels = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.hotels || {});

  const [filters, setFilters] = useState({
    hotelType: "",
    country: "",
    city: "",
    stars: "",
    search: "",
  });

  const memoizedConfig = useMemo(() => hotelFormConfig(), []);
  const listQuery = useMemo(
    () =>
      buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
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
                action="edit"
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
        fields={[
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

          {
            label: lang === "ar" ? "المرفقات" : "Attachments",
            value: currentHotel?.attachments,
            type: "attachments",
            col: "col-md-12",
          },
        ]}
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
        getBadges={(hotel) => [
          {
            label: hotel.hotelType?.toUpperCase() || "HOTEL",
            variant: "primary",
          },
        ]}
        onView={(hotel) => {
          openDetails(hotel);
        }}
        onEdit={openEditModal}
        onDelete={(hotel) =>
          openDelete(hotel, lang === "ar" ? hotel.nameAr : hotel.nameEn)
        }
        onDuplicate={openCloneModal}
        onNavigate={(hotel) => navigate(`/admin/hotel/${hotel._id}/rooms`)}
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
