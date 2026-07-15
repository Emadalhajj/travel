import React, { useEffect, useMemo, useState } from "react";
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
} from "../../../redux/hotels/roomtypeSlice";
import { fetchHotels } from "../../../redux/hotels/hotelSlice";

import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// ==================== Utils ====================
import { formatImagePath } from "../../../Utils/imageUtils";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";

// ==================== Components ====================
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import PaginationComponent from "../../../Components/common/Pagination";

// ==================== Form Config ====================
import { roomTypeFormConfig } from "../../../Components/common/ModalForms/hotel/roomTypeFormConfig";

export default function AdminHotelRooms() {
  const { hotelId } = useParams(); // ← يأخذ من URL: /admin/hotel/123/rooms
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";

  // ==================== Redux State ====================
  const {
    roomTypesList: rooms = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.roomTypes || {});

  const { hotelslist: hotels = [] } = useSelector(
    (state) => state.hotels || {},
  );

  // ==================== Local State ====================
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

  // ==================== Memoized Config ====================
  const memoizedConfig = useMemo(() => roomTypeFormConfig(hotels), [hotels]);

  // ==================== Fetch Data ====================
  useEffect(() => {
    if (!hotelId) return;

    dispatch(fetchRoomByHotelId(hotelId));
    dispatch(fetchHotels({ page: 1, limit: 1000 }));
  }, [hotelId, dispatch]);

  // ==================== Modal Handlers ====================
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

  // ==================== Save Handler ====================
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

  // ==================== Delete Handler ====================
  const confirmDelete = async () => {
    try {
      await dispatch(deleteRoomType(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchRoomByHotelId(hotelId));
    } catch (err) {
      toast.error(
        err?.message || (lang === "ar" ? "حدث خطأ" : "Error occurred"),
      );
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  // ==================== Hotel Info ====================
  const hotel = rooms?.[0]?.hotel;

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

  // ==================== Details Fields ====================
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

  // ==================== Render ====================
  return (
    <div className="container py-2">
      {/* Header */}
      <PageHeader
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
      />

      {/* Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
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
          </div>
        </div>
      </div>

      <LoadingOverlay show={loading} />

      {/* Filters */}
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
              // {
              //   value: "nameAr_asc",
              //   labelAr: "الاسم (أ-ي)",
              //   labelEn: "Name (A-Z)",
              // },
            ],
          },
          // order: {},
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

      {/* Form Modal */}
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

      {/* Details Modal */}
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

      {/* Pagination */}
      <PaginationComponent
        total={totalFilteredRooms}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={totalFilteredPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
      />

      {/* Cards */}
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

      {/* Confirm Delete */}
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

// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   deleteRoomType,
//   fetchRoomByHotelId,
//   updateRoomType,
// } from "../../../redux/hotels/roomtypeSlice";
// import {
//   Bath,
//   Bed,
//   ImageIcon,
//   MapPin,
//   Ruler,
//   Users,
//   Utensils,
// } from "lucide-react";
// import { Badge, Image } from "react-bootstrap";
// import { formatImagePath } from "../../../Utils/imageUtils";
// import { useTranslation } from "react-i18next";
// import { motion } from "framer-motion";
// import TruncatedText from "../../../Components/common/TruncatedText";
// import Home from "../../client/Home";
// import UniversalCard from "../../../Components/common/cards/UniversalCard";
// import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
// import ConfirmDialog from "../../../Components/common/ConfirmModal";
// import { RoomTypeModalForm } from "../../../Components/common/ModalForms/hotel/RoomTypeModalForm";
// import { toast } from "react-toastify";

// const AdminHotelRooms = () => {
//   const { hotelId } = useParams();
//   const dispatch = useDispatch();
//   const { t, i18n } = useTranslation();
//   const lang = i18n.language || "ar"; // ar أو en
//   const [showModal, setShowModal] = useState(false);
//   const [showDetails, setShowDetails] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [selectedRoomType, setSelectedRoomType] = useState(null);

//   const { roomTypes: rooms = [], loading } = useSelector(
//     (state) => state.roomTypes || {}
//   );
//   console.log("rooms rooms", rooms);

//   const [deleteModal, setDeleteModal] = useState({
//     show: false,
//     id: null,
//     name: "",
//   });
//   // عند الغاء التعديل
//   const handleCancel = () => {
//     // إلغاء التعديل
//     setSelectedRoomType(null);
//     setIsEditing(false); // ← هنا إعادة تعيين حالة التعديل
//     setShowModal(false);
//   };
//   useEffect(() => {
//     if (!showModal) {
//       // المودال اتقفل بأي طريقة → نعيد كل حاجة للإضافة
//       handleCancel();
//     }
//   }, [showModal]);

//   useEffect(() => {
//     if (!hotelId) return;
//     dispatch(fetchRoomByHotelId(hotelId));
//   }, [dispatch, hotelId]);

//   if (loading) {
//     return <div className="text-center py-5">جاري تحميل الغرف...</div>;
//   }

//   if (!rooms.length) {
//     return (
//       <div className="text-center py-5 text-muted">
//         لا توجد غرف مرتبطة بهذا الفندق
//       </div>
//     );
//   }
//   // handle rooms edit

//   const handleEditClick = (room) => {
//     setSelectedRoomType(room); // 🔥 هذا هو المفتاح
//     setIsEditing(true);
//     setShowModal(true);
//   };

//   //delete

//   const handleDeleteClick = (id, name) => {
//     setDeleteModal({
//       show: true,
//       id,
//       name: name || "هذا النوع",
//     });
//   };
//   // عند التأكيد على الحذف
//   const confirmDelete = () => {
//     dispatch(deleteRoomType(deleteModal.id));
//     setDeleteModal({ show: false, id: null, name: "" });
//   };
//   // handle save eited
//   const handleSave = async (formData) => {
//     try {
//       await dispatch(
//         updateRoomType({
//           id: selectedRoomType._id,
//           formData,
//         })
//       ).unwrap();
//       toast.success(
//         lang === "ar" ? "تم التعديل بنجاح" : "Updated successfully"
//       );
//       setShowModal(false);
//       setSelectedRoomType(null);
//       setIsEditing(false);
//     } catch (err) {
//       toast.error(
//         err?.message || (lang === "ar" ? "حدث خطأ" : "An error occurred")
//       );
//     }
//   };
//   const hotel = rooms?.[0]?.hotel;

//   return (
//     <div className="container py-5">
//       {/* العنوان الرئيسي */}
//       <motion.h2
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="text-center mb-5 fw-bold text-primary display-6"
//       ></motion.h2>

//       {/* شبكة الكروت */}
//       <div className="container mx-auto py-10 px-4">
//         <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
//           {hotel && (
//             <h2>
//               {lang === "ar"
//                 ? `أنواع الغرف المتاحة في فندق ${hotel.nameAr}`
//                 : `Available Room Types in ${hotel.nameEn} hotel`}
//             </h2>
//           )}
//         </h2>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//           {rooms.map((room) => (
//             <UniversalCard
//               key={room._id}
//               title={lang === "ar" ? room.nameAr : room.nameEn}
//               subtitle={lang === "ar" ? room.descriptionAr : room.descriptionEn}
//               image={
//                 room.images?.[0]
//                   ? formatImagePath(room.images[0].url || room.images[0])
//                   : null
//               }
//               isActive={room.isActive}
//               price={room.pricing?.basePrice}
//               discountPercent={room.pricing?.discountPercent || 0}
//               badges={[{ label: room.bedType?.toUpperCase() || "DOUBLE" }]}
//               meta={[
//                 {
//                   icon: <Users size={20} />,
//                   label: `${room.capacity?.maxAdults || 2} + ${
//                     room.capacity?.maxChildren || 0
//                   } أشخاص`,
//                 },
//                 {
//                   icon: <Ruler size={20} />,
//                   label: room.size ? `${room.size} م²` : "غير محدد",
//                 },
//                 { icon: <Bath size={20} />, label: "حمام خاص" },
//               ]}
//               onView={() => {
//                 setSelectedRoomType(room);
//                 setShowDetails(true);
//               }}
//               onEdit={() => handleEditClick(room)}
//               onDelete={() =>
//                 handleDeleteClick(room._id, room.nameAr || room.nameEn)
//               }
//             />
//           ))}
//         </div>
//       </div>
//       {/* Modal Form */}
//       <RoomTypeModalForm
//         show={showModal}
//         onHide={handleCancel}
//         title={
//           isEditing
//             ? lang === "ar"
//               ? "تعديل نوع الغرفة"
//               : "Edit Room Type"
//             : lang === "ar"
//             ? "إضافة نوع غرفة جديد"
//             : "Add New Room Type"
//         }
//         initialData={selectedRoomType}
//         onSubmit={handleSave}
//         submitLabel={
//           isEditing
//             ? lang === "ar"
//               ? "حفظ التعديلات"
//               : "Save Changes"
//             : lang === "ar"
//             ? "إضافة الغرفة"
//             : "Add Room Type"
//         }
//         onCancel={handleCancel}
//       />
//       <ConfirmDialog
//         show={deleteModal.show}
//         onHide={() => setDeleteModal({ show: false, id: null, name: "" })}
//         onConfirm={confirmDelete}
//         title={lang === "ar" ? "حذف نوع الغرفة؟" : "Delete Room Type?"}
//         message={
//           <span>
//             {lang === "ar"
//               ? `هل أنت متأكد من حذف نوع الغرفة: `
//               : `Are you sure you want to delete the room type: `}
//             <strong>{deleteModal.name}</strong>
//             <br />
//             <small className="text-danger">
//               {lang === "ar"
//                 ? "لا يمكن استرجاعه بعد الحذف!"
//                 : "This action cannot be undone!"}
//             </small>
//           </span>
//         }
//         confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
//         cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
//         variant="delete"
//       />
//       <EntityDetailsModal
//         show={showDetails}
//         onHide={() => setShowDetails(false)}
//         title={lang === "ar" ? "عرض التفاصيل" : "Room details show"}
//         images={selectedRoomType?.images || []}
//         fields={[
//           {
//             label: lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
//             value: selectedRoomType?.nameAr,
//           },
//           {
//             label: lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
//             value: selectedRoomType?.nameEn,
//           },
//           {
//             label: lang === "ar" ? " السعر الاساسي" : "Base Price ",
//             value: `${selectedRoomType?.pricing?.basePrice} ر.س`,
//           },
//           {
//             label: lang === "ar" ? "سعر نهاية الاسبوع" : "weekEnd Price",
//             value: `${selectedRoomType?.pricing?.weekendPrice} ر.س`,
//           },
//           {
//             label: lang === "ar" ? "السعة" : "Capacity",
//             value: `${selectedRoomType?.capacity?.maxAdults} + ${selectedRoomType?.capacity?.maxChildren}`,
//           },
//           {
//             label: lang === "ar" ? "نوع السرير" : "Bed Type",
//             value: selectedRoomType?.bedType,
//           },
//           {
//             label: lang === "ar" ? "الوصف" : "Description",
//             value:
//               lang === "ar"
//                 ? selectedRoomType?.descriptionAr
//                 : selectedRoomType?.descriptionEn,
//             col: "col-12",
//           },

//           {
//             label: lang === "ar" ? "المقاس" : "size",
//             value: selectedRoomType?.size,
//             // col: "col-12",
//           },
//           {
//             label: lang === "ar" ? "الحالة" : "Status",
//             value: selectedRoomType?.isActive ? (
//               <Badge bg="success" className="fs-6">
//                 {lang === "ar" ? "نشط" : "Active"}
//               </Badge>
//             ) : (
//               <Badge bg="secondary" className="fs-6">
//                 {lang === "ar" ? "غير نشط" : "Inactive"}
//               </Badge>
//             ),
//           },
//           {
//             label: lang === "ar" ? "الوجبات" : "meals",
//             value: `${selectedRoomType?.mealPlane}`,
//           },
//           {
//             label: lang === "ar" ? "المرافقين" : "Amenities",
//             value: `${selectedRoomType?.amenities} `,
//           },
//         ]}
//       />
//     </div>
//   );
// };

// export default AdminHotelRooms;
