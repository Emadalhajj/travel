/*
=====================================================
Admin Payment Providers Page
=====================================================

صفحة إدارة مزودي الدفع الإلكتروني.

تعيد استخدام:
-----------------------------------------------------
- PageHeader
- ActionButton
- EntityFilter
- LoadingOverlay
- ErrorOverlay
- UniversalFormModal
- UniversalTable
- PaginationComponent
- ConfirmDialog
- EntityDetailsModal
- normalizeForForm
- buildQuery

ولا تنشئ أي Form أو Table خاص.
=====================================================
*/

import { useEffect, useMemo, useState } from "react";

import { Badge, Form } from "react-bootstrap";

import { useDispatch, useSelector } from "react-redux";

import { useTranslation } from "react-i18next";

import { toast } from "react-toastify";

/*
=====================================================
Redux
=====================================================
*/

import {
  createPaymentProvider,
  deletePaymentProvider,
  fetchPaymentProviderById,
  fetchPaymentProviders,
  updatePaymentProvider,
  updatePaymentProviderStatus,
} from "../../../redux/payments/paymentProviderSlice";

/*
=====================================================
Form Config
=====================================================
*/

import { paymentProviderFormConfig } from "../../../Components/common/ModalForms/payments/paymentProviderFormConfig";

/*
=====================================================
Generic Form Utilities
=====================================================
*/

import { normalizeForForm } from "../../../Utils/formData/normalize";

import { serializeForApi } from "../../../Utils/formData/serialize";

import { buildQuery } from "../../../Utils/buildQuery";

/*
=====================================================
Generic Components
=====================================================
*/

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
Constants
=====================================================
*/

const MASKED_CREDENTIAL_VALUES = new Set([
  "********",

  "••••••••",

  "•••••••",

  "[REDACTED]",
]);

const EMPTY_CREDENTIALS = {
  entityId: "",

  accessToken: "",

  webhookSecret: "",

  publishableKey: "",

  secretKey: "",

  apiKey: "",

  merchantId: "",

  terminalId: "",

  profileId: "",

  serverKey: "",

  clientKey: "",
};

/*
=====================================================
Initial Provider
=====================================================
*/

const createInitialProvider = () => ({
  code: "",

  nameAr: "",

  nameEn: "",

  descriptionAr: "",

  descriptionEn: "",

  environment: "TEST",

  baseUrl: "",

  icon: "",

  supportedPaymentMethods: [],

  credentials: {
    ...EMPTY_CREDENTIALS,
  },

  sortOrder: 0,

  isActive: true,
});

/*
=====================================================
Prepare Provider For Form
=====================================================

normalizeForForm يقوم بالتحويل العام.

بعده فقط نفرغ القيم السرية لأنها لا يجب أن تظهر
داخل inputs، حتى لو أعاد Backend القيمة المقنعة.
=====================================================
*/

const prepareProviderForForm = ({
  provider,

  config,
}) => {
  const normalized = normalizeForForm(provider || {}, config);

  return {
    ...normalized,

    credentials: {
      ...EMPTY_CREDENTIALS,
    },
  };
};

/*
=====================================================
Clean Credentials For API
=====================================================

قواعد التعديل:
-----------------------------------------------------
- القيمة الفارغة لا تُرسل.
- القيمة المقنعة لا تُرسل.
- القيم الجديدة فقط هي التي تُرسل.
- إذا لم يبق أي حقل نحذف credentials بالكامل.

هذا السلوك خاص بأمان مزودي الدفع، ولذلك لا يوضع
داخل normalizeForForm العام.
=====================================================
*/

const cleanCredentialsForApi = (credentials = {}) => {
  const cleaned = {};

  Object.entries(credentials || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue) {
      return;
    }

    if (MASKED_CREDENTIAL_VALUES.has(normalizedValue)) {
      return;
    }

    cleaned[key] = normalizedValue;
  });

  return cleaned;
};

/*
=====================================================
Prepare Provider Payload
=====================================================

يستخدم serializeForApi العام لتحويل:

checkbox-group object
↓
array

ثم يطبق فقط قاعدة Credentials الخاصة بالمزود.
=====================================================
*/

const prepareProviderPayload = ({
  formData,

  config,

  mode,
}) => {
  const serialized = serializeForApi(formData, config);

  const credentials = cleanCredentialsForApi(serialized.credentials);

  const payload = {
    ...serialized,
  };

  /*
  حقول النظام لا ترسل إلى Backend.
  */

  delete payload._id;

  delete payload.__v;

  delete payload.createdAt;

  delete payload.updatedAt;

  delete payload.createdBy;

  delete payload.updatedBy;

  delete payload.deletedAt;

  delete payload.deletedBy;

  delete payload.isDeleted;

  delete payload.credentialStatus;

  /*
  في التعديل لا نرسل credentials إذا لم يكتب
  المستخدم قيمة جديدة.
  */

  if (Object.keys(credentials).length > 0) {
    payload.credentials = credentials;
  } else {
    delete payload.credentials;
  }

  /*
  في النسخ يجب إدخال Credentials جديدة.
  لا يتم نسخ أسرار المزود الأصلي.
  */

  if (mode === "clone" && !payload.credentials) {
    payload.credentials = {};
  }

  return payload;
};

/*
=====================================================
Component
=====================================================
*/

export default function AdminPaymentProvidersPage() {
  const dispatch = useDispatch();

  const { i18n } = useTranslation();

  const lang = i18n.language || "ar";

  const isArabic = lang === "ar";

  /*
  =====================================================
  Redux State
  =====================================================
  */

  const {
    paymentProvidersList = [],

    selectedProvider,

    loading,

    detailsLoading,

    saving,

    error,

    pagination: reduxPagination = {
      total: 0,

      page: 1,

      limit: 10,

      totalPages: 0,
    },
  } = useSelector((state) => state.paymentProviders || {});

  /*
  =====================================================
  Local Pagination
  =====================================================

  لأن Slice الحالي لا يحتاج setPage وsetLimit.
  page وlimit يرسلان ضمن query.
  =====================================================
  */

  const [pagination, setPagination] = useState({
    page: reduxPagination.page || 1,

    limit: reduxPagination.limit || 10,
  });

  /*
  =====================================================
  Form Modal State
  =====================================================
  */

  const [showModal, setShowModal] = useState(false);

  const [currentProvider, setCurrentProvider] = useState(null);

  const [formMode, setFormMode] = useState("create");

  const [formErrors, setFormErrors] = useState({});

  const [loadingSave, setLoadingSave] = useState(false);

  /*
  =====================================================
  Details Modal
  =====================================================
  */

  const [showDetails, setShowDetails] = useState(false);

  /*
  =====================================================
  Delete Modal
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

    environment: "",

    isActive: "",
  });

  /*
  =====================================================
  Form Config
  =====================================================
  */

  const memoizedConfig = useMemo(
    () =>
      paymentProviderFormConfig({
        mode: formMode === "update" ? "edit" : formMode,

        credentialStatus: currentProvider?.credentialStatus || {},
      }),
    [formMode, currentProvider?.credentialStatus],
  );

  /*
  =====================================================
  Fetch List
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

    dispatch(fetchPaymentProviders(query));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  /*
  =====================================================
  Reset Page On Filters Change
  =====================================================
  */

  useEffect(() => {
    setPagination((current) => ({
      ...current,

      page: 1,
    }));
  }, [filters]);

  /*
  =====================================================
  Close Form Modal
  =====================================================
  */

  const closeFormModal = () => {
    setShowModal(false);

    setCurrentProvider(null);

    setFormMode("create");

    setFormErrors({});
  };

  /*
  =====================================================
  Open Create
  =====================================================
  */

  const openCreateModal = () => {
    setFormMode("create");

    setCurrentProvider(createInitialProvider());

    setFormErrors({});

    setShowModal(true);
  };

  /*
  =====================================================
  Load Provider Details
  =====================================================

  صفحة القائمة قد لا تحتوي credentialStatus،
  لذلك نجلب التفاصيل قبل edit أو clone أو view.
  =====================================================
  */

  const loadProviderDetails = async (providerId) => {
    return dispatch(fetchPaymentProviderById(providerId)).unwrap();
  };

  /*
  =====================================================
  Open Update
  =====================================================
  */

  const openUpdateModal = async (provider) => {
    try {
      const response = await loadProviderDetails(provider._id);

      const detailedProvider =
        response?.data || response || selectedProvider || provider;

      setFormMode("update");

      const config = paymentProviderFormConfig({
        mode: "edit",

        credentialStatus: detailedProvider?.credentialStatus || {},
      });

      setCurrentProvider(
        prepareProviderForForm({
          provider: detailedProvider,

          config,
        }),
      );

      setFormErrors({});

      setShowModal(true);
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic
            ? "تعذر جلب بيانات مزود الدفع"
            : "Failed to load payment provider"),
      );
    }
  };

  /*
  =====================================================
  Clone
  =====================================================

  لا يتم نسخ:
  -----------------------------------------------------
  - _id
  - code
  - credentials
  - credentialStatus
  - status الفعال
  =====================================================
  */

  const openCloneModal = async (provider) => {
    try {
      const response = await loadProviderDetails(provider._id);

      const detailedProvider = response?.data || response || provider;

      const config = paymentProviderFormConfig({
        mode: "clone",

        credentialStatus: {},
      });

      const normalized = prepareProviderForForm({
        provider: detailedProvider,

        config,
      });

      setFormMode("clone");

      setCurrentProvider({
        ...normalized,

        _id: undefined,

        code: "",

        nameAr: `${detailedProvider.nameAr || ""} (نسخة)`,

        nameEn: `${detailedProvider.nameEn || detailedProvider.nameAr || ""} (Copy)`,

        credentials: {
          ...EMPTY_CREDENTIALS,
        },

        credentialStatus: {},

        isActive: false,
      });

      setFormErrors({});

      setShowModal(true);
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic
            ? "تعذر تجهيز نسخة مزود الدفع"
            : "Failed to prepare provider clone"),
      );
    }
  };

  /*
  =====================================================
  Open Details
  =====================================================
  */

  const openDetailsModal = async (provider) => {
    try {
      const response = await loadProviderDetails(provider._id);

      setCurrentProvider(response?.data || response || provider);

      setShowDetails(true);
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic
            ? "تعذر جلب تفاصيل مزود الدفع"
            : "Failed to load provider details"),
      );
    }
  };

  /*
  =====================================================
  Refresh List
  =====================================================
  */

  const refreshProviders = async () => {
    const query = buildQuery(filters, pagination);

    await dispatch(fetchPaymentProviders(query));
  };

  /*
  =====================================================
  Save
  =====================================================
  */

  const handleSave = async (data) => {
    const formData = data?.formState || data || {};

    const payload = prepareProviderPayload({
      formData,

      config: memoizedConfig,

      mode: formMode,
    });

    setLoadingSave(true);

    setFormErrors({});

    try {
      if (formMode === "update") {
        await dispatch(
          updatePaymentProvider({
            providerId: currentProvider._id,

            data: payload,
          }),
        ).unwrap();

        toast.success(
          isArabic
            ? "تم تحديث مزود الدفع بنجاح"
            : "Payment provider updated successfully",
        );
      } else {
        await dispatch(createPaymentProvider(payload)).unwrap();

        toast.success(
          formMode === "clone"
            ? isArabic
              ? "تم نسخ مزود الدفع بنجاح"
              : "Payment provider cloned successfully"
            : isArabic
              ? "تم إضافة مزود الدفع بنجاح"
              : "Payment provider added successfully",
        );
      }

      closeFormModal();

      await refreshProviders();
    } catch (err) {
      const backendErrors = err?.errors || err?.data?.errors || {};

      if (backendErrors && typeof backendErrors === "object") {
        setFormErrors(backendErrors);
      }

      const field = err?.field || err?.data?.field;

      const message =
        err?.message ||
        err?.data?.message ||
        err ||
        (isArabic ? "حدث خطأ أثناء الحفظ" : "Save failed");

      /*
        دعم أخطاء الحقل المفرد القادمة من AppError.
        */

      if (field && typeof message === "string") {
        setFormErrors((current) => ({
          ...current,

          [field]: message,
        }));
      }

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
  Update Status
  =====================================================
  */

  const handleStatusChange = async (provider, isActive) => {
    try {
      await dispatch(
        updatePaymentProviderStatus({
          providerId: provider._id,

          isActive,
        }),
      ).unwrap();

      toast.success(
        isActive
          ? isArabic
            ? "تم تفعيل مزود الدفع"
            : "Payment provider activated"
          : isArabic
            ? "تم تعطيل مزود الدفع"
            : "Payment provider deactivated",
      );
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic ? "تعذر تحديث حالة مزود الدفع" : "Status update failed"),
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
      await dispatch(deletePaymentProvider(deleteModal.id)).unwrap();

      toast.success(
        isArabic ? "تم حذف مزود الدفع" : "Payment provider deleted",
      );

      await refreshProviders();
    } catch (err) {
      toast.error(
        err?.message ||
          err ||
          (isArabic ? "تعذر حذف مزود الدفع" : "Delete failed"),
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
  Labels
  =====================================================
  */

  const providerLabel = (code) => {
    const labels = {
      HYPERPAY: {
        ar: "هايبر باي",
        en: "HyperPay",
      },

      MOYASAR: {
        ar: "ميسر",
        en: "Moyasar",
      },

      GEIDEA: {
        ar: "جيديا",
        en: "Geidea",
      },

      PAYTABS: {
        ar: "بي تابس",
        en: "PayTabs",
      },

      TAP: {
        ar: "تاب",
        en: "Tap Payments",
      },

      STRIPE: {
        ar: "سترايب",
        en: "Stripe",
      },
    };

    return labels?.[code]?.[isArabic ? "ar" : "en"] || code || "-";
  };

  const environmentLabel = (environment) => {
    if (environment === "LIVE") {
      return isArabic ? "فعلي" : "Live";
    }

    if (environment === "TEST") {
      return isArabic ? "تجريبي" : "Test";
    }

    return environment || "-";
  };

  const paymentMethodLabel = (method) => {
    const labels = {
      CARD: isArabic ? "بطاقات" : "Cards",

      MADA: "Mada",

      VISA: "Visa",

      MASTERCARD: "Mastercard",

      APPLE_PAY: "Apple Pay",

      STC_PAY: "STC Pay",

      SADAD: isArabic ? "سداد" : "SADAD",

      TAMARA: isArabic ? "تمارا" : "Tamara",

      TABBY: isArabic ? "تابي" : "Tabby",
    };

    return labels[method] || method;
  };

  /*
  =====================================================
  Credential Status
  =====================================================
  */

  const getCredentialSummary = (provider) => {
    const statuses = Object.values(provider?.credentialStatus || {});

    if (!statuses.length) {
      return {
        configured: 0,

        total: 0,

        complete: false,
      };
    }

    const configured = statuses.filter(Boolean).length;

    return {
      configured,

      total: statuses.length,

      complete: configured === statuses.length,
    };
  };

  /*
  =====================================================
  Columns
  =====================================================
  */

  const columns = [
    {
      header: isArabic ? "المزود" : "Provider",

      render: (row) => (
        <div>
          <div className="fw-semibold">
            {isArabic ? row.nameAr || row.nameEn : row.nameEn || row.nameAr}
          </div>

          <small className="text-muted">{providerLabel(row.code)}</small>
        </div>
      ),
    },

    {
      header: isArabic ? "الكود" : "Code",

      align: "center",

      render: (row) => <Badge bg="dark">{row.code || "-"}</Badge>,
    },

    {
      header: isArabic ? "البيئة" : "Environment",

      align: "center",

      render: (row) => (
        <Badge
          bg={row.environment === "LIVE" ? "success" : "warning"}
          text={row.environment === "TEST" ? "dark" : undefined}
        >
          {environmentLabel(row.environment)}
        </Badge>
      ),
    },

    {
      header: isArabic ? "طرق الدفع" : "Payment Methods",

      render: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {Array.isArray(row.supportedPaymentMethods) &&
          row.supportedPaymentMethods.length ? (
            row.supportedPaymentMethods.map((method) => (
              <Badge bg="info" text="dark" key={method}>
                {paymentMethodLabel(method)}
              </Badge>
            ))
          ) : (
            <span className="text-muted">-</span>
          )}
        </div>
      ),
    },

    {
      header: isArabic ? "الإعداد" : "Configuration",

      align: "center",

      render: (row) => {
        const summary = getCredentialSummary(row);

        /*
        القائمة قد لا تعيد credentialStatus.
        في هذه الحالة لا ندّعي أن الإعداد ناقص.
        */

        if (!summary.total) {
          return (
            <Badge bg="secondary">
              {isArabic ? "عرض التفاصيل" : "View Details"}
            </Badge>
          );
        }

        return (
          <Badge
            bg={summary.complete ? "success" : "warning"}
            text={summary.complete ? undefined : "dark"}
          >
            {summary.complete
              ? isArabic
                ? "مكتمل"
                : "Complete"
              : `${summary.configured}/${summary.total}`}
          </Badge>
        );
      },
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
                ? "مفعّل"
                : "Active"
              : isArabic
                ? "غير مفعّل"
                : "Inactive"}
          </Badge>

          <Form.Check
            type="switch"
            checked={Boolean(row.isActive)}
            onChange={(event) =>
              handleStatusChange(
                row,

                event.target.checked,
              )
            }
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

          <ActionButton action="view" onClick={() => openDetailsModal(row)} />

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
  Details Fields
  =====================================================
  */

  const credentialStatusText =
    Object.entries(currentProvider?.credentialStatus || {})
      .map(
        ([key, configured]) =>
          `${key}: ${
            configured
              ? isArabic
                ? "تم الإعداد"
                : "Configured"
              : isArabic
                ? "غير معد"
                : "Not configured"
          }`,
      )
      .join(" — ") || (isArabic ? "لا توجد معلومات" : "No information");

  const supportedMethodsText =
    Array.isArray(currentProvider?.supportedPaymentMethods) &&
    currentProvider.supportedPaymentMethods.length
      ? currentProvider.supportedPaymentMethods
          .map(paymentMethodLabel)
          .join("، ")
      : "-";

  /*
  =====================================================
  Render
  =====================================================
  */

  return (
    <div className="container-fluid py-5">
      <PageHeader
        titleAr="إدارة مزودي الدفع"
        titleEn="Payment Providers Management"
        subtitleAr="إدارة مزودي الدفع الإلكتروني وبيئات التشغيل وطرق الدفع المدعومة."
        subtitleEn="Manage online payment providers, environments, and supported payment methods."
      >
        <div className="d-flex justify-content-center w-100">
          <ActionButton
            action="add"
            label={isArabic ? "إضافة مزود دفع" : "Add Payment Provider"}
            onClick={openCreateModal}
          />
        </div>
      </PageHeader>

      <LoadingOverlay
        show={loading || detailsLoading}
        text={isArabic ? "جاري التحميل..." : "Loading..."}
      />

      <ErrorOverlay show={Boolean(error)} message={error?.message || error} />

      {/* Filters */}

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

          environment: {
            type: "select",

            col: 3,

            placeholder: isArabic ? "بيئة التشغيل" : "Environment",

            options: [
              {
                value: "TEST",

                labelAr: "تجريبي",

                labelEn: "Test",
              },

              {
                value: "LIVE",

                labelAr: "فعلي",

                labelEn: "Live",
              },
            ],
          },

          isActive: {
            type: "select",

            col: 3,

            placeholder: isArabic ? "حالة التفعيل" : "Active Status",

            options: [
              {
                value: "true",

                labelAr: "مفعّل",

                labelEn: "Active",
              },

              {
                value: "false",

                labelAr: "غير مفعّل",

                labelEn: "Inactive",
              },
            ],
          },
        }}
      />

      {/* Pagination */}

      <PaginationComponent
        total={reduxPagination.total || 0}
        page={reduxPagination.page || pagination.page}
        limit={reduxPagination.limit || pagination.limit}
        totalPages={reduxPagination.totalPages || 0}
        onPageChange={(newPage) =>
          setPagination((current) => ({
            ...current,

            page: newPage,
          }))
        }
        onLimitChange={(newLimit) =>
          setPagination({
            page: 1,

            limit: newLimit,
          })
        }
      />

      {/* Table */}

      <UniversalTable
        columns={columns}
        data={paymentProvidersList}
        lang={lang}
        emptyMessage={
          isArabic ? "لا يوجد مزودو دفع" : "No payment providers found"
        }
      />

      {/* Details Modal */}

      <EntityDetailsModal
        show={showDetails}
        onHide={() => {
          setShowDetails(false);

          setCurrentProvider(null);
        }}
        title={isArabic ? "تفاصيل مزود الدفع" : "Payment Provider Details"}
        fields={[
          {
            label: isArabic ? "المزود" : "Provider",

            value: providerLabel(currentProvider?.code),
          },

          {
            label: isArabic ? "الكود" : "Code",

            value: currentProvider?.code || "-",
          },

          {
            label: isArabic ? "الاسم بالعربية" : "Arabic Name",

            value: currentProvider?.nameAr || "-",
          },

          {
            label: isArabic ? "الاسم بالإنجليزية" : "English Name",

            value: currentProvider?.nameEn || "-",
          },

          {
            label: isArabic ? "بيئة التشغيل" : "Environment",

            value: environmentLabel(currentProvider?.environment),
          },

          {
            label: isArabic ? "رابط الخدمة" : "Base URL",

            value: currentProvider?.baseUrl || "-",
          },

          {
            label: isArabic ? "طرق الدفع المدعومة" : "Supported Methods",

            value: supportedMethodsText,
          },

          {
            label: isArabic ? "حالة بيانات الاعتماد" : "Credentials Status",

            value: credentialStatusText,
          },

          {
            label: isArabic ? "الوصف بالعربية" : "Arabic Description",

            value: currentProvider?.descriptionAr || "-",
          },

          {
            label: isArabic ? "الوصف بالإنجليزية" : "English Description",

            value: currentProvider?.descriptionEn || "-",
          },

          {
            label: isArabic ? "ترتيب العرض" : "Sort Order",

            value: currentProvider?.sortOrder ?? 0,
          },

          {
            label: isArabic ? "الحالة" : "Status",

            value: currentProvider?.isActive
              ? isArabic
                ? "مفعّل"
                : "Active"
              : isArabic
                ? "غير مفعّل"
                : "Inactive",
          },

          {
            label: isArabic ? "تاريخ الإنشاء" : "Created At",

            value: currentProvider?.createdAt
              ? new Date(currentProvider.createdAt).toLocaleString(
                  isArabic ? "ar-SA" : "en-US",
                )
              : "-",
          },

          {
            label: isArabic ? "آخر تعديل" : "Updated At",

            value: currentProvider?.updatedAt
              ? new Date(currentProvider.updatedAt).toLocaleString(
                  isArabic ? "ar-SA" : "en-US",
                )
              : "-",
          },
        ]}
        entity={currentProvider}
      />

      {/* Form Modal */}

      <UniversalFormModal
        show={showModal}
        onHide={closeFormModal}
        onSave={handleSave}
        config={memoizedConfig}
        initialData={currentProvider}
        errors={formErrors}
        loading={loadingSave || saving}
        titleAr={
          formMode === "update"
            ? "تعديل مزود الدفع"
            : formMode === "clone"
              ? "نسخ مزود الدفع"
              : "إضافة مزود دفع"
        }
        titleEn={
          formMode === "update"
            ? "Edit Payment Provider"
            : formMode === "clone"
              ? "Clone Payment Provider"
              : "Add Payment Provider"
        }
      />

      {/* Delete Confirmation */}

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
        title={isArabic ? "حذف مزود الدفع؟" : "Delete Payment Provider?"}
        message={
          isArabic
            ? `هل أنت متأكد من حذف مزود الدفع ${deleteModal.name || ""}؟`
            : `Are you sure you want to delete ${
                deleteModal.name || "this provider"
              }?`
        }
        confirmText={isArabic ? "نعم، احذف" : "Yes, Delete"}
        cancelText={isArabic ? "إلغاء" : "Cancel"}
        variant="delete"
      />
    </div>
  );
}
