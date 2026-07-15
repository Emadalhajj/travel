import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import { formatImagePath } from "../../../Utils/imageUtils";
import { Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import TruncatedText from "../../../Components/common/TruncatedText";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import { cardShadow, flexBetween, flexCenter } from "../../../Utils/classes";
import PageHeader from "../../../Components/layout/PageHeader";
import {
  createNewTrip,
  deleteTrip,
  fetchTrips,
  updateExitingTrip,
} from "../../../redux/transports/tripSlice";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import { tripFormConfig } from "../../../Components/common/ModalForms/transport/tripFormConfig";
import { fetchTransports } from "../../../redux/transports/transportSlice";
import EntityFilter from "../../../Components/common/EntityFilter";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import { normalizeForForm } from "../../../Utils/formData/normalize";

export default function TransportTrips() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const { loading, tripList = [], error } = useSelector((state) => state.trip);
  const { transportList = [] } = useSelector((state) => state.transport);

  const [showModal, setShowModal] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
//الحفاظ على المدخلات الحالية في حال كان هناك خطا بالادخال
  const memoizedTripConfig = useMemo(
    () => tripFormConfig(transportList),
    [transportList],
  );
  const [showDetails, setShowDetails] = useState(false);
  const [formModel, setFormModel] = useState("create"); // create  or update or clone
  //delete
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  //filters
  const [filters, setFilters] = useState({
    search: "",
    tripType: "",
    fromCity: "",
    toCity: "",
    isActive: "", // "" = الكل، "true" = نشط، "false" = غير نشط
  });
  /* ================================
     Helpers
  ================================= */

  //تحويل قبل تمريرها للفورم iamges
  const normalizeImagesForForm = (images = []) =>
    images.map((img) => ({
      url: typeof img === "string" ? img : img.url,
      preview: formatImagePath(typeof img === "string" ? img : img.url),
      file: null, // صورة قديمة
      isOld: true,
    }));
  /* ================================
     Modal Handlers
  ================================= */
  // أضف هذه الدالة المساعدة
  // const normalizeTripForForm = (trip) => {
  //   if (!trip) return null;

  //   const normalized = { ...trip };

  //   // 1. التاريخ (يتعامل مع كل الصيغ الممكنة)
  //   if (trip.startDate) {
  //     const date =
  //       typeof trip.startDate === "string"
  //         ? trip.startDate
  //         : trip.startDate.$date || trip.startDate.toISOString?.();
  //     normalized.startDate = date
  //       ? new Date(date).toISOString().split("T")[0]
  //       : "";
  //   }

  //   if (trip.endDate) {
  //     const date =
  //       typeof trip.endDate === "string"
  //         ? trip.endDate
  //         : trip.endDate.$date || trip.endDate.toISOString?.();
  //     normalized.endDate = date
  //       ? new Date(date).toISOString().split("T")[0]
  //       : "";
  //   }

  //   // 2. الوقت (دقائق → HH:MM)
  //   if (typeof trip.startTime === "number" && !isNaN(trip.startTime)) {
  //     const h = Math.floor(trip.startTime / 60)
  //       .toString()
  //       .padStart(2, "0");
  //     const m = (trip.startTime % 60).toString().padStart(2, "0");
  //     normalized.startTime = `${h}:${m}`;
  //   }
  //   // ← التعديل الجديد لـ vehicleType: تأكد أنها string نظيفة
  //   if (trip.vehicleType) {
  //     normalized.vehicleType =
  //       typeof trip.vehicleType === "object"
  //         ? trip.vehicleType._id?.toString() || ""
  //         : trip.vehicleType?.toString() || "";
  //   }

  //   // 3. الصور
  //   normalized.images = normalizeImagesForForm(trip.images || []);

  //   return normalized;
  // };
  // open createmodel
  const openCreateModal = () => {
    setFormModel("create");
    setCurrentTrip(null);
    setShowModal(true);
  };

  //open update
  const openUpdateModal = (trip) => {
    setFormModel("update");
    setShowModal(true);
    setCurrentTrip(normalizeForForm(trip));
  };
  //openclone
  const openCloneModal = (trip) => {
    setFormModel("clone");
    setShowModal(true);
    setCurrentTrip({
      ...normalizeForForm(trip),
      nameAr: `${trip.nameAr} (نسخة)`,
      nameEn: `${trip.nameEn} (Copy)`,
    });
  };
  /* ================================
     API Calls
  ================================= */

  //useEffect
  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  //getAllVehicles
  useEffect(() => {
    dispatch(fetchTransports());
  }, [dispatch]);

  //handleSave

  const handleSave = async (fd) => {
    try {
      let resultAction;

      if (formModel === "update") {
        resultAction = await dispatch(
          updateExitingTrip({ id: currentTrip._id, payload: fd }),
        ).unwrap();
        toast.success(
          lang === "ar" ? "تم التحديث بنجاح" : "Updated successfully",
        );
      } else {
        // create or clone
        resultAction = await dispatch(createNewTrip(fd)).unwrap();
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
      setCurrentTrip(null);
      setFormModel("create");
      dispatch(fetchTrips()); //الحفاظ على المدخلات الحالية في حال كان هناك خطا بالادخال
      // مهم: إعادة جلب البيانات بعد النجاح

      // dispatch(fetchTrips());
    } catch (err) {
      const msg = err?.data?.message || err?.message || "حدث خطأ غير متوقع";
      toast.error(lang === "ar" ? msg : msg);
    }
  };
  //confirmDelete
  const confirmDelete = async () => {
    try {
      await dispatch(deleteTrip(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      // مهم: إعادة جلب القائمة
      dispatch(fetchTrips());
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
  //notify
  // notify.success("تم الحفظ بنجاح");
  // notify.error("فشل الحذف");

  /* ================================
     felters
  ================================= */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
    );

    dispatch(fetchTrips(query)); // مهم: إرسال الاستعلام فقط إذا كان هناك فلتر مفعل
  }, [filters, dispatch]);

  /* ================================
     Table Columns
  ================================= */
 const columns = [
    // ─── رقم الصف ───
  {
    header: "#",
    align: "center",
    width: "50px",
    render: (_, index) => (
      <span className="fw-bold text-muted">{index + 1}</span>
    ),
  },

  // ─── الصور ───
  {
    header: lang === "ar" ? "الصور" : "Images",
    align: "center",
    render: (row) => <ImagePreviewCell images={row.images} />,
  },
  // الاسماء
    {
    header: lang === "ar" ? "الاسم" : "Name",
    accessor: ["nameAr", "nameEn"],  // ← مصفوفة: [عربي, إنجليزي]
  },
  // description
  {
    header: lang === "ar" ? "الوصف" : "Description",
    accessor: ["descriptionAr", "descriptionEn"],
    render: (row) => (
      <TruncatedText
        text={
          lang === "ar" 
            ? row.descriptionAr 
            : row.descriptionEn
        }
        limit={8}
      />
    ),
  },
   // ─── نوع الرحلة (select) ───
  {
    header: lang === "ar" ? "نوع الرحلة" : "Trip Type",
    render: (row, _, lang) => {
      const tripTypeField = memoizedTripConfig.commonFields.find(
        f => f.name === "tripType"
      );
      const option = tripTypeField?.options?.find(o => o.value === row.tripType);
      
      return (
        <Badge bg="info">
          {lang === "ar" ? option?.labelAr : option?.labelEn}
        </Badge>
      );
    },
  },

  // ─── المدن ───
  {
    header: lang === "ar" ? "المسار" : "Route",
    render: (row, _, lang) => (
      <div className="text-center">
        <div className="fw-bold">{row.fromCity}</div>
        <small className="text-muted">→ {row.toCity}</small>
      </div>
    ),
  },
  //pirces
  {
    header: lang === "ar" ? "السعر" : "Price",
    align: "center",
    accessor: "pricing.basePrice",  // ← نص عادي (لا يحتاج تعريب)
    render: (row) => (
      <span className="fw-semibold text-success">
        {row.pricing?.basePrice} {row.pricing?.currency || "SAR"}
      </span>
    ),
  },
  

  // status
  {
    header: lang === "ar" ? "الحالة" : "Status",
    render: (row) => (
      <Badge bg={row.isActive ? "success" : "secondary"}>
        {row.isActive 
          ? (lang === "ar" ? "نشط" : "Active")
          : (lang === "ar" ? "غير نشط" : "Inactive")
        }
      </Badge>
    ),
  },
  //  
   // ─── الإجراءات ───
  {
    header: lang === "ar" ? "الإجراءات" : "Actions",
    align: "center",
    render: (row) => (
      <div className="d-flex justify-content-center gap-1">
        <ActionButton action="edit" onClick={() => openUpdateModal(row)} />
        <ActionButton action="clone" onClick={() => openCloneModal(row)} />
        <ActionButton action="view" onClick={() => {
          setCurrentTrip(row);
          setShowDetails(true);
        }} />
        <ActionButton action="delete" onClick={() => setDeleteModal({
          show: true,
          id: row._id,
          name: lang === "ar" ? row.nameAr : row.nameEn,
        })} />
      </div>
    ),
  },

 ]

  /*
  // دالة مساعدة للحصول على القيمة المحلية (العربية أو الإنجليزية) لأي حقل
  const getLocalizedValue = (row, field, lang) => {
    if (!row) return "";

    const key = lang === "ar" ? `${field}Ar` : `${field}En`;

    return row[key] ?? "";
  };

  // الحصول على تعريف الحقل الخاص بنوع الرحلة
  const config = tripFormConfig();
  // تأكد من أن tripTypeField موجود قبل استخدامه في الأعمدة
  const tripTypeField = config.commonFields.find((f) => f.name === "tripType");


  const columns = [
    //رقم الصف
    {
      header: lang === "ar" ? "رقم" : "No",
      align: "center",
      render: (_, index) => (
        <span className=" fw-bold text-muted">{index + 1}</span>
      ),
    },
    {
      header: lang === "ar" ? "الصور" : "Images",
      align: "center",
      render: (row) => <ImagePreviewCell images={row.images} />,
    },

    // ✅ الاسم + الوصف
    {
      header: lang === "ar" ? "الاسم" : "Name",
      render: (row) => (
        <div className="d-flex flex-column">
          <span className="fw-bold">
            {getLocalizedValue(row, "name", lang)}
          </span>
          <small className="text-muted">
            <TruncatedText
              text={getLocalizedValue(row, "description", lang)}
              limit={8}
            />
          </small>
        </div>
      ),
    },

    //type trip

    {
      header: lang === "ar" ? tripTypeField?.labelAr : tripTypeField?.labelEn,

      render: (row) => {
        const option = tripTypeField?.options?.find(
          (o) => o.value === row.tripType,
        );

        return (
          <Badge bg="info">
            {lang === "ar" ? option?.labelAr : option?.labelEn}
          </Badge>
        );
      },
    },

    //prices
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      render: (row) => (
        <div className="fw-semibold text-success">
          {row.pricing?.basePrice} {row.pricing?.currency || "SAR"}
        </div>
      ),
    },

    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: lang === "ar" ? "الإجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <div className="d-flex  justify-content-center">
          <ActionButton action="edit" onClick={() => openUpdateModal(row)} />
          <ActionButton action="clone" onClick={() => openCloneModal(row)} />
          <ActionButton
            action="view"
            onClick={() => {
              setCurrentTrip(row);
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
*/
  return (
    <div className="container py-5">
      {/* Header */}
      <PageHeader
        titleAr="إدارة الرحلات"
        titleEn="Trips Management"
        subtitleAr="إضافة وتعديل وحذف أنواع الرحلات"
        subtitleEn="Add, edit, and delete trips types"
      >
        {/* Action Buttons Row */}
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* Action Buttons */}
          <div className="w-100 d-flex justify-content-center">
            <div className="d-inline-flex align-items-center gap-2">
              <ActionButton
                action="add"
                onClick={() => openCreateModal()}
                label={lang === "ar" ? "إضافة رحلة جديدة" : "Add Transport"}
                size="md"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <ExportTableButtons
            data={tripList}
            columns={columns}
            lang={lang}
            filename="Trips List"
            title={lang === "ar" ? "قائمة الرحلات" : "Trips List"}
          />
        </div>
      </PageHeader>

      {/* loadign */}
      <div className={`${flexBetween} ${cardShadow} position-relative`}>
        <LoadingOverlay
          show={loading}
          text={lang === "ar" ? "جاري التحميل..." : "Loading..."}
        />
      </div>
      <ErrorOverlay show={!!error} message={error} />

      {/* filters */}
      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          type: {
            type: "select",
            col: 2,
            options: [
              { value: "tour", labelAr: "جولة", labelEn: "Tour" },
              { value: "transport", labelAr: "نقل", labelEn: "Transport" },
              { value: "package", labelAr: "باقة", labelEn: "Package" },
              { value: "activity", labelAr: "نشاط", labelEn: "Activity" },
            ],
          },
          fromCity: {
            type: "text",
            col: 2,
            placeholder: lang === "ar" ? "من المدينة" : "From City",
          },
          toCity: {
            type: "text",
            col: 2,
            placeholder: lang === "ar" ? "إلى المدينة" : "To City",
          },
          isActive: {
            type: "select",
            col: 2,
            options: [
              { value: "true", labelAr: "نشط", labelEn: "Active" },
              { value: "false", labelAr: "غير نشط", labelEn: "Inactive" },
            ],
          },
        }}
      />

      <UniversalTable
        columns={columns}
        data={tripList}
        emptyMessage={lang === "ar" ? "لا توجد بيانات" : "No data found"}
      />

      {/* Details */}
      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={lang === "ar" ? "عرض التفاصيل" : "Transport details show"}
        images={currentTrip?.images || []}
        fields={[
          // 1. Basic Info
          {
            label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
            value: currentTrip?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name",
            value: currentTrip?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالعربية" : "Arabic Description",
            value: currentTrip?.descriptionAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالإنجليزية" : "English Description",
            value: currentTrip?.descriptionEn || "غير متوفر",
          },

          // 2. Trip Type
          {
            label: lang === "ar" ? "نوع الرحلة" : "Trip Type",
            value: currentTrip?.tripType
              ? lang === "ar"
                ? {
                    tour: "جولة",
                    transport: "نقل",
                    package: "باقة",
                    activity: "نشاط",
                  }[currentTrip.tripType]
                : currentTrip.tripType
              : "غير متوفر",
          },

          // 3. Locations
          {
            label: lang === "ar" ? "من المدينة" : "From City",
            value: currentTrip?.fromCity || "غير متوفر",
          },
          {
            label: lang === "ar" ? "إلى المدينة" : "To City",
            value: currentTrip?.toCity || "غير متوفر",
          },

          // 4. Duration & Time
          {
            label:
              lang === "ar"
                ? "مدة الرحلة (أيام / ليالي)"
                : "Duration (Days / Nights)",
            value: currentTrip?.duration
              ? `${currentTrip.duration.days || 0} يوم / ${currentTrip.duration.nights || 0} ليلة`
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تاريخ الانطلاق" : "Start Date",
            value: currentTrip?.startDate?.$date
              ? new Date(currentTrip.startDate.$date).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "وقت الانطلاق" : "Start Time",
            value:
              typeof currentTrip?.startTime === "number"
                ? `${Math.floor(currentTrip.startTime / 60)
                    .toString()
                    .padStart(
                      2,
                      "0",
                    )}:${(currentTrip.startTime % 60).toString().padStart(2, "0")}`
                : "غير متوفر",
          },

          // 5. Pricing
          {
            label: lang === "ar" ? "السعر الأساسي" : "Base Price",
            value:
              currentTrip?.pricing?.basePrice !== undefined
                ? `${currentTrip.pricing.basePrice} ${currentTrip.pricing.currency || "SAR"}`
                : "غير متوفر",
          },
          {
            label: lang === "ar" ? "سعر الخصم" : "Discount Price",
            value:
              currentTrip?.pricing?.discountPrice !== undefined &&
              currentTrip.pricing.discountPrice > 0
                ? `${currentTrip.pricing.discountPrice} ${currentTrip.pricing.currency || "SAR"}`
                : "لا يوجد خصم",
          },

          // 6. Capacity
          {
            label: lang === "ar" ? "عدد البالغين" : "Max Adults",
            value: currentTrip?.capacity?.maxAdults ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "عدد الأطفال" : "Max Children",
            value: currentTrip?.capacity?.maxChildren ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "إجمالي المقاعد" : "Total Seats",
            value: currentTrip?.capacity?.totalSeats ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "المقاعد المتاحة" : "Available Seats",
            value: currentTrip?.capacity?.availableSeats ?? "غير متوفر",
          },

          // 7. Features (السمات)
          {
            label: lang === "ar" ? "المميزات" : "Features",
            value:
              currentTrip?.features &&
              Object.keys(currentTrip.features).length > 0
                ? Object.entries(currentTrip.features)
                    .filter(([_, v]) => v === true)
                    .map(([key]) => {
                      const opt = tripFormConfig()
                        .commonFields.find((f) => f.name === "features")
                        ?.options.find((o) => o.key === key);
                      return lang === "ar" ? opt?.labelAr : opt?.labelEn;
                    })
                    .filter(Boolean)
                    .join(" • ") || "لا توجد مميزات محددة"
                : "لا توجد مميزات",
          },

          // 8. Vehicle Type (إذا كان موجودًا)
          {
            label: lang === "ar" ? "نوع المركبة" : "Vehicle Type",
            value: currentTrip?.vehicleType
              ? currentTrip.vehicleType.nameAr ||
                currentTrip.vehicleType.nameEn ||
                `ID: ${currentTrip.vehicleType}`
              : "غير محدد",
          },

          // 9. Status & Admin
          {
            label: lang === "ar" ? "الحالة" : "Status",
            value: currentTrip?.isActive
              ? lang === "ar"
                ? "نشط"
                : "Active"
              : lang === "ar"
                ? "غير نشط"
                : "Inactive",
          },
          {
            label: lang === "ar" ? "تم الإنشاء بواسطة" : "Created By",
            value: currentTrip?.createdBy
              ? typeof currentTrip.createdBy === "object"
                ? currentTrip.createdBy.username ||
                  currentTrip.createdBy.name ||
                  currentTrip.createdBy._id
                : currentTrip.createdBy
              : "غير متوفر",
          },

          // 10. Timestamps
          {
            label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",
            value: currentTrip?.createdAt
              ? currentTrip.createdAt.$date
                ? new Date(currentTrip.createdAt.$date).toLocaleString(
                    lang === "ar" ? "ar-SA" : "en-US",
                  )
                : new Date(currentTrip.createdAt).toLocaleString(
                    lang === "ar" ? "ar-SA" : "en-US",
                  )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تاريخ آخر تعديل" : "Updated At",
            value: currentTrip?.updatedAt
              ? currentTrip.updatedAt.$date
                ? new Date(currentTrip.updatedAt.$date).toLocaleString(
                    lang === "ar" ? "ar-SA" : "en-US",
                  )
                : new Date(currentTrip.updatedAt).toLocaleString(
                    lang === "ar" ? "ar-SA" : "en-US",
                  )
              : "غير متوفر",
          },
        ]}
        entity={currentTrip}
      />
      {/* modal for editing and adding transport */}
      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        config={memoizedTripConfig}
        //    formData={formData}
        //   setFormData={setFormData}

        initialData={currentTrip}
        titleAr={formModel === "update" ? "تعديل الرحلة" : "إضافة الرحلة ل"}
        titleEn={formModel === "update" ? "Edit Trip" : "Add Trip"}
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
