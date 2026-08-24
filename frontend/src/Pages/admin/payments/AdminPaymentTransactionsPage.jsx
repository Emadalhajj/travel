import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import PaginationComponent from "../../../Components/common/Pagination";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import PageHeader from "../../../Components/layout/PageHeader";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import {
  fetchPaymentTransactions,
  setPaymentTransactionFilters,
} from "../../../redux/payments/paymentTransactionSlice";
import { formatDate } from "../../../Utils/dateUtils";
import { formatPrice } from "../../../Utils/roundPrice";

const STATUS_VALUES = [
  "INITIATED",
  "PENDING",
  "PENDING_PROOF",
  "PENDING_APPROVAL",
  "PENDING_VERIFICATION",
  "PENDING_REVIEW",
  "PROCESSING",
  "AUTHORIZED",
  "CAPTURED",
  "SUCCESS",
  "PAID_PENDING_BOOKING",
  "FAILED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

export default function AdminPaymentTransactionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const { items, pagination, filters, listLoading, error } = useSelector(
    (state) => state.paymentTransactions,
  );

  useEffect(() => {
    dispatch(fetchPaymentTransactions(filters));
  }, [dispatch, filters]);

  const updateFilters = (nextFilters) => {
    dispatch(setPaymentTransactionFilters({
      ...nextFilters,
      page: 1,
      limit: filters.limit,
    }));
  };

  const setPage = (page) => {
    dispatch(setPaymentTransactionFilters({ page }));
  };

  const setLimit = (limit) => {
    dispatch(setPaymentTransactionFilters({ page: 1, limit }));
  };

  const filterConfig = useMemo(() => ({
    search: {
      col: 3,
      placeholder: isArabic
        ? "مرجع الدفع أو التحويل"
        : "Payment or transfer reference",
    },
    status: {
      type: "select",
      col: 2,
      placeholder: isArabic ? "الحالة" : "Status",
      options: STATUS_VALUES.map((status) => ({ value: status, label: status })),
    },
    paymentMethodCode: {
      col: 2,
      placeholder: isArabic ? "طريقة الدفع" : "Payment method",
    },
    providerCode: {
      col: 2,
      placeholder: isArabic ? "المزود" : "Provider",
    },
    dateFrom: {
      type: "date",
      col: 2,
      placeholder: isArabic ? "من تاريخ" : "From date",
    },
    dateTo: {
      type: "date",
      col: 2,
      placeholder: isArabic ? "إلى تاريخ" : "To date",
    },
  }), [isArabic]);

  const columns = useMemo(() => [
    {
      header: isArabic ? "المرجع" : "Reference",
      accessor: ["paymentReference", "paymentReference"],
      pdfRepeat: true,
    },
    {
      header: isArabic ? "الحجز" : "Booking",
      render: (item) => item.bookingNumber || "—",
    },
    {
      header: isArabic ? "الطريقة" : "Method",
      accessor: "paymentMethodCode",
    },
    {
      header: isArabic ? "المزود" : "Provider",
      render: (item) => item.providerCode || "—",
    },
    {
      header: isArabic ? "المبلغ" : "Amount",
      render: (item) => formatPrice(item.amount, item.currency || "SAR"),
      excelValue: (item) => item.amount ?? 0,
      pdfValue: (item) => item.amount ?? 0,
      excelType: "number",
    },
    {
      header: isArabic ? "العملة" : "Currency",
      accessor: "currency",
    },
    {
      header: isArabic ? "الحالة" : "Status",
      render: (item) => (
        <StatusBadge
          value={String(item.status || "").toLowerCase()}
          type="payment"
          isArabic={isArabic}
        />
      ),
      pdfValue: (item) => item.status || "—",
      excelValue: (item) => item.status || "—",
    },
    {
      header: isArabic ? "التاريخ" : "Date",
      render: (item) => formatDate(item.createdAt, { isArabic }),
      excelAccessor: "createdAt",
      excelType: "date",
    },
    {
      header: isArabic ? "الإجراءات" : "Actions",
      exportable: false,
      render: (item) => (
        <ActionButton
          action="view"
          label={isArabic ? "التفاصيل" : "Details"}
          tooltip={isArabic ? "عرض التفاصيل" : "View details"}
          onClick={() => navigate(
            `/admin/payments/payment-transactions/${item.transactionId}`,
          )}
        />
      ),
    },
  ], [isArabic, navigate]);

  return (
    <div className="container-fluid position-relative py-4" dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader
        titleAr="معاملات الدفع"
        titleEn="Payment Transactions"
        subtitleAr="متابعة معاملات الدفع وحالاتها ومراجعها دون عرض بيانات المزود الحساسة."
        subtitleEn="Review payment transactions, statuses, and references without exposing provider-sensitive data."
        actions={(
          <AdminPageActions>
            <ActionButton
              action="apply"
              label={isArabic ? "تحديث" : "Refresh"}
              onClick={() => dispatch(fetchPaymentTransactions(filters))}
            />
            <ExportTableButtons
              data={items}
              columns={columns}
              fileName="payment-transactions"
              lang={lang}
              title={isArabic ? "معاملات الدفع" : "Payment Transactions"}
            />
          </AdminPageActions>
        )}
      />

      <EntityFilter
        filters={filters}
        setFilters={updateFilters}
        config={filterConfig}
      />

      <LoadingOverlay
        show={listLoading}
        text={isArabic ? "جاري تحميل المعاملات..." : "Loading transactions..."}
      />
      <ErrorOverlay show={!listLoading && Boolean(error)} message={error} />

      {!error && (
        <div className="overflow-hidden rounded-3 border bg-white shadow-sm">
          <UniversalTable
            columns={columns}
            data={items}
            lang={lang}
            emptyMessage={isArabic ? "لا توجد معاملات دفع" : "No payment transactions"}
          />
        </div>
      )}

      {!error && pagination && (
        <div className="mt-4">
          <PaginationComponent
            total={pagination.total || 0}
            page={pagination.page || filters.page || 1}
            limit={pagination.limit || filters.limit || 20}
            totalPages={pagination.totalPages || 0}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}
    </div>
  );
}
