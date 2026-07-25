import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Badge,
} from "react-bootstrap";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  toast,
} from "react-toastify";

import {
  useTranslation,
} from "react-i18next";

import {
  createBankAccount,
  deleteBankAccount,
  fetchBankAccounts,
  setLimit,
  setPage,
  updateBankAccount,
  updateBankAccountStatus,
} from "../../../redux/payments/bankAccountSlice";

import {
  bankAccountFormConfig,
} from "../../../Components/common/ModalForms/payments/bankAccountFormConfig";

import {
  buildQuery,
} from "../../../Utils/buildQuery";

import {
  normalizeForForm,
} from "../../../Utils/formData/normalize";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";

export default function AdminBankAccountsPage() {
  const dispatch = useDispatch();

  const {
    i18n,
  } = useTranslation();

  const lang =
    i18n.language || "ar";

  const {
    bankAccountsList = [],
    loading,

    pagination = {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  } = useSelector(
    (state) =>
      state.bankAccounts || {},
  );

  /*
  =====================================================
  Modal State
  =====================================================
  */

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    currentAccount,
    setCurrentAccount,
  ] = useState(null);

  const [
    formMode,
    setFormMode,
  ] = useState("create");

  const [
    formErrors,
    setFormErrors,
  ] = useState({});

  const [
    loadingSave,
    setLoadingSave,
  ] = useState(false);

  /*
  =====================================================
  Delete State
  =====================================================
  */

  const [
    deleteModal,
    setDeleteModal,
  ] = useState({
    show: false,
    id: null,
  });

  /*
  =====================================================
  Filters
  =====================================================
  */

  const [
    filters,
    setFilters,
  ] = useState({
    search: "",
    currency: "",
    isActive: "",
    isPublic: "",
  });
/*
=====================================================
Details Modal
=====================================================
*/
const [showDetails , setShowDetails] = useState(false)
  /*
  =====================================================
  Form Config
  =====================================================
  */

  const memoizedConfig = useMemo(
  () => bankAccountFormConfig(),
  [],
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

    dispatch(
      fetchBankAccounts(query),
    );
  }, [
    dispatch,
    filters,
    pagination.page,
    pagination.limit,
  ]);

  /*
  =====================================================
  Open Create Modal
  =====================================================
  */

  const openCreateModal = () => {
    setFormMode("create");

    setCurrentAccount({
      bankNameAr: "",
      bankNameEn: "",

      accountNameAr: "",
      accountNameEn: "",

      beneficiaryName: "",
      accountNumber: "",

      iban: "",
      swiftCode: "",

      currency: "SAR",

      notesAr: "",
      notesEn: "",

      logo: "",

      isActive: true,
      isPublic: true,
      isDefault: false,

      sortOrder: 0,
    });

    setFormErrors({});
    setShowModal(true);
  };

  /*
  =====================================================
  Open Edit Modal
  =====================================================
  */

  const openEditModal = (
    account,
  ) => {
    setFormMode("update");

    setCurrentAccount(
      normalizeForForm(
        account,
        memoizedConfig,
      ),
    );

    setFormErrors({});
    setShowModal(true);
  };
  /*
=====================================================
Clone Bank Account
=====================================================

ينسخ بيانات الحساب إلى نموذج جديد، لكن:
- يحذف _id.
- يجعل الآيبان فارغًا؛ لأنه يجب أن يكون فريدًا.
- يجعل رقم الحساب فارغًا احتياطًا.
- يلغي الحساب الافتراضي.
=====================================================
*/

const openCloneModal = (account) => {
  const normalized =
    normalizeForForm(
      account,
      memoizedConfig,
    );

  setFormMode("clone");

  setCurrentAccount({
    ...normalized,

    _id: undefined,

    bankNameAr:
      `${account.bankNameAr || ""} (نسخة)`,

    bankNameEn:
      `${account.bankNameEn || account.bankNameAr || ""} (Copy)`,

    /*
    لا يجوز تكرار IBAN، لذلك يجب إدخال IBAN جديد.
    */
    iban: "",

    accountNumber: "",

    /*
    النسخة لا تصبح افتراضية تلقائيًا.
    */
    isDefault: false,
  });

  setFormErrors({});
  setShowModal(true);
};

  /*
  =====================================================
  Save
  =====================================================
  */

 /*
=====================================================
Save Bank Account
=====================================================

بعد النجاح:
1- عرض رسالة نجاح.
2- إغلاق الموديل.
3- إعادة تعيين بيانات النموذج.
4- إعادة جلب القائمة.
=====================================================
*/

const handleSave = async (data) => {
  const formData =
    data?.formState ||
    data ||
    {};

  setLoadingSave(true);
  setFormErrors({});

  try {
    if (formMode === "update") {
      await dispatch(
        updateBankAccount({
          id: currentAccount._id,
          data: formData,
        }),
      ).unwrap();

      toast.success(
        lang === "ar"
          ? "تم تحديث الحساب البنكي بنجاح"
          : "Bank account updated successfully",
      );
    } else {
      /*
      create أو clone كلاهما ينشئ سجلًا جديدًا.
      */

      await dispatch(
        createBankAccount(
          formData,
        ),
      ).unwrap();

      toast.success(
        formMode === "clone"
          ? lang === "ar"
            ? "تم نسخ الحساب البنكي بنجاح"
            : "Bank account cloned successfully"
          : lang === "ar"
            ? "تم إضافة الحساب البنكي بنجاح"
            : "Bank account added successfully",
      );
    }

    /*
    إغلاق النموذج بعد نجاح الطلب فقط.
    */

    setShowModal(false);
    setCurrentAccount(null);
    setFormMode("create");
    setFormErrors({});

    /*
    إعادة جلب القائمة بالفلترة والصفحة الحالية.
    */

    const query = buildQuery(
      filters,
      pagination,
    );

    await dispatch(
      fetchBankAccounts(query),
    );
  } catch (err) {
    /*
    handleApiError يضع الخطأ عادة في rejectWithValue.
    unwrap يرمي action.payload مباشرة.
    */

    const message =
      err?.message ||
      err?.data?.message ||
      err ||
      (lang === "ar"
        ? "حدث خطأ أثناء حفظ الحساب البنكي"
        : "Failed to save bank account");

    /*
    دعم أخطاء الحقول إذا أعادها الباك إند.
    */

    if (
      err?.errors &&
      typeof err.errors === "object"
    ) {
      setFormErrors(err.errors);
    }

    toast.error(
      typeof message === "string"
        ? message
        : lang === "ar"
          ? "حدث خطأ أثناء الحفظ"
          : "Save failed",
    );
  } finally {
    setLoadingSave(false);
  }
};
  /*
  =====================================================
  Delete
  =====================================================
  */

  const confirmDelete = async () => {
    try {
      await dispatch(
        deleteBankAccount(
          deleteModal.id,
        ),
      ).unwrap();

      toast.success(
        lang === "ar"
          ? "تم حذف الحساب البنكي"
          : "Bank account deleted",
      );

      const query = buildQuery(
        filters,
        pagination,
      );

      dispatch(
        fetchBankAccounts(query),
      );
    } catch {
      toast.error(
        lang === "ar"
          ? "حدث خطأ أثناء الحذف"
          : "Delete failed",
      );
    } finally {
      setDeleteModal({
        show: false,
        id: null,
      });
    }
  };

  /*
  =====================================================
  Status Update
  =====================================================
  */

  const handleStatusChange =
    async (
      account,
      field,
      value,
    ) => {
      try {
        await dispatch(
          updateBankAccountStatus({
            id: account._id,

            data: {
              [field]: value,
            },
          }),
        ).unwrap();

        toast.success(
          lang === "ar"
            ? "تم تحديث الحالة"
            : "Status updated",
        );

        const query = buildQuery(
          filters,
          pagination,
        );

        dispatch(
          fetchBankAccounts(query),
        );
      } catch {
        toast.error(
          lang === "ar"
            ? "تعذر تحديث الحالة"
            : "Status update failed",
        );
      }
    };

  /*
  =====================================================
  Table Columns
  =====================================================
  */

  const columns = [
    {
      header:
        lang === "ar"
          ? "البنك"
          : "Bank",

      render: (row) => (
        <div>
          <strong>
            {lang === "ar"
              ? row.bankNameAr
              : row.bankNameEn ||
                row.bankNameAr}
          </strong>

          <div className="small text-muted">
            {lang === "ar"
              ? row.accountNameAr
              : row.accountNameEn ||
                row.accountNameAr}
          </div>
        </div>
      ),
    },

    {
      header:
        lang === "ar"
          ? "الآيبان"
          : "IBAN",

      render: (row) => (
        <span
          dir="ltr"
          className="font-monospace"
        >
          {row.iban || "-"}
        </span>
      ),
    },

    {
      header:
        lang === "ar"
          ? "العملة"
          : "Currency",

      render: (row) =>
        row.currency || "SAR",
    },

    {
      header:
        lang === "ar"
          ? "الحالة"
          : "Status",

      render: (row) => (
        <div className="d-flex flex-column gap-1">
          <Badge
            bg={
              row.isActive
                ? "success"
                : "secondary"
            }
          >
            {row.isActive
              ? lang === "ar"
                ? "مفعل"
                : "Active"
              : lang === "ar"
                ? "غير مفعل"
                : "Inactive"}
          </Badge>

          <Badge
            bg={
              row.isPublic
                ? "info"
                : "secondary"
            }
          >
            {row.isPublic
              ? lang === "ar"
                ? "ظاهر للعملاء"
                : "Public"
              : lang === "ar"
                ? "مخفي"
                : "Hidden"}
          </Badge>

          {row.isDefault ? (
            <Badge bg="warning">
              {lang === "ar"
                ? "افتراضي"
                : "Default"}
            </Badge>
          ) : null}
        </div>
      ),
    },

    {
      header:
        lang === "ar"
          ? "الإجراءات"
          : "Actions",

      align: "center",

      render: (row) => (
        <div className="d-flex flex-wrap justify-content-center gap-1">
          <ActionButton
            action="edit"
            onClick={() =>
              openEditModal(row)
            }
          />

            <ActionButton
        action="clone"
        onClick={() =>
          openCloneModal(row)
        }
      />
       <ActionButton
        action="view"
        onClick={() => {
          setCurrentAccount(row);
          setShowDetails(true);
        }}
      />

          <ActionButton
            action={
              row.isActive
                ? "deactivate"
                : "activate"
            }
            onClick={() =>
              handleStatusChange(
                row,
                "isActive",
                !row.isActive,
              )
            }
          />

          <ActionButton
            action={
              row.isPublic
                ? "hide"
                : "show"
            }
            onClick={() =>
              handleStatusChange(
                row,
                "isPublic",
                !row.isPublic,
              )
            }
          />

          {!row.isDefault ? (
            <ActionButton
              action="default"
              label={
                lang === "ar"
                  ? "افتراضي"
                  : "Default"
              }
              onClick={() =>
                handleStatusChange(
                  row,
                  "isDefault",
                  true,
                )
              }
            />
          ) : null}

          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,
                id: row._id,
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
    <div className="container py-2">
      <PageHeader
        subtitleAr="إدارة الحسابات البنكية الخاصة بطرق الدفع"
        subtitleEn="Manage Payment Bank Accounts"
      />

      <div className="d-flex justify-content-center mb-4">
        <ActionButton
          action="add"
          label={
            lang === "ar"
              ? "إضافة حساب بنكي"
              : "Add Bank Account"
          }
          onClick={openCreateModal}
        />
      </div>

      <LoadingOverlay
        show={loading}
      />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",
            col: 3,
            placeholder:
              lang === "ar"
                ? "البحث باسم البنك أو الآيبان"
                : "Search bank or IBAN",
          },

          currency: {
            type: "select",
            col: 3,
            placeholder:
              lang === "ar"
                ? "العملة"
                : "Currency",

            options: [
              {
                value: "SAR",
                labelAr: "ريال سعودي",
                labelEn: "SAR",
              },
              {
                value: "USD",
                labelAr: "دولار",
                labelEn: "USD",
              },
              {
                value: "EUR",
                labelAr: "يورو",
                labelEn: "EUR",
              },
              {
                value: "AED",
                labelAr: "درهم إماراتي",
                labelEn: "AED",
              },
            ],
          },

          isActive: {
            type: "select",
            col: 3,
            placeholder:
              lang === "ar"
                ? "حالة التفعيل"
                : "Active Status",

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

          isPublic: {
            type: "select",
            col: 3,
            placeholder:
              lang === "ar"
                ? "الظهور للعملاء"
                : "Customer Visibility",

            options: [
              {
                value: "true",
                labelAr: "ظاهر",
                labelEn: "Visible",
              },
              {
                value: "false",
                labelAr: "مخفي",
                labelEn: "Hidden",
              },
            ],
          },
        }}
      />

     <UniversalFormModal
  show={showModal}
  onHide={() => {
    setShowModal(false);
    setCurrentAccount(null);
    setFormMode("create");
    setFormErrors({});
  }}
  onSave={handleSave}
  config={memoizedConfig}
  initialData={currentAccount}
  titleAr={
    formMode === "update"
      ? "تعديل الحساب البنكي"
      : formMode === "clone"
        ? "نسخ الحساب البنكي"
        : "إضافة حساب بنكي"
  }
  titleEn={
    formMode === "update"
      ? "Edit Bank Account"
      : formMode === "clone"
        ? "Clone Bank Account"
        : "Add Bank Account"
  }
  errors={formErrors}
  loading={loadingSave}
/>

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={
          pagination.totalPages
        }
        onPageChange={(newPage) =>
          dispatch(
            setPage(newPage),
          )
        }
        onLimitChange={(newLimit) =>
          dispatch(
            setLimit(newLimit),
          )
        }
      />

      <UniversalTable
        columns={columns}
        data={
          bankAccountsList
        }
        lang={lang}
        emptyMessage={
          lang === "ar"
            ? "لا توجد حسابات بنكية"
            : "No bank accounts found"
        }
      />
      <EntityDetailsModal
  show={showDetails}
  onHide={() => {
    setShowDetails(false);
    setCurrentAccount(null);
  }}
  title={
    lang === "ar"
      ? "تفاصيل الحساب البنكي"
      : "Bank Account Details"
  }
  images={
    currentAccount?.logo
      ? [currentAccount.logo]
      : []
  }
  fields={[
    {
      label:
        lang === "ar"
          ? "اسم البنك بالعربية"
          : "Arabic Bank Name",

      value:
        currentAccount?.bankNameAr ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "اسم البنك بالإنجليزية"
          : "English Bank Name",

      value:
        currentAccount?.bankNameEn ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "اسم الحساب بالعربية"
          : "Arabic Account Name",

      value:
        currentAccount?.accountNameAr ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "اسم الحساب بالإنجليزية"
          : "English Account Name",

      value:
        currentAccount?.accountNameEn ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "اسم المستفيد"
          : "Beneficiary Name",

      value:
        currentAccount?.beneficiaryName ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "رقم الحساب"
          : "Account Number",

      value:
        currentAccount?.accountNumber ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "رقم الآيبان"
          : "IBAN",

      value:
        currentAccount?.iban ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "رمز SWIFT / BIC"
          : "SWIFT / BIC",

      value:
        currentAccount?.swiftCode ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "العملة"
          : "Currency",

      value:
        currentAccount?.currency ||
        "SAR",
    },

    {
      label:
        lang === "ar"
          ? "تعليمات التحويل بالعربية"
          : "Arabic Transfer Instructions",

      value:
        currentAccount?.notesAr ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "تعليمات التحويل بالإنجليزية"
          : "English Transfer Instructions",

      value:
        currentAccount?.notesEn ||
        "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "ترتيب العرض"
          : "Sort Order",

      value:
        currentAccount?.sortOrder ?? 0,
    },

    {
      label:
        lang === "ar"
          ? "حالة التفعيل"
          : "Active Status",

      value:
        currentAccount?.isActive
          ? lang === "ar"
            ? "مفعل"
            : "Active"
          : lang === "ar"
            ? "غير مفعل"
            : "Inactive",
    },

    {
      label:
        lang === "ar"
          ? "الظهور للعملاء"
          : "Customer Visibility",

      value:
        currentAccount?.isPublic
          ? lang === "ar"
            ? "ظاهر للعملاء"
            : "Visible"
          : lang === "ar"
            ? "مخفي عن العملاء"
            : "Hidden",
    },

    {
      label:
        lang === "ar"
          ? "الحساب الافتراضي"
          : "Default Account",

      value:
        currentAccount?.isDefault
          ? lang === "ar"
            ? "نعم"
            : "Yes"
          : lang === "ar"
            ? "لا"
            : "No",
    },

    {
      label:
        lang === "ar"
          ? "تاريخ الإنشاء"
          : "Created At",

      value:
        currentAccount?.createdAt
          ? new Date(
              currentAccount.createdAt,
            ).toLocaleString(
              lang === "ar"
                ? "ar-SA"
                : "en-US",
            )
          : "غير متوفر",
    },

    {
      label:
        lang === "ar"
          ? "تاريخ آخر تعديل"
          : "Updated At",

      value:
        currentAccount?.updatedAt
          ? new Date(
              currentAccount.updatedAt,
            ).toLocaleString(
              lang === "ar"
                ? "ar-SA"
                : "en-US",
            )
          : "غير متوفر",
    },
  ]}
  entity={currentAccount}
/>

      <ConfirmDialog
        show={
          deleteModal.show
        }
        onHide={() =>
          setDeleteModal({
            show: false,
            id: null,
          })
        }
        onConfirm={
          confirmDelete
        }
        title={
          lang === "ar"
            ? "حذف الحساب البنكي؟"
            : "Delete Bank Account?"
        }
        message={
          lang === "ar"
            ? "هل أنت متأكد من حذف الحساب البنكي؟"
            : "Are you sure you want to delete this bank account?"
        }
        confirmText={
          lang === "ar"
            ? "نعم، احذف"
            : "Yes, Delete"
        }
        cancelText={
          lang === "ar"
            ? "إلغاء"
            : "Cancel"
        }
        variant="delete"
      />
    </div>
  );
}
