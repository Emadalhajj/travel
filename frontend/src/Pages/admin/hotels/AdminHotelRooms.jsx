import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRoomByHotelId,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  toggleRoomTypeActiveStatus,
  setPage,
  setLimit,
  selectRoomTypeItems,
  selectRoomTypePagination,
  selectRoomTypeListLoading,
  selectRoomTypeError,
} from "../../../redux/hotels/roomtypeSlice";

import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { formatImagePath } from "../../../Utils/imageUtils";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import PaginationComponent from "../../../Components/common/Pagination";

import { roomTypeFormConfig } from "../../../Components/common/ModalForms/hotel/roomTypeFormConfig";
import { handleApiError } from "../../../Utils/handleApiError";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import useAdminLookups from "../../../hooks/admin/useAdminLookups";

const EMPTY_LOOKUP = [];

export default function AdminHotelRooms() {
  const { hotelId } = useParams(); // ← يأخذ من URL: /admin/hotel/123/rooms
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const rooms = useSelector(selectRoomTypeItems);
  const pagination = useSelector(selectRoomTypePagination);
  const loading = useSelector(selectRoomTypeListLoading);
  const error = useSelector(selectRoomTypeError);

  const { lookups, loadHotel } = useAdminLookups();
  const populatedHotel = rooms.find((room) => typeof room.hotel === "object")?.hotel;
  const hotels = useMemo(
    () => populatedHotel ? [populatedHotel] : (lookups[`hotel:${hotelId}`] || EMPTY_LOOKUP),
    [hotelId, lookups, populatedHotel],
  );

  const [showModal, setShowModal] = useState(false);
  const [currentRoomType, setCurrentRoomType] = useState(null);
  const [formMode, setFormMode] = useState("create"); // create | edit | clone
  const [showDetails, setShowDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  const [loadingSave, setLoadingSave] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    bedType: "",
    isActive: "",
    sort: "", // مهم: يجب أن يأخذ قيم مثل "basePrice_desc"
  });

  const memoizedConfig = useMemo(() => roomTypeFormConfig(hotels), [hotels]);

  useEffect(() => {
    if (!hotelId) return;

    dispatch(fetchRoomByHotelId(hotelId));
  }, [hotelId, dispatch]);

  useEffect(() => {
    if (
      hotelId &&
      !populatedHotel &&
      !loading &&
      !lookups[`hotel:${hotelId}`]
    ) {
      loadHotel(hotelId);
    }
  }, [hotelId, populatedHotel, loading, loadHotel, lookups]);

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentRoomType({ hotel: hotelId });
    setShowModal(true);
    setFormErrors({});
  };

  const openEditModal = (room) => {
    const normalized = normalizeForForm(room, memoizedConfig);
    setFormMode("edit");
    setCurrentRoomType({
      ...normalized,
      hotel: typeof room.hotel === "object" ? room.hotel?._id : room.hotel,
    });
    setShowModal(true);
    setFormErrors({});
  };

  const openCloneModal = (room) => {
    const normalized = normalizeForForm(room, memoizedConfig);
    setFormMode("clone");
    setCurrentRoomType({
      ...normalized,
      _id: null,
      hotel: typeof room.hotel === "object" ? room.hotel?._id : room.hotel,
      nameAr: `${room.nameAr} (نسخة)`,
      nameEn: `${room.nameEn} (Copy)`,
    });
    setShowModal(true);
  };

  const handleSave = createHandleSave({
    dispatch,
    createAction: createRoomType,
    updateAction: updateRoomType,
    fetchAction: () => fetchRoomByHotelId(hotelId),
    getId: (item) => item._id,
    formConfig: memoizedConfig,
    toast,
    lang,
    closeModal: () => setShowModal(false),
    resetItem: () => setCurrentRoomType(null),
    resetMode: () => setFormMode("create"),
    setLoading: setLoadingSave,
    setFormErrors,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteRoomType(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchRoomByHotelId(hotelId));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  const hotel =
    rooms?.[0]?.hotel || hotels.find((item) => item._id === hotelId) || null;

  const filteredRooms = useMemo(() => {
    const searchValue = filters.search?.trim().toLowerCase() || "";

    return rooms
      .filter((room) => {
        const matchSearch = searchValue
          ? [room.nameAr, room.nameEn, room.descriptionAr, room.descriptionEn]
              .filter(Boolean)
              .some((field) => field.toLowerCase().includes(searchValue))
          : true;

        const matchBedType = filters.bedType
          ? room.bedType === filters.bedType
          : true;

        const matchActive = filters.isActive
          ? String(room.isActive) === filters.isActive
          : true;

        return matchSearch && matchBedType && matchActive;
      })
      .sort((a, b) => {
        if (!filters.sort) return 0;
        const [field, order] = filters.sort.split("_");
        const aValue =
          field === "pricing.basePrice" ? a.pricing?.basePrice : a[field];
        const bValue =
          field === "pricing.basePrice" ? b.pricing?.basePrice : b[field];

        if (aValue == null || bValue == null) return 0;
        if (order === "asc")
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      });
  }, [rooms, filters]);

  const totalFilteredRooms = filteredRooms.length;
  const totalFilteredPages = Math.max(
    1,
    Math.ceil(totalFilteredRooms / pagination.limit),
  );

  const currentRooms = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredRooms.slice(start, start + pagination.limit);
  }, [filteredRooms, pagination.page, pagination.limit]);

  const getDetailsFields = (room) => [
    {
      label: lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
      value: room?.nameAr,
    },
    {
      label: lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
      value: room?.nameEn,
    },
    {
      label: lang === "ar" ? "الوصف" : "Description",
      value: lang === "ar" ? room?.descriptionAr : room?.descriptionEn,
      col: "col-12",
    },
    {
      label: lang === "ar" ? "السعر الأساسي" : "Base Price",
      value: room?.pricing?.basePrice
        ? `${room.pricing.basePrice} ${room.pricing.currency || "SAR"}`
        : "",
    },
    {
      label: lang === "ar" ? "سعر نهاية الأسبوع" : "Weekend Price",
      value: room?.pricing?.weekendPrice
        ? `${room.pricing.weekendPrice} ${room.pricing.currency || "SAR"}`
        : "",
    },
    {
      label: lang === "ar" ? "نسبة الخصم" : "Discount",
      value: room?.pricing?.discountPercent
        ? `${room.pricing.discountPercent}%`
        : "0%",
    },
    {
      label: lang === "ar" ? "السعة" : "Capacity",
      value: `${room?.capacity?.maxAdults || 0} بالغين + ${room?.capacity?.maxChildren || 0} أطفال`,
    },
    {
      label: lang === "ar" ? "إجمالي السعة" : "Total Occupancy",
      value: room?.totalOccupancy || room?.capacity?.maxOccupancy || "",
    },
    {
      label: lang === "ar" ? "نوع السرير" : "Bed Type",
      value: room?.bedType,
    },
    {
      label: lang === "ar" ? "المساحة" : "Size",
      value: room?.size ? `${room.size} م²` : "",
    },
    {
      label: lang === "ar" ? "إجمالي الغرف" : "Total Rooms",
      value: room?.totalRooms,
    },
    {
      label: lang === "ar" ? "المرافق" : "Amenities",
      value: Array.isArray(room?.amenities) ? room.amenities.join("، ") : "",
    },
    {
      label: lang === "ar" ? "خطة الوجبات" : "Meal Plan",
      value: room?.mealPlan,
    },
    {
      label: lang === "ar" ? "الحالة" : "Status",
      value: room?.isActive
        ? lang === "ar"
          ? "نشط"
          : "Active"
        : lang === "ar"
          ? "غير نشط"
          : "Inactive",
    },
    {
      label: lang === "ar" ? "الفندق" : "Hotel",
      value: lang === "ar" ? room?.hotel?.nameAr : room?.hotel?.nameEn,
    },
    {
      label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",
      value: room?.createdAt
        ? new Date(room.createdAt).toLocaleDateString(lang)
        : "",
    },
    {
      label: lang === "ar" ? "تم الإنشاء بواسطة" : "Created By",
      value: room?.createdBy
        ? lang === "ar"
          ? room.createdBy.nameAr
          : room.createdBy.nameEn
        : "",
    },
    {
      label: lang === "ar" ? "تاريخ التحديث" : "Updated At",
      value: room?.updatedAt
        ? new Date(room.updatedAt).toLocaleDateString(lang)
        : "",
    },
    {
      label: lang === "ar" ? "تم التحديث بواسطة" : "Updated By",
      value: room?.updatedBy
        ? lang === "ar"
          ? room.updatedBy.nameAr
          : room.updatedBy.nameEn
        : "",
    },
  ];

  return (
    <div className="container py-2">
      <PageHeader
        titleAr="أنواع الغرف"
        titleEn="Room Types"
        subtitleAr={
          hotel
            ? `إدارة أنواع الغرف في فندق ${hotel.nameAr}`
            : "إدارة أنواع الغرف"
        }
        subtitleEn={
          hotel
            ? `Manage Room Types in ${hotel.nameEn} Hotel`
            : "Manage Room Types"
        }
        actions={
          <AdminPageActions>
            <ActionButton
              size="md"
              action="add"
              label={lang === "ar" ? "إضافة نوع غرفة" : "Add Room Type"}
              onClick={openCreateModal}
            />
            <ActionButton
              size="md"
              action="back"
              label={lang === "ar" ? "العودة للفنادق" : "Back to Hotels"}
              onClick={() => navigate("/admin/hotels")}
            />
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
          bedType: {
            type: "select",
            col: 3,
            placeholder:
              lang === "ar" ? "ابحث بنوع السرير" : "Search by Bed Type",
            options: [
              { value: "single", labelAr: "فردي", labelEn: "Single" },
              { value: "twin", labelAr: "توأم", labelEn: "Twin" },
              { value: "double", labelAr: "مزدوج", labelEn: "Double" },
              { value: "queen", labelAr: "كوين", labelEn: "Queen" },
              { value: "king", labelAr: "كينج", labelEn: "King" },
              { value: "triple", labelAr: "ثلاثي", labelEn: "Triple" },
              { value: "quad", labelAr: "رباعي", labelEn: "Quad" },
              { value: "quintuple", labelAr: "خماسي", labelEn: "Quintuple" },
              { value: "Hexagonal", labelAr: "سداسية", labelEn: "Quintuple" },
              { value: "Seven", labelAr: "سباعية", labelEn: "Quintuple" },
              { value: "family", labelAr: "عائلي", labelEn: "Family" },
              { value: "suite", labelAr: "جناح", labelEn: "Suite" },
            ],
          },
          sort: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "ترتيب حسب السعر" : "Sort by price",
            customOnChange: (value, setFilters, currentFilters) => {
              setFilters({
                ...currentFilters,
                sort: value,
              });
            },
            options: [
              { value: "", labelAr: "الافتراضي", labelEn: "Default" },
              {
                value: "pricing.basePrice_asc",
                labelAr: "السعر: من الأقل إلى الأعلى",
                labelEn: "Price: Low to High",
              },
              {
                value: "pricing.basePrice_desc",
                labelAr: "السعر: من الأعلى إلى الأقل",
                labelEn: "Price: High to Low",
              },
              {
                value: "createdAt_desc",
                labelAr: "الأحدث أولاً",
                labelEn: "Newest First",
              },
              {
                value: "createdAt_asc",
                labelAr: "الأقدم أولاً",
                labelEn: "Oldest First",
              },
            ],
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
        onSave={(data) =>
          handleSave(data, {
            formMode,
            currentItem: currentRoomType,
          })
        }
        config={memoizedConfig}
        initialData={currentRoomType}
        titleAr={
          formMode === "edit"
            ? lang === "ar"
              ? "تعديل نوع الغرفة"
              : "Edit Room Type"
            : lang === "ar"
              ? "إضافة نوع غرفة جديد"
              : "Add New Room Type"
        }
        titleEn={formMode === "edit" ? "Edit Room Type" : "Add New Room Type"}
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={
          currentRoomType
            ? lang === "ar"
              ? currentRoomType.nameAr
              : currentRoomType.nameEn
            : ""
        }
        images={currentRoomType?.images || []}
        fields={getDetailsFields(currentRoomType)}
      />

      <UniversalCardsContainer
        items={currentRooms}
        lang={lang}
        emptyMessageAr="لا توجد غرف مضافة لهذا الفندق"
        emptyMessageEn="No rooms added for this hotel"
        getImage={(room) =>
          room.images?.[0] ? formatImagePath(room.images[0]) : null
        }
        getTitle={(room) => (lang === "ar" ? room.nameAr : room.nameEn)}
        getSubtitle={(room) =>
          lang === "ar" ? room.descriptionAr : room.descriptionEn
        }
        getBadges={(room) => [
          { label: room.bedType?.toUpperCase() || "ROOM" },
          {
            label: room.isActive
              ? lang === "ar"
                ? "نشط"
                : "ACTIVE"
              : lang === "ar"
                ? "غير نشط"
                : "INACTIVE",
            variant: room.isActive ? "success" : "secondary",
          },
        ]}
        getMeta={(room) => [
          {
            icon: "users",
            label: `${room.capacity?.maxAdults || 0}+${room.capacity?.maxChildren || 0}`,
          },
          {
            icon: "ruler",
            label: room.size ? `${room.size}m²` : "",
          },
          {
            icon: "bed",
            label: `${room.totalRooms || 0} ${lang === "ar" ? "غرفة" : "rooms"}`,
          },
        ]}
        getPrice={(room) => room.pricing?.basePrice}
        getCurrency={(room) => room.pricing?.currency || "SAR"}
        getDiscountPercent={(room) => room.pricing?.discountPercent || 0}
        onView={(room) => {
          setCurrentRoomType(room);
          setShowDetails(true);
        }}
        onEdit={openEditModal}
        onDelete={(room) =>
          setDeleteModal({
            show: true,
            id: room._id,
            name: lang === "ar" ? room.nameAr : room.nameEn,
          })
        }
        onDuplicate={openCloneModal}
        onToggleStatus={(room) =>
          dispatch(toggleRoomTypeActiveStatus(room._id))
        }
      />
      <PaginationComponent
        total={totalFilteredRooms}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={totalFilteredPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "حذف نوع الغرفة؟" : "Delete Room Type?"}
        message={
          <span>
            {lang === "ar"
              ? "هل أنت متأكد من حذف:"
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
