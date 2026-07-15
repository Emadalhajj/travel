// src/pages/admin/visas/AdminVisaTypeList.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";

import {
  fetchVisaTypes,
  createVisaType,
  updateVisaType,
  deleteVisaType,
} from "../../../redux/visas/visaTypeSlice";

import { visaTypeFormConfig } from "../../../Components/common/ModalForms/visa/visaTypeFormConfig";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

export default function AdminVisaTypeList() {
  const dispatch = useDispatch();
  const {
    visaTypes = [],
    loading,
    error,
  } = useSelector((state) => state.visaTypes || {});

  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  // States
  const [showFormModal, setShowFormModal] = useState(false); // للإضافة / التعديل / النسخ
  const [showDetailsModal, setShowDetailsModal] = useState(false); // لعرض التفاصيل

  const [formMode, setFormMode] = useState("add"); // "add" | "edit" | "clone"
  const [currentItem, setCurrentItem] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

  // Fetch
  useEffect(() => {
    dispatch(fetchVisaTypes());
  }, [dispatch]);

  // Open Form Modals
  const openCreateModal = () => {
    setFormMode("add");
    setCurrentItem(null);
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setFormMode("edit");
    setCurrentItem(item);
    setShowFormModal(true);
  };

  const openCloneModal = (item) => {
    setFormMode("clone");
    setCurrentItem({
      ...item,
      _id: null,
      nameAr: `${item.nameAr} - نسخة`,
      nameEn: `${item.nameEn} - Copy`,
    });
    setShowFormModal(true);
  };

  const handleDelete = (id, name) => {
    setDeleteModal({ show: true, id, name: name || "هذا النوع" });
  };

  const confirmDelete = () => {
    dispatch(deleteVisaType(deleteModal.id));
    toast.success(lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    setDeleteModal({ show: false, id: null, name: "" });
  };

  // Handle Save
  // Handle Save - النسخة النهائية والأكثر أمانًا
  const handleSave = async (formData) => {
    console.log("🔍 Raw formData from UniversalFormModal:", formData);

    try {
      // معالجة آمنة للبيانات سواء كانت object عادي أو FormData
      const data =
        formData instanceof FormData
          ? Object.fromEntries(formData.entries())
          : formData;

      const payload = {
        nameAr: (data.nameAr || data["name.ar"] || "").trim(),
        nameEn: (data.nameEn || data["name.en"] || "").trim(),
        descriptionAr: (
          data.descriptionAr ||
          data["description.ar"] ||
          ""
        ).trim(),
        descriptionEn: (
          data.descriptionEn ||
          data["description.en"] ||
          ""
        ).trim(),
        isActive: data.isActive === "true" || data.isActive === true || false,
      };

      // console.log("📤 Final Payload sent to backend:", payload);

      // التحقق النهائي
      if (!payload.nameAr || !payload.nameEn) {
        toast.error(
          lang === "ar"
            ? "يجب إدخال الاسم بالعربية والإنجليزية"
            : "Both Arabic and English names are required",
        );
        return;
      }

      if (formMode === "edit" && currentItem?._id) {
        await dispatch(
          updateVisaType({ id: currentItem._id, data: payload }),
        ).unwrap();
        toast.success(
          lang === "ar" ? "تم التعديل بنجاح" : "Updated successfully",
        );
      } else {
        await dispatch(createVisaType(payload)).unwrap();
        toast.success(
          lang === "ar" ? "تمت الإضافة بنجاح" : "Added successfully",
        );
      }

      dispatch(fetchVisaTypes());
      setShowFormModal(false);
      setCurrentItem(null);
    } catch (err) {
      console.error("Save Error:", err);
      toast.error(
        err?.message || (lang === "ar" ? "حدث خطأ أثناء الحفظ" : "Save failed"),
      );
    }
  };

  // Define columns for export
  const columns = [
    {
      header: lang === "ar" ? "الرقم" : "No",
      accessor: "_rowNumber",
    },
    {
      header: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
      accessor: "nameAr",
    },
    {
      header: lang === "ar" ? "الاسم بالإنجليزية" : "English Name",
      accessor: "nameEn",
    },
  ];

  return (
    <div className="container py-3">
      <PageHeader
        titleAr="إدارة أنواع التأشيرات"
        titleEn="Manage Visa Types"
        subtitleAr="إضافة، تعديل وحذف أنواع التأشيرات"
        subtitleEn="Add, edit and delete visa types"
      />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        {/* Action Buttons */}
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
            <ActionButton
              action="add"
              label={
                lang === "ar" ? "إضافة نوع تأشيرة جديد" : "Add New Visa Type"
              }
              onClick={openCreateModal}
              size="md"
            />
          </div>
        </div>

        <ExportTableButtons
          data={visaTypes.map((item, index) => ({
            ...item,
            _rowNumber: index + 1,
          }))}
          columns={columns}
          lang={lang}
          filename="Visa_Types"
        />
      </div>

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={!!error} message={error} />

      {/* Table */}
      <div className="table-responsive shadow-sm rounded-3 border">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{lang === "ar" ? "رقم" : "No"}</th>
              <th>{lang === "ar" ? "الاسم بالعربية" : "Arabic Name"}</th>
              <th>{lang === "ar" ? "الاسم بالإنجليزية" : "English Name"}</th>
              <th className="text-center">
                {lang === "ar" ? "الإجراءات" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody>
            {visaTypes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-5 text-muted">
                  لا توجد أنواع تأشيرات مضافة بعد
                </td>
              </tr>
            ) : (
              visaTypes.map((v, i) => (
                <tr key={v._id}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{v.nameAr || "-"}</td>
                  <td>{v.nameEn || "-"}</td>
                  <td>
                    <div className="d-flex justify-content-center">
                      <ActionButton
                        label={lang === "ar" ? "تعديل" : "Edit"}
                        action="edit"
                        onClick={() => openEditModal(v)}
                      />
                      <ActionButton
                        label={lang === "ar" ? "نسخ" : "Clone"}
                        action="clone"
                        onClick={() => openCloneModal(v)}
                      />
                      <ActionButton
                        label={lang === "ar" ? "حذف" : "Delete"}
                        action="delete"
                        onClick={() => handleDelete(v._id, v.nameAr)}
                      />
                      <ActionButton
                        label={lang === "ar" ? "عرض التفاصيل" : "View Details"}
                        action="view"
                        onClick={() => {
                          setCurrentItem(v);
                          setShowDetailsModal(true); // ← مودال التفاصيل
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== Universal Form Modal (إضافة / تعديل / نسخ) ==================== */}
      <UniversalFormModal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setCurrentItem(null);
        }}
        onSave={handleSave}
        config={visaTypeFormConfig()}
        initialData={currentItem}
        titleAr={
          formMode === "edit"
            ? "تعديل نوع التأشيرة"
            : formMode === "clone"
              ? "نسخ نوع التأشيرة"
              : "إضافة نوع تأشيرة جديد"
        }
        titleEn={
          formMode === "edit"
            ? "Edit Visa Type"
            : formMode === "clone"
              ? "Clone Visa Type"
              : "Add New Visa Type"
        }
      />

      {/* ==================== Entity Details Modal (عرض التفاصيل) ==================== */}
      <EntityDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        titleAr={lang === "ar" ? "تفاصيل نوع التأشيرة" : "Visa Type Details"}
        titleEn="Visa Type Details"
        data={currentItem}
        fields={[
          {
            label: lang === "ar" ? "الاسم بالعربية" : "Arabic Name",
            labelEn: "Arabic Name",
            value: currentItem?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الاسم بالإنجليزية" : "English Name",
            labelEn: "English Name",
            value: currentItem?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالعربية" : "Arabic Description",
            labelEn: "Arabic Description",
            value: currentItem?.descriptionAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف بالإنجليزية" : "English Description",
            labelEn: "English Description",
            value: currentItem?.descriptionEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الحالة" : "Status",
            labelEn: "Status",
            value: currentItem?.isActive
              ? lang === "ar"
                ? "نشط"
                : "Active"
              : lang === "ar"
                ? "غير نشط"
                : "Inactive",
          },
        ]}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={`هل أنت متأكد من حذف نوع التأشيرة: ${deleteModal.name}؟`}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
