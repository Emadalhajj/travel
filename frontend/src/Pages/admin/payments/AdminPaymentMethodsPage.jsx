/*
ما يمكن للمدير تعديله في صفحة طرق الدفع؟

لكل طريقة:

الاسم العربي والإنجليزي
النوع
هل تحتاج حسابًا بنكيًا؟
هل تحتاج مزود دفع؟
هل تحتاج رفع إثبات؟
حالة التفعيل
ترتيب العرض

مثال:

تحويل بنكي
النوع: Offline
يحتاج حسابًا بنكيًا: نعم
يحتاج مزود دفع: لا
يحتاج رفع إثبات: نعم
مفعل: نعم

أما:

مدى
النوع: Online
يحتاج حسابًا بنكيًا: لا
يحتاج مزود دفع: نعم
يحتاج رفع إثبات: لا
مفعل: نعم
*/

// Pages/admin/payments/AdminPaymentMethodsPage.jsx

import { useEffect, useMemo, useState } from "react";

import { Badge, Form } from "react-bootstrap";

import { useDispatch, useSelector } from "react-redux";

import { toast } from "react-toastify";

import { useTranslation } from "react-i18next";

import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  setLimit,
  setPage,
  updatePaymentMethod,
  updatePaymentMethodStatus,
} from "../../../redux/payments/paymentMethodSlice";

import { paymentMethodFormConfig } from "../../../Components/common/ModalForms/payments/paymentMethodFormConfig";

import { buildQuery } from "../../../Utils/buildQuery";

import { normalizeForForm } from "../../../Utils/formData/normalize";

import PageHeader from "../../../Components/layout/PageHeader";

import ActionButton from "../../../Components/common/buttons/ActionButton";

import EntityFilter from "../../../Components/common/EntityFilter";

import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";

import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

import UniversalFormModal from "../../../Components/forms/UniversalFormModal";

import UniversalTable from "../../../Components/common/tables/UniversalTable";

import PaginationComponent from "../../../Components/common/Pagination";

import ConfirmDialog from "../../../Components/common/ConfirmModal";

import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";

/*
=====================================================
Admin Payment Methods Page
=====================================================

تستخدم نفس مكونات الإدارة العامة الموجودة في النظام.

تدعم:
-----------------------------------------------------
- الإضافة.
- التعديل.
- النسخ.
- عرض التفاصيل.
- التفعيل والتعطيل.
- الحذف المنطقي.
- البحث والفلترة.
- Pagination.
=====================================================
*/

export default function AdminPaymentMethodsPage() {
  const dispatch = useDispatch();

  const { i18n } = useTranslation();

  const lang = i18n.language || "ar";

  const isArabic = lang === "ar";

  const {
    paymentMethodsList = [],

    loading,

    error,

    pagination = {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  } = useSelector((state) => state.paymentMethods || {});

  /*
  =====================================================
  Form Modal State
  =====================================================
  */

  const [showModal, setShowModal] = useState(false);

  const [currentMethod, setCurrentMethod] = useState(null);

  const [formMode, setFormMode] = useState("create");

  const [formErrors, setFormErrors] = useState({});

  const [loadingSave, setLoadingSave] = useState(false);

  /*
  =====================================================
  Details State
  =====================================================
  */

  const [showDetails, setShowDetails] = useState(false);

  /*
  =====================================================
  Delete State
  =====================================================
  */

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

  /*
  =====================================================
  Filters
  =====================================================
  */

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    isActive: "",
  });

  /*
  =====================================================
  Form Config
  =====================================================
  */

  const memoizedConfig = useMemo(() => paymentMethodFormConfig(), []);

  /*
  =====================================================
  Fetch
  =====================================================
  */

  useEffect(() => {
    const query = buildQuery(
      filters,
      {
        page:
          pagination.page,
        limit:
          pagination.limit,
      },
    );

    dispatch(fetchPaymentMethods(query));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  /*
  =====================================================
  Open Create
  =====================================================
  */

  const openCreateModal = () => {
    setFormMode("create");

    setCurrentMethod({
      code: "",
      type: "offline",

      nameAr: "",
      nameEn: "",

      descriptionAr: "",
      descriptionEn: "",

      icon: "",
      sortOrder: 0,

      requiresBankAccount: false,
      requiresPaymentProvider: false,
      requiresProofUpload: false,

      isActive: true,
    });

    setFormErrors({});
    setShowModal(true);
  };

  /*
  =====================================================
  Open Update
  =====================================================
  */

  const openUpdateModal = (method) => {
    setFormMode("update");

    setCurrentMethod(normalizeForForm(method, memoizedConfig));

    setFormErrors({});
    setShowModal(true);
  };

  /*
  =====================================================
  Clone
  =====================================================

  الكود يجب أن يكون فريدًا، لذلك يتم تفريغه.
  */

  const openCloneModal = (method) => {
    const normalized = normalizeForForm(method, memoizedConfig);

    setFormMode("clone");

    setCurrentMethod({
      ...normalized,

      _id: undefined,

      code: "",

      nameAr: `${method.nameAr || ""} (نسخة)`,

      nameEn: `${method.nameEn || method.nameAr || ""} (Copy)`,

      isActive: false,
    });

    setFormErrors({});
    setShowModal(true);
  };

  /*
  =====================================================
  Save
  =====================================================
  */

  const handleSave = async (data) => {
    const formData = data?.formState || data || {};

    setLoadingSave(true);
    setFormErrors({});

    try {
      if (formMode === "update") {
        await dispatch(
          updatePaymentMethod({
            id: currentMethod._id,

            data: formData,
          }),
        ).unwrap();

        toast.success(
          isArabic
            ? "تم تحديث طريقة الدفع بنجاح"
            : "Payment method updated successfully",
        );
      } else {
        await dispatch(createPaymentMethod(formData)).unwrap();

        toast.success(
          formMode === "clone"
            ? isArabic
              ? "تم نسخ طريقة الدفع بنجاح"
              : "Payment method cloned successfully"
            : isArabic
              ? "تم إضافة طريقة الدفع بنجاح"
              : "Payment method added successfully",
        );
      }

      setShowModal(false);
      setCurrentMethod(null);
      setFormMode("create");
      setFormErrors({});

      const query = buildQuery(filters, pagination);

      await dispatch(fetchPaymentMethods(query));
    } catch (err) {
      if (err?.errors && typeof err.errors === "object") {
        setFormErrors(err.errors);
      }

      const message =
        err?.message ||
        err?.data?.message ||
        err ||
        (isArabic ? "حدث خطأ أثناء الحفظ" : "Save failed");

      toast.error(
        typeof message === "string"
          ? message
          : isArabic
            ? "حدث خطأ أثناء الحفظ"
            : "Save failed",
      );
    } finally {
      setLoadingSave(false);
    }
  };

  /*
  =====================================================
  Status
  =====================================================
  */

  const handleStatusChange = async (method, isActive) => {
    try {
      await dispatch(
        updatePaymentMethodStatus({
          id: method._id,

          data: {
            isActive,
          },
        }),
      ).unwrap();

      toast.success(
        isActive
          ? isArabic
            ? "تم تفعيل طريقة الدفع"
            : "Payment method activated"
          : isArabic
            ? "تم تعطيل طريقة الدفع"
            : "Payment method deactivated",
      );
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic ? "تعذر تحديث الحالة" : "Status update failed"),
      );
    }
  };

  /*
  =====================================================
  Delete
  =====================================================
  */

  const confirmDelete = async () => {
    try {
      await dispatch(deletePaymentMethod(deleteModal.id)).unwrap();

      toast.success(isArabic ? "تم حذف طريقة الدفع" : "Payment method deleted");
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic ? "تعذر حذف طريقة الدفع" : "Delete failed"),
      );
    } finally {
      setDeleteModal({
        show: false,
        id: null,
        name: "",
      });
    }
  };

  /*
  =====================================================
  Type Labels
  =====================================================
  */

  const typeLabel = (type) => {
    const labels = {
      offline: {
        ar: "غير إلكتروني",
        en: "Offline",
      },

      online: {
        ar: "إلكتروني",
        en: "Online",
      },

      invoice: {
        ar: "فاتورة",
        en: "Invoice",
      },

      cash: {
        ar: "نقدي",
        en: "Cash",
      },

      credit: {
        ar: "آجل",
        en: "Credit",
      },
    };

    return labels[type]?.[isArabic ? "ar" : "en"] || type;
  };

  /*
  =====================================================
  Table Columns
  =====================================================
  */

  const columns = [
    {
      header: "#",

      align: "center",

      width: "50px",

      render: (_, index) => (
        <span className="fw-bold text-muted">{index + 1}</span>
      ),
    },

    {
      header: isArabic ? "طريقة الدفع" : "Payment Method",

      render: (row) => (
        <div>
          <div className="fw-bold">
            {isArabic ? row.nameAr : row.nameEn || row.nameAr}
          </div>

          <small className="text-muted">{row.code}</small>
        </div>
      ),
    },

    {
      header: isArabic ? "النوع" : "Type",

      align: "center",

      render: (row) => (
        <Badge
          bg={
            row.type === "online"
              ? "primary"
              : row.type === "offline"
                ? "info"
                : row.type === "invoice"
                  ? "warning"
                  : "secondary"
          }
        >
          {typeLabel(row.type)}
        </Badge>
      ),
    },

    {
      header: isArabic ? "المتطلبات" : "Requirements",

      render: (row) => (
        <div className="d-flex flex-column gap-1">
          {row.requiresBankAccount ? (
            <Badge bg="info">{isArabic ? "حساب بنكي" : "Bank Account"}</Badge>
          ) : null}

          {row.requiresPaymentProvider ? (
            <Badge bg="primary">{isArabic ? "مزود دفع" : "Provider"}</Badge>
          ) : null}

          {row.requiresProofUpload ? (
            <Badge bg="warning">
              {isArabic ? "رفع إثبات" : "Proof Upload"}
            </Badge>
          ) : null}

          {!row.requiresBankAccount &&
          !row.requiresPaymentProvider &&
          !row.requiresProofUpload ? (
            <span className="text-muted">-</span>
          ) : null}
        </div>
      ),
    },

    {
      header: isArabic ? "الترتيب" : "Order",

      align: "center",

      render: (row) => row.sortOrder ?? 0,
    },

    {
      header: isArabic ? "الحالة" : "Status",

      align: "center",

      render: (row) => (
        <div className="d-flex flex-column align-items-center gap-1">
          <Badge bg={row.isActive ? "success" : "secondary"}>
            {row.isActive
              ? isArabic
                ? "مفعل"
                : "Active"
              : isArabic
                ? "غير مفعل"
                : "Inactive"}
          </Badge>

          <Form.Check
            type="switch"
            checked={Boolean(row.isActive)}
            onChange={(event) => handleStatusChange(row, event.target.checked)}
          />
        </div>
      ),
    },

    {
      header: isArabic ? "الإجراءات" : "Actions",

      align: "center",

      render: (row) => (
        <div className="d-flex justify-content-center gap-1">
          <ActionButton action="edit" onClick={() => openUpdateModal(row)} />

          <ActionButton action="clone" onClick={() => openCloneModal(row)} />

          <ActionButton
            action="view"
            onClick={() => {
              setCurrentMethod(row);

              setShowDetails(true);
            }}
          />

          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,

                id: row._id,

                name: isArabic ? row.nameAr : row.nameEn || row.nameAr,
              })
            }
          />
        </div>
      ),
    },
  ];

  /*
  =====================================================
  Render
  =====================================================
  */

  return (
    <div className="container py-5">
      <PageHeader
        titleAr="إدارة طرق الدفع"
        titleEn="Payment Methods Management"
        subtitleAr="إدارة طرق الدفع الأساسية وتحديد متطلبات كل طريقة وحالة تفعيلها."
        subtitleEn="Manage payment methods, requirements, status, and display order."
      >
        <div className="d-flex justify-content-center w-100">
          <ActionButton
            action="add"
            label={isArabic ? "إضافة طريقة دفع" : "Add Payment Method"}
            onClick={openCreateModal}
          />
        </div>
      </PageHeader>

      <LoadingOverlay
        show={loading}
        text={isArabic ? "جاري التحميل..." : "Loading..."}
      />

      <ErrorOverlay show={Boolean(error)} message={error} />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",

            col: 4,

            placeholder: isArabic
              ? "البحث بالاسم أو الكود"
              : "Search name or code",
          },

          type: {
            type: "select",

            col: 4,

            placeholder: isArabic ? "نوع طريقة الدفع" : "Payment Type",

            options: [
              {
                value: "offline",

                labelAr: "غير إلكتروني",

                labelEn: "Offline",
              },

              {
                value: "online",

                labelAr: "إلكتروني",

                labelEn: "Online",
              },

              {
                value: "invoice",

                labelAr: "فاتورة",

                labelEn: "Invoice",
              },

              {
                value: "cash",

                labelAr: "نقدي",

                labelEn: "Cash",
              },

              {
                value: "credit",

                labelAr: "آجل",

                labelEn: "Credit",
              },
            ],
          },

          isActive: {
            type: "select",

            col: 4,

            placeholder: isArabic ? "حالة التفعيل" : "Active Status",

            options: [
              {
                value: "true",

                labelAr: "مفعل",

                labelEn: "Active",
              },

              {
                value: "false",

                labelAr: "غير مفعل",

                labelEn: "Inactive",
              },
            ],
          },
        }}
      />

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
      />

      <UniversalTable
        columns={columns}
        data={paymentMethodsList}
        lang={lang}
        emptyMessage={isArabic ? "لا توجد طرق دفع" : "No payment methods found"}
      />

      {/* Details Modal */}

      <EntityDetailsModal
        show={showDetails}
        onHide={() => {
          setShowDetails(false);
          setCurrentMethod(null);
        }}
        title={isArabic ? "تفاصيل طريقة الدفع" : "Payment Method Details"}
        fields={[
          {
            label: isArabic ? "الكود" : "Code",

            value: currentMethod?.code || "-",
          },

          {
            label: isArabic ? "الاسم بالعربية" : "Arabic Name",

            value: currentMethod?.nameAr || "-",
          },

          {
            label: isArabic ? "الاسم بالإنجليزية" : "English Name",

            value: currentMethod?.nameEn || "-",
          },

          {
            label: isArabic ? "النوع" : "Type",

            value: typeLabel(currentMethod?.type),
          },

          {
            label: isArabic ? "الوصف بالعربية" : "Arabic Description",

            value: currentMethod?.descriptionAr || "-",
          },

          {
            label: isArabic ? "الوصف بالإنجليزية" : "English Description",

            value: currentMethod?.descriptionEn || "-",
          },

          {
            label: isArabic ? "يتطلب حسابًا بنكيًا" : "Requires Bank Account",

            value: currentMethod?.requiresBankAccount
              ? isArabic
                ? "نعم"
                : "Yes"
              : isArabic
                ? "لا"
                : "No",
          },

          {
            label: isArabic ? "يتطلب مزود دفع" : "Requires Provider",

            value: currentMethod?.requiresPaymentProvider
              ? isArabic
                ? "نعم"
                : "Yes"
              : isArabic
                ? "لا"
                : "No",
          },

          {
            label: isArabic ? "يتطلب رفع إثبات" : "Requires Proof Upload",

            value: currentMethod?.requiresProofUpload
              ? isArabic
                ? "نعم"
                : "Yes"
              : isArabic
                ? "لا"
                : "No",
          },

          {
            label: isArabic ? "ترتيب العرض" : "Sort Order",

            value: currentMethod?.sortOrder ?? 0,
          },

          {
            label: isArabic ? "الحالة" : "Status",

            value: currentMethod?.isActive
              ? isArabic
                ? "مفعل"
                : "Active"
              : isArabic
                ? "غير مفعل"
                : "Inactive",
          },

          {
            label: isArabic ? "تاريخ الإنشاء" : "Created At",

            value: currentMethod?.createdAt
              ? new Date(currentMethod.createdAt).toLocaleString(
                  isArabic ? "ar-SA" : "en-US",
                )
              : "-",
          },

          {
            label: isArabic ? "آخر تعديل" : "Updated At",

            value: currentMethod?.updatedAt
              ? new Date(currentMethod.updatedAt).toLocaleString(
                  isArabic ? "ar-SA" : "en-US",
                )
              : "-",
          },
        ]}
        entity={currentMethod}
      />

      {/* Form Modal */}

      <UniversalFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setCurrentMethod(null);
          setFormMode("create");
          setFormErrors({});
        }}
        onSave={handleSave}
        config={memoizedConfig}
        initialData={currentMethod}
        titleAr={
          formMode === "update"
            ? "تعديل طريقة الدفع"
            : formMode === "clone"
              ? "نسخ طريقة الدفع"
              : "إضافة طريقة دفع"
        }
        titleEn={
          formMode === "update"
            ? "Edit Payment Method"
            : formMode === "clone"
              ? "Clone Payment Method"
              : "Add Payment Method"
        }
        errors={formErrors}
        loading={loadingSave}
      />

      {/* Delete Dialog */}

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() =>
          setDeleteModal({
            show: false,
            id: null,
            name: "",
          })
        }
        onConfirm={confirmDelete}
        title={isArabic ? "تأكيد حذف طريقة الدفع" : "Confirm Delete"}
        message={
          isArabic
            ? `هل أنت متأكد من حذف ${deleteModal.name || "طريقة الدفع"}؟`
            : `Are you sure you want to delete ${deleteModal.name || "this payment method"}?`
        }
        confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"}
        cancelText={isArabic ? "إلغاء" : "Cancel"}
        variant="danger"
      />
    </div>
  );
}
