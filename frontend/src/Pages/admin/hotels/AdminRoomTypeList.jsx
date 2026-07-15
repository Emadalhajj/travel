import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  setPage,
  setLimit,
} from "../../../redux/hotels/roomtypeSlice";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Bed,
  Users,
  DollarSign,
  Image as ImageIcon,
  Ruler,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatImagePath } from "../../../Utils/imageUtils";

import {
  Table,
  Button,
  Spinner,
  Alert,
  Image,
  Badge,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { RoomTypeModalForm } from "../../../Components/common/ModalForms/hotel/RoomTypeModalForm";
import { useTranslation } from "react-i18next";
import TruncatedText from "../../../Components/common/TruncatedText";
import { hotelFormConfig } from "../../../Components/common/ModalForms/hotel/hotelFormConfig";
import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import PageHeader from "../../../Components/layout/PageHeader";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import { Link } from "react-router-dom";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import EntityFilter from "../../../Components/common/EntityFilter";
import PaginationComponent from "../../../Components/common/Pagination";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
// import UniversalFormModal from "../../../Components/common/ModalForms/UniversalFormModal";

import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalCardsContainer from "../../../Components/common/cards/UniversalCardsContainer";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import { roomTypeFormConfig } from "../../../Components/common/ModalForms/hotel/roomTypeFormConfig";
import { fetchHotels } from "../../../redux/hotels/hotelSlice";

export default function AdminRoomTypeList() {
  const dispatch = useDispatch();
  const {
    roomTypesList = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.roomTypes || {});
  // console.log("roomTypestype room", roomTypes);
  //fetch hotel
  const { hotelslist: hotels = [] } = useSelector(
    (state) => state.hotels || {},
  );

  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";

  //   const defaultTitle =
  //     lang === "ar" ? "إضافة نوع غرفة جديد" : "Add New Room Type";

  const [showModal, setShowModal] = useState(false);
  const [currentTypeRoom, setCurrentTypeRoom] = useState(null);
  const [formModel, setFormModel] = useState("create");
  const [showDetails, setShowDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  const [loadingSave, setLoadingSave] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    bedType: "",
    isActive: "",
    sort: "", // مهم: يجب أن يأخذ قيم مثل "basePrice_desc"
  });

  const [formErrors, setFormErrors] = useState({});
  const memoizedConfig = useMemo(() => roomTypeFormConfig(hotels), [hotels]);
  // ================= fetch ===================
  useEffect(() => {
    //   // 1. تنظيف الفلاتر - إزالة الفارغة
    //  const filteredEntries = Object.entries(filters)
    //  .filter(([_ , v])=> v !== "") // ← احتفظ فقط بقيم غير فارغة
    //    // 2. تحويل إلى كائن
    //    const filteredObject = Object.fromEntries(filteredEntries)
    //      // 3. إنشاء Query String
    //    const query = new URLSearchParams(filteredObject)
    //     // 4. إضافة معاملات الصفحة
    //     query.append("page" , pagination.page)
    //     query.append("limit" , pagination.limit)
    //   // 5. إرسال الطلب
    //   dispatch(fetchRoomTypes(query))
    const query = buildQuery(filters, pagination);
    dispatch(fetchRoomTypes(query));
  }, [filters, dispatch, pagination.page, pagination.limit]);
  //fetch hotel
  useEffect(() => {
    dispatch(fetchHotels({ page: 1, limit: 1000 }));
  }, [dispatch]);
  /* ================================
     Modal Handlers  
  ================================= */
  const openCreateModal = () => {
    setFormModel("create");
    setCurrentTypeRoom(null);
    setShowModal(true);
    setFormErrors({});
  };
  const openEditModal = (roomtyple) => {
    const normalizedRoomType = normalizeForForm(roomtyple, memoizedConfig);
    setFormModel("edit");
    setCurrentTypeRoom({
      ...normalizedRoomType,
      hotel:
        typeof roomtyple.hotel === "object"
          ? roomtyple.hotel?._id
          : roomtyple.hotel,
    });
    setShowModal(true);
    setShowModal(true);
    setFormErrors({});
  };
  const openCloneModal = (roomtyple) => {
    const normalizedRoomType = normalizeForForm(roomtyple, memoizedConfig);

    setFormModel("colne");
    setCurrentTypeRoom({
      ...normalizedRoomType,
      _id: null,
      hotel:
        typeof roomtyple.hotel === "object"
          ? roomtyple.hotel?._id
          : roomtyple.hotel,
      nameAr: `${roomtyple.nameAr} (نخسة)`,
      nameEn: `${roomtyple.nameEn} (نخسة)`,
    });
    setShowModal(true);
  };
  // =============== svaing handle ============
  const handleSave = createHandleSave({
    dispatch,
    createAction: createRoomType,
    updateAction: updateRoomType,
    fetchAction: fetchRoomTypes,
    getId: (item) => item._id,
    formConfig: memoizedConfig,
    toast,
    lang,
    closeModal: () => setShowModal(false),
    resetItem: () => setCurrentTypeRoom(null),
    resetMode: () => setFormModel("create"),
    setLoading: setLoadingSave,
    // setLoading,
    setFormErrors,
  });

  //=========== handle delete ============
  const confirmDelete = async () => {
    try {
      await dispatch(deleteRoomType(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };
  //======== columns table ===========
  const columns = [
    {
      header: lang === "ar" ? "الرقم" : "no",
      align: "center",
      width: "50",
      render: (_, index) => (
        <span className="fw-bold text-muted "> {index + 1}</span>
      ),
    },
    {
      header: lang === "ar" ? "الصور" : "Images",
      align: "center",
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    //names
    {
      header: lang === "ar" ? "الاسم" : "Name",
      align: "center",
      accessor: ["nameAr", "nameEn"], // ← مصفوفة: [عربي, إنجليزي]
      width: "200px",
    },
    // description
    {
      header: lang === "ar" ? "الوصف" : "Description",
      accessor: ["descriptionAr", "descriptionEn"],
      width: "300px", // ← عرض ثابت للعمود
      hidden: true,

      render: (row, idx, lang) => (
        <TruncatedText
          text={lang === "ar" ? row.descriptionAr : row.descriptionEn}
          maxLines={3}
          maxWidth="100%" // ← يملأ العمود
        />
      ),
    },
    //hotels
    {
      header: lang === "ar" ? "الفندق" : "hotel",
      accessor: ["hotel.nameAr", "hotel.nameEn"],
    },
    // room type
    {
      header: lang === "ar" ? "نوع الغرفة" : "room Type",
      accessor: "bedType",
    },
    //prices
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      width: "250px",
      // accessor: "pricing.basePrice", // ← نص عادي (لا يحتاج تعريب)
      render: (row) => {
        const pricing = row.pricing || {};
        const basePrice = pricing.basePrice || 0;
        const currency = pricing.currency || "SAR";
        const periods = pricing.pricingPeriods || [];

        return (
          <div className="text-center">
            {/* السعر الأساسي */}
            <div className="fw-bold text-success">
              <small className="text-muted gap-2">
                {lang === "ar" ? " الأساسي : " : "Base : "}
              </small>
              {basePrice} {currency}{" "}
            </div>
            {/* عدد الفترات الخاصة */}

            {periods.length > 0 && (
              <div className="small">
                <Badge bg="primary" className="mb-1">
                  {lang === "ar"
                    ? ` ${periods.length} فترة خاصة `
                    : `${periods.length} special periods`}
                </Badge>
                <div className="text-muted" style={{ fontSize: "0.95rem" }}>
                  {periods.map((p, i) => (
                    <span key={i}>
                      {i > 0 && " • "}
                      {lang === "ar" ? p.nameAr : p.nameEn}: {p.price}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    // status
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive
            ? lang === "ar"
              ? "نشط"
              : "Active"
            : lang === "ar"
              ? "غير نشط"
              : "Inactive"}
        </Badge>
      ),
    },
    // ─── الإجراءات ───
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
              setCurrentTypeRoom(row);
              setShowDetails(true);
            }}
          />
          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,
                id: row._id,
                name: lang === "ar" ? row.nameAr : row.nameEn,
              })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-2">
      {/* Header */}
      <PageHeader
        subtitleAr="إدارة لانواع الغرف، المرافق، أنواع الغرف والسياسات"
        subtitleEn="Full management of Room Type , facilities, room types and policies"
      />

      {/* Action Buttons Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Action Buttons */}
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
            <ActionButton
              size="md"
              action="add"
              label={lang === "ar" ? "إضافة غرفة" : "Add Room"}
              onClick={openCreateModal}
            />
            <Link to="/admin/hotels">
              <ActionButton
                size="md"
                action="edit"
                label={lang === "ar" ? "إدارة الفنادق" : "Manage Hotels"}
              />
            </Link>
          </div>
        </div>
        <ExportTableButtons
          data={roomTypesList}
          columns={columns}
          lang={lang}
          filename="RoomType List"
          title={lang === "ar" ? "قائمة الغرف" : "RoomType List"}
        />
      </div>
      <LoadingOverlay show={loading} />

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
      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={(data) =>
          handleSave(data, {
            formMode: formModel,
            currentItem: currentTypeRoom,
          })
        }
        config={memoizedConfig}
        initialData={currentTypeRoom}
        titleAr={formModel === "edit" ? "تعديل الغرفة" : "إضافة نوع غرفة جديد"}
        titleEn={formModel === "edit" ? "Edit Room Type" : "Add Room Type"}
        errors={formErrors}
        loading={loadingSave}
      />

      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={
          lang === "ar" ? "عرض التفاصيل نوع الغرفة" : "RoomType details show"
        }
        images={currentTypeRoom?.images || []}
        fields={[
          {
            label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
            value: currentTypeRoom?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name",
            value: currentTypeRoom?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالعربية" : "Arabic Description",
            value: currentTypeRoom?.descriptionAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالإنجليزية" : "English Description",
            value: currentTypeRoom?.descriptionEn || "غير متوفر",
          },
          // ===== السعة =====
          {
            label: lang === "ar" ? "الحد الأقصى للبالغين" : "Max Adults",
            value: currentTypeRoom?.capacity?.maxAdults ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "الحد الأقصى للأطفال" : "Max Children",
            value: currentTypeRoom?.capacity?.maxChildren ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "إجمالي السعة" : "Total Occupancy",
            value: currentTypeRoom?.totalOccupancy ?? "غير متوفر",
          },
          // ===== المساحة ونوع السرير =====
          {
            label: lang === "ar" ? "المساحة (م²)" : "Size (m²)",
            value: currentTypeRoom?.size ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "نوع السرير" : "Bed Type",
            value: currentTypeRoom?.bedType ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "إجمالي الغرف" : "Total Rooms",
            value: currentTypeRoom?.totalRooms ?? "غير متوفر",
          },
          // ===== المرافق =====
          {
            label: lang === "ar" ? "المرافق" : "Amenities",
            value: currentTypeRoom?.amenities?.length
              ? currentTypeRoom.amenities.join("، ")
              : "لا توجد مرافق",
          },
          // ===== التسعير =====
          {
            label: lang === "ar" ? "السعر الأساسي" : "Base Price",
            value: currentTypeRoom?.pricing?.basePrice
              ? `${currentTypeRoom.pricing.basePrice} ${currentTypeRoom.pricing.currency || "SAR"}`
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "العملة" : "Currency",
            value: currentTypeRoom?.pricing?.currency ?? "SAR",
          },
          {
            label: lang === "ar" ? "نسبة الخصم (%)" : "Discount (%)",
            value: currentTypeRoom?.pricing?.discountPercent
              ? `${currentTypeRoom.pricing.discountPercent}%`
              : "0%",
          },
          {
            label: lang === "ar" ? "السعر النهائي" : "Final Price",
            value: currentTypeRoom?.pricing?.finalPrice
              ? `${currentTypeRoom.pricing.finalPrice} ${currentTypeRoom.pricing.currency || "SAR"}`
              : "غير محسوب",
          },
          // ===== فترات التسعير (اختياري - إذا أردت عرضها) =====
          ...(currentTypeRoom?.pricing?.pricingPeriods?.length
            ? currentTypeRoom.pricing.pricingPeriods.map((period, idx) => ({
                label:
                  lang === "ar"
                    ? `فترة تسعير ${idx + 1}: ${period.nameAr}`
                    : `Pricing Period ${idx + 1}: ${period.nameEn}`,
                value: `${period.price} ${currentTypeRoom.pricing.currency} (${period.periodType})`,
              }))
            : []),
          // ===== الوجبات =====
          {
            label: lang === "ar" ? "خطة الوجبات" : "Meal Plan",
            value:
              lang === "ar"
                ? {
                    room_only: "غرفة فقط",
                    breakfast: "إفطار فقط",
                    half_board: "نصف إقامة",
                    full_board: "إقامة كاملة",
                    all_inclusive: "شامل الكل",
                  }[currentTypeRoom?.mealPlan] || "غير متوفر"
                : currentTypeRoom?.mealPlan || "N/A",
          },
          // ===== الحالة =====
          {
            label: lang === "ar" ? "الحالة" : "Status",
            value:
              lang === "ar"
                ? currentTypeRoom?.isActive
                  ? "نشط"
                  : "غير نشط"
                : currentTypeRoom?.isActive
                  ? "Active"
                  : "Inactive",
          },
          // ===== التواريخ =====
          {
            label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",
            value: currentTypeRoom?.createdAt
              ? new Date(currentTypeRoom.createdAt).toLocaleString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تاريخ التحديث" : "Updated At",
            value: currentTypeRoom?.updatedAt
              ? new Date(currentTypeRoom.updatedAt).toLocaleString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تم الإنشاء بواسطة" : "Created By",
            value:
              currentTypeRoom?.createdBy?.nameAr ||
              currentTypeRoom?.createdBy?.nameEn ||
              currentTypeRoom?.createdBy?.name ||
              currentTypeRoom?.createdBy?.username ||
              currentTypeRoom?.createdBy?.email ||
              "غير معروف",
            // إذا كان populated: currentTypeRoom.createdBy.name
            // إذا لم يكن populated: اجلب الاسم من كونترولر أو اعرض ID
          },
          // ===== آخر تعديل =====
          {
            label: lang === "ar" ? "آخر تعديل بواسطة" : "Last Modified By",
            value:
              currentTypeRoom?.updatedBy?.nameAr ||
              currentTypeRoom?.updatedBy?.nameEn ||
              currentTypeRoom?.updatedBy?.name ||
              currentTypeRoom?.updatedBy?.username ||
              currentTypeRoom?.updatedBy?.email ||
              "غير معروف",
          },
        ]}
      />
      {/* Pagination */}

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => {
          dispatch(setLimit(newLimit));
        }}
      />
      {/*Table*/}
      <UniversalTable
        columns={columns}
        data={roomTypesList}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا توجد بيانات" : "No data found"}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "حذف نوع الغرفة؟" : "Delete Room Type?"}
        message={
          <span>
            {lang === "ar"
              ? `هل أنت متأكد من حذف نوع الغرفة: `
              : `Are you sure you want to delete the room type: `}
            <strong>{deleteModal.name}</strong>
            <br />
            <small className="text-danger">
              {lang === "ar"
                ? "لا يمكن استرجاعه بعد الحذف!"
                : "This action cannot be undone!"}
            </small>
          </span>
        }
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="delete"
      />
    </div>
  );
}

/*
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-4 shadow-lg overflow-hidden"
      >
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead
              className="text-white"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <tr>
                <th className="text-center">#</th>
                <th>{lang === "ar" ? "الصور" : "Images"}</th>
                <th>{lang === "ar" ? "الاسم" : "Name"}</th>
                <th>
                  <Bed size={18} /> {lang === "ar" ? "نوع السرير" : "Bed Type"}
                </th>
                <th>
                  <Users size={18} /> {lang === "ar" ? "السعة" : "Capacity"}
                </th>
                <th>
                  <Ruler size={18} /> {lang === "ar" ? "المساحة" : "Size"}
                </th>
                <th>
                  <DollarSign size={18} /> {lang === "ar" ? "السعر" : "Price"}
                </th>
                <th>{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="text-center">
                  {lang === "ar" ? "الإجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {roomTypeslist.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <ImageIcon size={60} className="mb-3 text-secondary" />
                    <p className="mb-0 fs-5">
                      {lang === "ar"
                        ? "لا توجد أنواع غرف مضافة بعد"
                        : "No room types added yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                roomTypeslist.map((r, idx) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <td className="text-center fw-bold">{idx + 1}</td>

                    /* الصور 
                    <td className="text-center">
                      {r.images?.length > 0 ? (
                        <div className="position-relative d-inline-block">
                          <Image
                            src={formatImagePath(r.images[0])}
                            rounded
                            width={80}
                            height={80}
                            style={{ objectFit: "cover" }}
                            className="shadow-sm"
                          />
                          {r.images.length > 1 && (
                            <Badge
                              bg="primary"
                              className="position-absolute top-0 end-0"
                            >
                              +{r.images.length - 1}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div
                          className="bg-light border d-flex align-items-center justify-content-center rounded"
                          style={{ width: 80, height: 80 }}
                        >
                          <ImageIcon size={32} className="text-muted" />
                        </div>
                      )}
                    </td>

                    {/* الاسم 
                    <td>
                      <div className="fw-bold">
                        {lang === "ar" ? r.nameAr : r.nameEn}
                      </div>
                      <TruncatedText
                        text={lang === "ar" ? r.descriptionAr : r.descriptionEn}
                        limit={8}
                      />
                    </td>
                    {/* نوع السرير 
                    <td>
                      <Badge bg="info" className="text-dark">
                        {r.bedType || "Double"}
                      </Badge>
                    </td>

                    {/* السعة 
                    <td>
                      <span className="text-primary fw-bold">
                        {r.capacity?.maxAdults || 2} +{" "}
                        {r.capacity?.maxChildren || 0}
                      </span>
                    </td>

                    {/* المساحة 
                    <td>{r.size ? `${r.size} م²` : "-"}</td>

                    {/* السعر 
                    <td>
                      <span className="fw-bold text-success fs-5">
                        {r.pricing?.basePrice || 0}
                      </span>{" "}
                      ر.س
                    </td>

                    {/* الحالة 
                    <td>
                      <Badge bg={r.isActive ? "success" : "secondary"}>
                        {r.isActive
                          ? lang === "ar"
                            ? "نشط"
                            : "Active"
                          : lang === "ar"
                            ? "معطل"
                            : "Inactive"}
                      </Badge>
                    </td>

                    {/* الإجراءات 
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleShowModal(r)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() =>
                            handleDeleteClick(r._id, r.nameAr || r.nameEn)
                          }
                        >
                          <Trash2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => {
                            setSelectedRoomType(r);
                            setShowDetails(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </motion.div>

*/
