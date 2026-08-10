import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Spinner,
} from "react-bootstrap";

import { useDispatch, useSelector } from "react-redux";

import { useTranslation } from "react-i18next";

import {
  toast,
} from "react-toastify";

/*
=============================================================================
Shared Components
=============================================================================
*/

import PageHeader from "../../../Components/layout/PageHeader";

import UniversalFormModal from "../../../Components/forms/UniversalFormModal";

import ConfirmDialog from "../../../Components/common/ConfirmModal";

import UniversalTable from "../../../Components/common/tables/UniversalTable";

import ActionButton from "../../../Components/common/buttons/ActionButton";

import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";

import EntityFilter from "../../../Components/common/EntityFilter";

/*
=============================================================================
Form Config
=============================================================================
*/

import buildPaymentConfigurationFormConfig from "../../../Components/common/ModalForms/payments/paymentConfigurationFormConfig";

/*
=============================================================================
Payment Configuration Redux
=============================================================================
*/

import {
  fetchPaymentConfigurations,
  createPaymentConfiguration,
  updatePaymentConfiguration,
  updatePaymentConfigurationStatus,
  deletePaymentConfiguration,
  clearPaymentConfigurationError,
  clearPaymentConfigurationSuccess,
  selectPaymentConfigurations,
  selectPaymentConfigurationPagination,
  selectPaymentConfigurationLoading,
  selectPaymentConfigurationActionLoading,
  selectPaymentConfigurationError,
  selectPaymentConfigurationFieldErrors,
  selectPaymentConfigurationSuccess,
} from "../../../redux/payments/paymentConfigurationSlice";

/*
=============================================================================
Related Data Redux
=============================================================================

عدّل أسماء الاستيرادات فقط إذا كانت مختلفة في مشروعك.
=============================================================================
*/

import { fetchPaymentMethods } from "../../../redux/payments/paymentMethodSlice";

import { fetchPaymentProviders } from "../../../redux/payments/paymentProviderSlice";

import { fetchBankAccounts } from "../../../redux/payments/bankAccountSlice";

import {
  PAYMENT_SECTION_OPTIONS,
  isPaymentMethodAvailableForConfiguration,
} from "../../../constants/payments/paymentConfigurationConstants";

/*
=============================================================================
Constants
=============================================================================
*/

const PAGE_LIMIT = 10;

const EMPTY_FILTERS = {
  search: "",
  sectionCode: "",
  paymentMethodCode: "",
  configurationType: "",
  isActive: "",
};

/*
=============================================================================
Helpers
=============================================================================
*/

const getItemId = (item) => item?._id || item?.id || null;

const normalizeRelationId = (value) => value?._id || value?.id || value || "";

const normalizeRelationIds = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map(normalizeRelationId).filter(Boolean);
};

const normalizeDateForForm = (value) => {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
};

const removeEmptyOptionalStrings = (payload) => {
  const result = {
    ...payload,
  };

  [
    "displayNameAr",
    "displayNameEn",
    "instructionsAr",
    "instructionsEn",
  ].forEach((fieldName) => {
    if (
      typeof result[fieldName] === "string" &&
      result[fieldName].trim() === ""
    ) {
      delete result[fieldName];
    }
  });

  return result;
};

/*
=============================================================================
Component
=============================================================================
*/

export default function AdminPaymentConfigurationsPage() {
  const dispatch = useDispatch();

  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  /*
  ===========================================================================
  Payment Configuration State
  ===========================================================================
  */

  const configurations = useSelector(selectPaymentConfigurations);

  const pagination = useSelector(selectPaymentConfigurationPagination);

  const loading = useSelector(selectPaymentConfigurationLoading);

  const actionLoading = useSelector(selectPaymentConfigurationActionLoading);

  const error = useSelector(selectPaymentConfigurationError);

  const fieldErrors = useSelector(selectPaymentConfigurationFieldErrors);

  const successMessage = useSelector(selectPaymentConfigurationSuccess);

  /*
  ===========================================================================
  Related State
  ===========================================================================

  عدّل مسارات state فقط لتطابق أسماء reducers الموجودة في store.
  ===========================================================================
  */

  const paymentMethods = useSelector(
    (state) =>
      state.paymentMethods
        ?.paymentMethodsList || [],
  );

  const paymentProviders = useSelector(
    (state) =>
      state.paymentProviders
        ?.paymentProvidersList || [],
  );

  const bankAccounts = useSelector(
    (state) =>
      state.bankAccounts
        ?.bankAccountsList || [],
  );

  /*
  ===========================================================================
  Local State
  ===========================================================================
  */

  const [showFormModal, setShowFormModal] = useState(false);

  const [selectedConfiguration, setSelectedConfiguration] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [detailsConfiguration, setDetailsConfiguration] = useState(null);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [currentPage, setCurrentPage] = useState(1);

  /*
  ===========================================================================
  Query
  ===========================================================================
  */

  const query = useMemo(
    () => ({
      page: currentPage,
      limit: PAGE_LIMIT,

      search: filters.search || undefined,

      sectionCode: filters.sectionCode || undefined,

      paymentMethodCode: filters.paymentMethodCode || undefined,

      configurationType: filters.configurationType || undefined,

      isActive: filters.isActive === "" ? undefined : filters.isActive,
    }),
    [currentPage, filters],
  );

  /*
  ===========================================================================
  Load Data
  ===========================================================================
  */

  const loadConfigurations = useCallback(() => {
    dispatch(fetchPaymentConfigurations(query));
  }, [dispatch, query]);

  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  useEffect(() => {
    dispatch(
      fetchPaymentMethods({
        page: 1,
        limit: 100,
        isActive: true,
      }),
    );

    dispatch(
      fetchPaymentProviders({
        page: 1,
        limit: 100,
        isActive: true,
      }),
    );

    dispatch(
      fetchBankAccounts({
        page: 1,
        limit: 100,
        isActive: true,
      }),
    );
  }, [dispatch]);

  /*
  ===========================================================================
  Form Config
  ===========================================================================
  */

  const formConfig = useMemo(
    () =>
      buildPaymentConfigurationFormConfig({
        paymentMethods,
        paymentProviders,
        bankAccounts,
      }),
    [paymentMethods, paymentProviders, bankAccounts],
  );

  const formFieldErrors = useMemo(
    () => {
      if (
        !fieldErrors
          ?.configurationType
      ) {
        return fieldErrors;
      }

      return {
        ...fieldErrors,
        paymentMethodCode:
          fieldErrors.configurationType,
      };
    },
    [fieldErrors],
  );

  /*
  ===========================================================================
  Initial Form Data
  ===========================================================================
  */

  const formInitialData = useMemo(() => {
    if (!selectedConfiguration) {
      return {};
    }

    return {
      ...selectedConfiguration,

      providerId: normalizeRelationId(selectedConfiguration.providerId),

      bankAccountIds: normalizeRelationIds(
        selectedConfiguration.bankAccountIds,
      ),

      supportedCurrencies: Array.isArray(
        selectedConfiguration.supportedCurrencies,
      )
        ? selectedConfiguration.supportedCurrencies
        : ["SAR"],

      availableFrom: normalizeDateForForm(selectedConfiguration.availableFrom),

      availableUntil: normalizeDateForForm(
        selectedConfiguration.availableUntil,
      ),
    };
  }, [selectedConfiguration]);

  /*
  ===========================================================================
  Modal Actions
  ===========================================================================
  */

  const handleOpenCreate = () => {
    dispatch(clearPaymentConfigurationError());

    dispatch(clearPaymentConfigurationSuccess());

    setSelectedConfiguration(null);

    setShowFormModal(true);
  };

  const handleOpenEdit = (configuration) => {
    dispatch(clearPaymentConfigurationError());

    dispatch(clearPaymentConfigurationSuccess());

    setSelectedConfiguration(configuration);

    setShowFormModal(true);
  };

  const handleClone = (configuration) => {
    dispatch(clearPaymentConfigurationError());

    dispatch(clearPaymentConfigurationSuccess());

    const {
      _id,
      id,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
      ...cloneData
    } = configuration;

    setSelectedConfiguration({
      ...cloneData,

      providerId: normalizeRelationId(configuration.providerId),

      bankAccountIds: normalizeRelationIds(configuration.bankAccountIds),

      isActive: false,
    });

    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    if (actionLoading) {
      return;
    }

    setShowFormModal(false);

    setSelectedConfiguration(null);

    dispatch(clearPaymentConfigurationError());
  };

  /*
  ===========================================================================
  Prepare Payload
  ===========================================================================
  */

  const preparePayload = (formState) => {
    const payload = {
      ...formState,

      providerId: formState.providerId || null,

      bankAccountIds: Array.isArray(formState.bankAccountIds)
        ? formState.bankAccountIds
        : [],

      supportedCurrencies: Array.isArray(formState.supportedCurrencies)
        ? formState.supportedCurrencies
        : [],

      minimumAmount:
        formState.minimumAmount === "" ||
        formState.minimumAmount === null ||
        formState.minimumAmount === undefined
          ? null
          : Number(formState.minimumAmount),

      maximumAmount:
        formState.maximumAmount === "" ||
        formState.maximumAmount === null ||
        formState.maximumAmount === undefined
          ? null
          : Number(formState.maximumAmount),

      sortOrder: Number(formState.sortOrder) || 0,

      availableFrom: formState.availableFrom || null,

      availableUntil: formState.availableUntil || null,

      // إعدادات الدفع الجديدة تكون مفعلة افتراضيًا؛
      // false الصريحة فقط هي التي تعطل السجل.
      isActive:
        formState.isActive !== false,

      requiresAttachment: Boolean(formState.requiresAttachment),

      requiresReference: Boolean(formState.requiresReference),
    };

    return removeEmptyOptionalStrings(payload);
  };

  /*
  ===========================================================================
  Save
  ===========================================================================
  */

  const handleSave = async (formData) => {
    /*
    UniversalForm يرجع formState مباشرة عند عدم وجود صور،
    ويرجع { formState, imageState } عند وجود مرفقات.
    */

    const rawFormState = formData?.formState || formData;

    const payload = preparePayload(rawFormState);

    try {
      const configurationId = getItemId(selectedConfiguration);

      if (configurationId) {
        await dispatch(
          updatePaymentConfiguration({
            configurationId,
            payload,
          }),
        ).unwrap();
      } else {
        await dispatch(createPaymentConfiguration(payload)).unwrap();
      }

      setShowFormModal(false);

      setSelectedConfiguration(null);

      loadConfigurations();
    } catch (saveError) {
      toast.error(
        saveError?.message ||
          (isArabic
            ? "تعذر حفظ إعداد الدفع"
            : "Failed to save payment configuration"),
      );
    }
  };

  /*
  ===========================================================================
  Status
  ===========================================================================
  */

  const handleToggleStatus = async (configuration) => {
    const configurationId = getItemId(configuration);

    if (!configurationId) {
      return;
    }

    try {
      await dispatch(
        updatePaymentConfigurationStatus({
          configurationId,

          isActive: !configuration.isActive,
        }),
      ).unwrap();

      loadConfigurations();
    } catch {
      // Redux يعرض الخطأ.
    }
  };

  /*
  ===========================================================================
  Delete
  ===========================================================================
  */

  const handleConfirmDelete = async () => {
    const configurationId = getItemId(deleteTarget);

    if (!configurationId) {
      return;
    }

    try {
      await dispatch(deletePaymentConfiguration(configurationId)).unwrap();

      setDeleteTarget(null);

      loadConfigurations();
    } catch {
      // Redux يعرض الخطأ.
    }
  };

  /*
  ===========================================================================
  Filters
  ===========================================================================
  */

  const handleFiltersChange = (
    nextFilters,
  ) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  /*
  ===========================================================================
  Labels
  ===========================================================================
  */

  const getSectionLabel = (sectionCode) => {
    const section = PAYMENT_SECTION_OPTIONS.find(
      (item) => item.value === sectionCode,
    );

    if (!section) {
      return sectionCode || "—";
    }

    return isArabic ? section.labelAr : section.labelEn;
  };

  const getPaymentMethodLabel = (configuration) => {
    const populatedMethod = configuration.paymentMethod;

    if (populatedMethod) {
      return isArabic
        ? populatedMethod.nameAr ||
            populatedMethod.nameEn ||
            populatedMethod.code
        : populatedMethod.nameEn ||
            populatedMethod.nameAr ||
            populatedMethod.code;
    }

    const method = paymentMethods.find(
      (item) => item.code === configuration.paymentMethodCode,
    );

    return isArabic
      ? method?.nameAr || method?.nameEn || configuration.paymentMethodCode
      : method?.nameEn || method?.nameAr || configuration.paymentMethodCode;
  };

  const getConfigurationTypeLabel = (
    configurationType,
  ) => {
    const labels = {
      PROVIDER: isArabic
        ? "مزود دفع"
        : "Provider",
      BANK_ACCOUNT: isArabic
        ? "حساب بنكي"
        : "Bank account",
      MANUAL: isArabic
        ? "يدوي"
        : "Manual",
    };

    return labels[configurationType] || configurationType || "—";
  };

  const columns = [
    {
      header: "#",
      align: "center",
      render: (row, index) =>
        (currentPage - 1) *
          PAGE_LIMIT +
        index +
        1,
    },
    {
      header: isArabic
        ? "القسم"
        : "Section",
      render: (row) => (
        <div>
          <div className="fw-semibold">
            {getSectionLabel(
              row.sectionCode,
            )}
          </div>
          <small className="text-muted">
            {row.sectionCode}
          </small>
        </div>
      ),
    },
    {
      header: isArabic
        ? "طريقة الدفع"
        : "Payment Method",
      render: (row) => (
        <div>
          <div className="fw-semibold">
            {getPaymentMethodLabel(
              row,
            )}
          </div>
          <small className="text-muted">
            {row.paymentMethodCode}
          </small>
        </div>
      ),
    },
    {
      header: isArabic
        ? "نوع الإعداد"
        : "Configuration Type",
      align: "center",
      render: (row) => (
        <Badge bg="secondary">
          {getConfigurationTypeLabel(
            row.configurationType,
          )}
        </Badge>
      ),
    },
    {
      header: isArabic
        ? "العملات"
        : "Currencies",
      render: (row) => (
        <div className="d-flex flex-wrap justify-content-center gap-1">
          {Array.isArray(
            row.supportedCurrencies,
          ) &&
          row.supportedCurrencies.length ? (
            row.supportedCurrencies.map(
              (currency) => (
                <Badge
                  bg="info"
                  text="dark"
                  key={currency}
                >
                  {currency}
                </Badge>
              ),
            )
          ) : (
            <span className="text-muted">
              —
            </span>
          )}
        </div>
      ),
    },
    {
      header: isArabic
        ? "الترتيب"
        : "Order",
      align: "center",
      render: (row) =>
        row.sortOrder ?? 0,
    },
    {
      header: isArabic
        ? "الحالة"
        : "Status",
      align: "center",
      render: (row) => (
        <div className="d-flex flex-column align-items-center gap-1">
          <Badge
            bg={
              row.isActive
                ? "success"
                : "secondary"
            }
          >
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
            checked={Boolean(
              row.isActive,
            )}
            disabled={actionLoading}
            onChange={() =>
              handleToggleStatus(
                row,
              )
            }
          />
        </div>
      ),
    },
    {
      header: isArabic
        ? "الإجراءات"
        : "Actions",
      align: "center",
      render: (row) => (
        <div className="d-flex justify-content-center gap-1">
          <ActionButton
            action="edit"
            onClick={() =>
              handleOpenEdit(row)
            }
          />
          <ActionButton
            action="clone"
            onClick={() =>
              handleClone(row)
            }
          />
          <ActionButton
            action="view"
            onClick={() =>
              setDetailsConfiguration(
                row,
              )
            }
          />
          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteTarget(row)
            }
          />
        </div>
      ),
    },
  ];

  /*
  ===========================================================================
  Render
  ===========================================================================
  */

  return (
    <div className="container-fluid py-4">
      <PageHeader
        title={isArabic ? "إعدادات الدفع" : "Payment configurations"}
        subtitle={
          isArabic
            ? "ربط طرق الدفع بالأقسام ومزودي الخدمات والحسابات البنكية"
            : "Connect payment methods with sections, providers and bank accounts"
        }
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            {isArabic ? "إضافة إعداد دفع" : "Add payment configuration"}
          </Button>
        }
      />

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => dispatch(clearPaymentConfigurationSuccess())}
        >
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => dispatch(clearPaymentConfigurationError())}
        >
          {error}
        </Alert>
      )}

      {/* ===============================================================
          Filters
      =============================================================== */}

      <EntityFilter
        filters={filters}
        setFilters={
          handleFiltersChange
        }
        config={{
          search: {
            type: "text",
            col: 4,
            placeholder: isArabic
              ? "البحث بالاسم أو الطريقة"
              : "Search name or method",
          },
          sectionCode: {
            type: "select",
            col: 2,
            placeholder: isArabic
              ? "القسم"
              : "Section",
            options:
              PAYMENT_SECTION_OPTIONS,
          },
          paymentMethodCode: {
            type: "select",
            col: 2,
            placeholder: isArabic
              ? "طريقة الدفع"
              : "Payment Method",
            options:
              paymentMethods
                .filter(
                  isPaymentMethodAvailableForConfiguration,
                )
                .map((method) => ({
                  value:
                    method.code,
                  labelAr:
                    method.nameAr ||
                    method.nameEn ||
                    method.code,
                  labelEn:
                    method.nameEn ||
                    method.nameAr ||
                    method.code,
                })),
          },
          configurationType: {
            type: "select",
            col: 2,
            placeholder: isArabic
              ? "نوع الإعداد"
              : "Configuration Type",
            options: [
              {
                value: "PROVIDER",
                labelAr: "مزود دفع",
                labelEn: "Provider",
              },
              {
                value:
                  "BANK_ACCOUNT",
                labelAr:
                  "حساب بنكي",
                labelEn:
                  "Bank Account",
              },
              {
                value: "MANUAL",
                labelAr: "يدوي",
                labelEn: "Manual",
              },
            ],
          },
          isActive: {
            type: "select",
            col: 2,
            placeholder: isArabic
              ? "حالة التفعيل"
              : "Active Status",
            options: [
              {
                value: "true",
                labelAr: "مفعّل",
                labelEn: "Active",
              },
              {
                value: "false",
                labelAr:
                  "غير مفعّل",
                labelEn:
                  "Inactive",
              },
            ],
          },
        }}
      />

      {/* ===============================================================
          Table
      =============================================================== */}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner />

              <div className="mt-3">
                {isArabic
                  ? "جارٍ تحميل إعدادات الدفع..."
                  : "Loading payment configurations..."}
              </div>
            </div>
          ) : (
            <UniversalTable
              columns={columns}
              data={configurations}
              lang={
                isArabic
                  ? "ar"
                  : "en"
              }
              emptyMessage={
                isArabic
                  ? "لا توجد إعدادات دفع"
                  : "No payment configurations found"
              }
            />
          )}
        </Card.Body>

        {pagination.totalPages > 1 && (
          <Card.Footer className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="outline-secondary"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              >
                {isArabic ? "السابق" : "Previous"}
              </Button>

              <span>
                {isArabic
                  ? `الصفحة ${currentPage} من ${pagination.totalPages}`
                  : `Page ${currentPage} of ${pagination.totalPages}`}
              </span>

              <Button
                variant="outline-secondary"
                disabled={currentPage >= pagination.totalPages || loading}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                {isArabic ? "التالي" : "Next"}
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      <EntityDetailsModal
        show={Boolean(
          detailsConfiguration,
        )}
        onHide={() =>
          setDetailsConfiguration(
            null,
          )
        }
        title={
          isArabic
            ? "تفاصيل إعداد الدفع"
            : "Payment Configuration Details"
        }
        fields={
          detailsConfiguration
            ? [
                {
                  label: isArabic
                    ? "القسم"
                    : "Section",
                  value:
                    getSectionLabel(
                      detailsConfiguration.sectionCode,
                    ),
                },
                {
                  label: isArabic
                    ? "طريقة الدفع"
                    : "Payment Method",
                  value:
                    getPaymentMethodLabel(
                      detailsConfiguration,
                    ),
                },
                {
                  label: isArabic
                    ? "نوع الإعداد"
                    : "Configuration Type",
                  value:
                    getConfigurationTypeLabel(
                      detailsConfiguration.configurationType,
                    ),
                },
                {
                  label: isArabic
                    ? "العملات"
                    : "Currencies",
                  value:
                    detailsConfiguration.supportedCurrencies?.join(
                      ", ",
                    ) || "—",
                },
                {
                  label: isArabic
                    ? "الترتيب"
                    : "Order",
                  value:
                    detailsConfiguration.sortOrder ??
                    0,
                },
                {
                  label: isArabic
                    ? "الحالة"
                    : "Status",
                  value:
                    detailsConfiguration.isActive
                      ? isArabic
                        ? "مفعّل"
                        : "Active"
                      : isArabic
                        ? "غير مفعّل"
                        : "Inactive",
                },
              ]
            : []
        }
      />

      {/* ===============================================================
          Form Modal
      =============================================================== */}

      <UniversalFormModal
        show={showFormModal}
        onHide={handleCloseForm}
        onSave={handleSave}
        config={formConfig}
        initialData={formInitialData}
        errors={formFieldErrors}
        loading={actionLoading}
        titleAr={
          getItemId(selectedConfiguration)
            ? "تعديل إعداد الدفع"
            : "إضافة إعداد دفع"
        }
        titleEn={
          getItemId(selectedConfiguration)
            ? "Edit payment configuration"
            : "Create payment configuration"
        }
      />

      {/* ===============================================================
          Delete Confirmation
      =============================================================== */}

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        title={isArabic ? "حذف إعداد الدفع" : "Delete payment configuration"}
        message={
          isArabic
            ? "هل أنت متأكد من حذف إعداد الدفع؟"
            : "Are you sure you want to delete this payment configuration?"
        }
      />
    </div>
  );
}
