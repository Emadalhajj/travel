// src/pages/visas/AdminVisaList.jsx   (أو المسار الذي تستخدمه)
import React, { use, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import PageHeader from "../../../Components/layout/PageHeader";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import EntityFilter from "../../../Components/common/EntityFilter";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";

import { visaFormConfig } from "../../../Components/common/ModalForms/visa/visaFormConfig"; // تأكد من المسار

import {
  fetchVisas,
  createVisa,
  updateVisa,
  deleteVisa,
  toggleVisa,
} from "../../../redux/visas/visaSlice";

import { fetchVisaTypes } from "../../../redux/visas/visaTypeSlice";

import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import { formatImagePath } from "../../../Utils/imageUtils";

export default function AdminVisaList() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    list: visas = [],
    loading,
    error,
  } = useSelector((state) => state.visas || {});
  const { visaTypes = [] } = useSelector((state) => state.visaTypes || {});
  const { currentUser } = useSelector((state) => state.auth || {});

  const [showModal, setShowModal] = useState(false);
  const [currentVisa, setCurrentVisa] = useState(null);
  const [formMode, setFormMode] = useState("create"); // create | update
  console.log("visasss", visas);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
    visaType: "",
  });

  // Memoized Config
  const memoizedConfig = useMemo(() => visaFormConfig(visaTypes), [visaTypes]);

  // Fetch data
  useEffect(() => {
    dispatch(fetchVisas());
    dispatch(fetchVisaTypes());
  }, [dispatch]);
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
  const normalizeVisaForForm = (visa) => {
    if (!visa) return null;

    const normalized = { ...visa };

    // 1. التاريخ (يتعامل مع كل الصيغ الممكنة)
    if (visa.startDate) {
      const date =
        typeof visa.startDate === "string"
          ? visa.startDate
          : visa.startDate.$date || visa.startDate.toISOString?.();
      normalized.startDate = date
        ? new Date(date).toISOString().split("T")[0]
        : "";
    }

    if (visa.endDate) {
      const date =
        typeof visa.endDate === "string"
          ? visa.endDate
          : visa.endDate.$date || visa.endDate.toISOString?.();
      normalized.endDate = date
        ? new Date(date).toISOString().split("T")[0]
        : "";
    }

    // 2. الوقت (دقائق → HH:MM)
    if (typeof visa.startTime === "number" && !isNaN(visa.startTime)) {
      const h = Math.floor(visa.startTime / 60)
        .toString()
        .padStart(2, "0");
      const m = (visa.startTime % 60).toString().padStart(2, "0");
      normalized.startTime = `${h}:${m}`;
    }
    // ← التعديل الجديد لـ vehicleType: تأكد أنها string نظيفة
    if (visa.vehicleType) {
      normalized.vehicleType =
        typeof visa.vehicleType === "object"
          ? visa.vehicleType._id?.toString() || ""
          : visa.vehicleType?.toString() || "";
    }

    // معالجة visaType: تأكد أنها تمرر الـ ID
    if (visa.visaType) {
      normalized.visaType =
        typeof visa.visaType === "object"
          ? visa.visaType._id?.toString() || ""
          : visa.visaType?.toString() || "";
    }

    // 3. الصور
    normalized.images = normalizeImagesForForm(visa.images || []);

    return normalized;
  };

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentVisa(null);
    setShowModal(true);
  };

  const openUpdateModal = (visa) => {
    const normalized = normalizeVisaForForm(visa);
    setFormMode("update");
    setCurrentVisa(normalized);
    setShowModal(true);
  };
  //openclone
  const openCloneModal = (visa) => {
    const normalized = normalizeVisaForForm(visa);
    setFormMode("clone");
    setShowModal(true);
    setCurrentVisa({
      ...normalized,
      _id: null, // إزالة الـ ID للسماح بإنشاء نسخة جديدة
      name: {
        ar: `${visa.name?.ar || ""} (نسخة)`,
        en: `${visa.name?.en || ""} (Copy)`,
      },
      visaType: visa.visaType?._id || visa.visaType || "", // تمرير الـ ID
    });
  };

  const handleSave = async (fd) => {
    try {
      if (formMode === "update" && currentVisa?._id) {
        await dispatch(updateVisa({ id: currentVisa._id, data: fd })).unwrap();
        toast.success(
          lang === "ar" ? "تم التعديل بنجاح" : "Updated successfully",
        );
      } else {
        const user =
          currentUser || JSON.parse(localStorage.getItem("currentUser"));
        fd.append("createdBy", user?._id);
        await dispatch(createVisa(fd)).unwrap();
        toast.success(
          lang === "ar" ? "تمت الإضافة بنجاح" : "Added successfully",
        );
      }
      setShowModal(false);
      dispatch(fetchVisas());
    } catch (err) {
      toast.error(err?.message || "حدث خطأ أثناء الحفظ");
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteVisa(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
      dispatch(fetchVisas());
    } catch (err) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  const handleToggleStatus = (id) => {
    dispatch(toggleVisa(id));
  };
  /* ================================
       filters
    ================================= */
  useEffect(() => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
    );
    dispatch(fetchVisas(query));
  }, [filters, dispatch]);

  const columns = [
    {
      header: lang === "ar" ? "رقم" : "No",
      align: "center",
      render: (_, i) => i + 1,
    },
    {
      header: lang === "ar" ? "الصور" : "Images",
      align: "center",
      render: (row) => <ImagePreviewCell images={row.images || []} />,
    },
    {
      header: lang === "ar" ? "الاسم" : "Name",
      render: (row) => (
        <div>
          <div className="fw-bold">
            {lang === "ar" ? row.name?.ar : row.name?.en}
          </div>
          <small className="text-muted">
            {lang === "ar"
              ? row.description?.ar?.substring(0, 50)
              : row.description?.en?.substring(0, 50)}
            ...
          </small>
        </div>
      ),
    },
    {
      header: lang === "ar" ? "نوع التأشيرة" : "Visa Type",
      render: (row) => (
        <span className="badge bg-info">
          {lang === "ar" ? row.visaType?.nameAr : row.visaType?.nameEn}
        </span>
      ),
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      render: (row) => (
        <span className="fw-semibold text-success">{row.price} ر.س</span>
      ),
    },
    {
      header: lang === "ar" ? "المدة" : "Duration",
      render: (row) => row.duration || "-",
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <Form.Check
          type="switch"
          checked={row.isActive}
          onChange={() => handleToggleStatus(row._id)}
        />
      ),
    },
    {
      header: lang === "ar" ? "الإجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <div className="d-flex justify-content-center">
          <ActionButton action="edit" onClick={() => openUpdateModal(row)} />
          <ActionButton
            action="view"
            onClick={() => {
              setCurrentVisa(row);
              setShowDetails(true);
            }}
          />
          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,
                id: row._id,
                name: lang === "ar" ? row.name?.ar : row.name?.en,
              })
            }
          />
          <ActionButton action={"clone"} onClick={() => openCloneModal(row)} />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-3">
      <PageHeader
        titleAr="إدارة خدمات التأشيرات"
        titleEn="Visa Services Management"
        subtitleAr="إضافة، تعديل، وحذف أنواع التأشيرات"
        subtitleEn="Add, edit, and delete available visa types"
      />
      {/* Action Buttons Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Action Buttons */}
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
            <ActionButton
              size="md"
              action="add"
              label="إضافة تأشيرة جديدة"
              onClick={openCreateModal}
            />
            <Link to="/admin/visa-types">
              <ActionButton
                size="md"
                action="edit"
                label={
                  lang === "ar" ? "إدارة أنواع التأشيرات" : "Manage Visa Types"
                }
                // onClick={() => (window.location.href = "/admin/visa-types")}
              />
            </Link>
          </div>
        </div>
        <ExportTableButtons
          data={visas}
          columns={columns}
          lang={lang}
          filename="Visas_List"
          title={lang === "ar" ? "قائمة التأشيرات" : "Visas List"}
        />
      </div>

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={!!error} message={error} />
      {/* filters */}
      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          visaType: {
            type: "select",
            col: 4,
            options: [
              // { value: "", labelAr: "الكل", labelEn: "All" },
              ...visaTypes.map((vt) => ({
                value: vt._id,
                labelAr: vt.nameAr,
                labelEn: vt.nameEn,
              })),
            ],
          },
          search: {
            type: "text",
            col: 4,
            placeholder: lang === "ar" ? "بحث بالاسم..." : "Search by name...",
          },
          isActive: {
            type: "select",
            col: 4,
            options: [
              // { value: "", labelAr: "الكل", labelEn: "All" },
              { value: "true", labelAr: "نشط", labelEn: "Active" },
              { value: "false", labelAr: "غير نشط", labelEn: "Inactive" },
            ],
          },
        }}
      />
      <UniversalTable
        columns={columns}
        data={visas}
        emptyMessage={lang === "ar" ? "لا توجد تأشيرات بعد" : "No visas found"}
      />

      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        config={memoizedConfig}
        initialData={currentVisa}
        titleAr={
          formMode === "update" ? "تعديل التأشيرة" : "إضافة تأشيرة جديدة"
        }
        titleEn={formMode === "update" ? "Edit Visa" : "Add New Visa"}
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
      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={lang === "ar" ? "تفاصيل التأشيرة" : "Visa Details"}
        images={currentVisa?.images || []}
        entity={currentVisa}
        fields={[
          {
            label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",

            value: currentVisa?.name?.ar || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الاسم بالإنجليزي" : "English Name",

            value: currentVisa?.name?.en || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالعربي" : "Arabic Description",

            value: currentVisa?.description?.ar || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالإنجليزي" : "English Description",

            value: currentVisa?.description?.en || "غير متوفر",
          },
          {
            label: lang === "ar" ? "نوع التأشيرة" : "Visa Type",

            value:
              lang === "ar"
                ? currentVisa?.visaType?.name?.ar ||
                  currentVisa?.visaType?.nameAr ||
                  "غير متوفر"
                : currentVisa?.visaType?.name?.en ||
                  currentVisa?.visaType?.nameEn ||
                  "غير متوفر",
          },
          {
            label: lang === "ar" ? "السعر" : "Price",

            value: currentVisa?.price
              ? `${currentVisa.price} ر.س`
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "المدة" : "Duration",
            labelEn: "Duration",
            value: currentVisa?.duration || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الصلاحية" : "Validity",

            value: currentVisa?.validity || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الدولة" : "Country",

            value:
              lang === "ar"
                ? currentVisa?.country?.ar || "غير متوفر"
                : currentVisa?.country?.en || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الحالة" : "Status",

            value: currentVisa?.isActive
              ? lang === "ar"
                ? "نشطة"
                : "Active"
              : lang === "ar"
                ? "غير نشطة"
                : "Inactive",
          },
          {
            label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",

            value: currentVisa?.createdAt
              ? new Date(currentVisa.createdAt).toLocaleString(lang)
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تاريخ التعديل" : "Updated At",

            value: currentVisa?.updatedAt
              ? new Date(currentVisa.updatedAt).toLocaleString(lang)
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "المُنشئ" : "Created By",
            value:
              currentVisa?.createdBy?.nameEn ||
              currentVisa?.createdBy?.username ||
              "غير متوفر",
          },
          {
            label: lang === "ar" ? "المعدل" : "Updated By",
            value:
              currentVisa?.updatedBy?.nameEn ||
              currentVisa?.updatedBy?.username ||
              "غير متوفر",
          },
        ]}
      />
    </div>
  );
}
