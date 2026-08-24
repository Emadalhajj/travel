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
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import TruncatedText from "../../../Components/common/TruncatedText";
import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import PageHeader from "../../../Components/layout/PageHeader";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import { Link } from "react-router-dom";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import EntityFilter from "../../../Components/common/EntityFilter";
import PaginationComponent from "../../../Components/common/Pagination";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import { roomTypeFormConfig } from "../../../Components/common/ModalForms/hotel/roomTypeFormConfig";
import { fetchHotels } from "../../../redux/hotels/hotelSlice";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import { handleApiError } from "../../../Utils/handleApiError";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";

export default function AdminRoomTypeList() {
  const dispatch = useDispatch();
  const {
    roomTypesList = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.roomTypes || {});
  const { hotelslist: hotels = [] } = useSelector(
    (state) => state.hotels || {},
  );

  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";


  const [filters, setFilters] = useState({
    search: "",
    bedType: "",
    isActive: "",
    sort: "", // مهم: يجب أن يأخذ قيم مثل "basePrice_desc"
  });

  const memoizedConfig = useMemo(() => roomTypeFormConfig(hotels), [hotels]);
  const listQuery = useMemo(
    () => buildQuery(filters, { page: pagination.page, limit: pagination.limit }),
    [filters, pagination.page, pagination.limit],
  );
  const prepareRoomType = (roomType) => ({
    ...normalizeForForm(roomType, memoizedConfig),
    hotel:
      typeof roomType.hotel === "object"
        ? roomType.hotel?._id
        : roomType.hotel,
  });
  const {
    showModal,
    showDetails,
    currentItem: currentTypeRoom,
    formMode: formModel,
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
    prepareForForm: prepareRoomType,
    prepareClone: (roomType, normalized) => ({
      ...normalized,
      _id: null,
      nameAr: `${roomType.nameAr} (نسخة)`,
      nameEn: `${roomType.nameEn} (Copy)`,
    }),
  });
  useEffect(() => {
    dispatch(fetchRoomTypes(listQuery));
  }, [dispatch, listQuery]);
  useEffect(() => {
    dispatch(fetchHotels({ page: 1, limit: 1000 }));
  }, [dispatch]);
  const handleSave = createHandleSave({
    dispatch,
    createAction: createRoomType,
    updateAction: updateRoomType,
    fetchAction: () => fetchRoomTypes(listQuery),
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
      await dispatch(deleteRoomType(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchRoomTypes(listQuery));
    } catch (err) {
      toast.error(handleApiError(err, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };
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
      exportImageAccessor: "images",
      pdfWidth: 52,
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    {
      header: lang === "ar" ? "الاسم" : "Name",
      align: "center",
      accessor: ["nameAr", "nameEn"], // ← مصفوفة: [عربي, إنجليزي]
      width: "200px",
    },
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
    {
      header: lang === "ar" ? "الفندق" : "hotel",
      accessor: ["hotel.nameAr", "hotel.nameEn"],
    },
    {
      header: lang === "ar" ? "نوع الغرفة" : "room Type",
      accessor: "bedType",
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      width: "250px",
      render: (row) => {
        const pricing = row.pricing || {};
        const basePrice = pricing.basePrice || 0;
        const currency = pricing.currency || "SAR";
        const periods = pricing.pricingPeriods || [];

        return (
          <div className="text-center">
            <div className="fw-bold text-success">
              <small className="text-muted gap-2">
                {lang === "ar" ? " الأساسي : " : "Base : "}
              </small>
              {basePrice} {currency}{" "}
            </div>

            {periods.length > 0 && (
              <div className="small">
                <span className="mb-1 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  {lang === "ar"
                    ? ` ${periods.length} فترة خاصة `
                    : `${periods.length} special periods`}
                </span>
                <div className="text-sm text-slate-500">
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
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <StatusBadge
          type="user"
          value={row.isActive ? "active" : "inactive"}
          isArabic={lang === "ar"}
        />
      ),
    },
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
              openDetails(row);
            }}
          />
          <ActionButton
            action="delete"
            onClick={() =>
              openDelete(row, lang === "ar" ? row.nameAr : row.nameEn)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-2">
      <PageHeader
        titleAr="إدارة أنواع الغرف"
        titleEn="Room Types Management"
        subtitleAr="إدارة لانواع الغرف، المرافق، أنواع الغرف والسياسات"
        subtitleEn="Full management of Room Type , facilities, room types and policies"
        actions={
          <AdminPageActions>
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
            <ExportTableButtons
              data={roomTypesList}
              columns={columns}
              lang={lang}
              fileName="RoomType List"
              title={lang === "ar" ? "قائمة الغرف" : "RoomType List"}
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
        onHide={closeForm}
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
        onHide={closeDetails}
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
          {
            label: lang === "ar" ? "المرافق" : "Amenities",
            value: currentTypeRoom?.amenities?.length
              ? currentTypeRoom.amenities.join("، ")
              : "لا توجد مرافق",
          },
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
          ...(currentTypeRoom?.pricing?.pricingPeriods?.length
            ? currentTypeRoom.pricing.pricingPeriods.map((period, idx) => ({
                label:
                  lang === "ar"
                    ? `فترة تسعير ${idx + 1}: ${period.nameAr}`
                    : `Pricing Period ${idx + 1}: ${period.nameEn}`,
                value: `${period.price} ${currentTypeRoom.pricing.currency} (${period.periodType})`,
              }))
            : []),
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
          {
            label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",
            value: currentTypeRoom?.createdAt
              ? new Date(currentTypeRoom.createdAt).toLocaleString(
                  lang === "ar" ? "en-US" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تاريخ التحديث" : "Updated At",
            value: currentTypeRoom?.updatedAt
              ? new Date(currentTypeRoom.updatedAt).toLocaleString(
                  lang === "ar" ? "en-US" : "en-US",
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
          },
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

      <UniversalTable
        columns={columns}
        data={roomTypesList}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا توجد بيانات" : "No data found"}
      />
      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={closeDelete}
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
