import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ActionButton from "../../../Components/common/buttons/ActionButton";
import EmptyState from "../../../Components/shared/common/EmptyState";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import PageHeader from "../../../Components/layout/PageHeader";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import {
  approveBankTransfer,
  cancelPaymentTransaction,
  capturePaymentTransaction,
  clearSelectedPaymentTransaction,
  fetchPaymentTransactionDetails,
  refundPaymentTransaction,
  rejectBankTransfer,
  verifyProviderPaymentTransaction,
} from "../../../redux/payments/paymentTransactionSlice";
import { formatDate } from "../../../Utils/dateUtils";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatPrice } from "../../../Utils/roundPrice";

const ACTIONS = Object.freeze({
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  CAPTURE: "CAPTURE",
  REFUND: "REFUND",
  CANCEL: "CANCEL",
});

const REQUIRED_REASON_ACTIONS = new Set([
  ACTIONS.REJECT,
  ACTIONS.REFUND,
  ACTIONS.CANCEL,
]);

const userName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.username ||
  user?.email ||
  "—";

export default function AdminPaymentTransactionDetailsPage() {
  const { transactionId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";
  const [dialog, setDialog] = useState(null);

  const {
    selectedTransaction: transaction,
    detailsLoading,
    operationLoading,
    error,
  } = useSelector((state) => state.paymentTransactions);

  useEffect(() => {
    dispatch(fetchPaymentTransactionDetails(transactionId));
    return () => {
      dispatch(clearSelectedPaymentTransaction());
    };
  }, [dispatch, transactionId]);

  const status = String(transaction?.status || "").toUpperCase();
  const availableActions = useMemo(() => ({
    approve:
      transaction?.paymentMethodCode === "BANK_TRANSFER" &&
      ["PENDING_VERIFICATION", "PENDING_REVIEW"].includes(status),
    reject:
      transaction?.paymentMethodCode === "BANK_TRANSFER" &&
      ["PENDING_VERIFICATION", "PENDING_REVIEW"].includes(status),
    capture: transaction?.providerCode
      ? status === "AUTHORIZED"
      : ["AUTHORIZED", "PENDING_REVIEW"].includes(status),
    verify:
      Boolean(transaction?.providerCode) &&
      ["INITIATED", "PROCESSING"].includes(status),
    refund: ["CAPTURED", "SUCCESS", "PAID_PENDING_BOOKING"].includes(status),
    cancel: [
      "INITIATED",
      "PENDING",
      "PENDING_PROOF",
      "PENDING_APPROVAL",
      "PENDING_VERIFICATION",
      "PENDING_REVIEW",
      "PROCESSING",
      "AUTHORIZED",
    ].includes(status),
  }), [status, transaction]);

  const timeline = useMemo(
    () => [...(transaction?.timeline || [])].sort(
      (first, second) => new Date(first.createdAt) - new Date(second.createdAt),
    ),
    [transaction?.timeline],
  );

  const dialogLabels = useMemo(() => ({
    [ACTIONS.APPROVE]: {
      ar: "اعتماد التحويل البنكي",
      en: "Approve bank transfer",
    },
    [ACTIONS.REJECT]: { ar: "رفض التحويل البنكي", en: "Reject bank transfer" },
    [ACTIONS.CAPTURE]: { ar: "تأكيد تحصيل الدفعة", en: "Capture payment" },
    [ACTIONS.REFUND]: { ar: "استرداد الدفعة", en: "Refund payment" },
    [ACTIONS.CANCEL]: { ar: "إلغاء معاملة الدفع", en: "Cancel payment" },
  }), []);

  const actionFormConfig = useMemo(() => ({
    commonFields: [{
      name: "reason",
      labelAr: REQUIRED_REASON_ACTIONS.has(dialog) ? "السبب" : "ملاحظات",
      labelEn: REQUIRED_REASON_ACTIONS.has(dialog) ? "Reason" : "Notes",
      type: "textarea",
      rows: 3,
      col: 12,
      required: REQUIRED_REASON_ACTIONS.has(dialog),
    }],
  }), [dialog]);

  const reportOperationError = (operationError) => {
    const message = handleApiError(
      operationError,
      (value) => value,
      lang,
    );
    toast.error(message || (isArabic ? "تعذر تنفيذ العملية" : "Operation failed"));
  };

  const refreshDetails = () =>
    dispatch(fetchPaymentTransactionDetails(transactionId)).unwrap();

  const executeAction = async ({ reason = "" } = {}) => {
    const payload = { transactionId };
    try {
      if (dialog === ACTIONS.APPROVE) {
        payload.notes = reason.trim();
        await dispatch(approveBankTransfer(payload)).unwrap();
      } else if (dialog === ACTIONS.REJECT) {
        payload.reason = reason.trim();
        await dispatch(rejectBankTransfer(payload)).unwrap();
      } else if (dialog === ACTIONS.CAPTURE) {
        payload.notes = reason.trim();
        await dispatch(capturePaymentTransaction(payload)).unwrap();
      } else if (dialog === ACTIONS.REFUND) {
        payload.reason = reason.trim();
        await dispatch(refundPaymentTransaction(payload)).unwrap();
      } else if (dialog === ACTIONS.CANCEL) {
        payload.reason = reason.trim();
        await dispatch(cancelPaymentTransaction(payload)).unwrap();
      }

      setDialog(null);
      toast.success(isArabic ? "تم تنفيذ عملية الدفع بنجاح" : "Payment operation completed");
      await refreshDetails();
    } catch (operationError) {
      reportOperationError(operationError);
    }
  };

  const verifyProviderPayment = async () => {
    try {
      await dispatch(verifyProviderPaymentTransaction({ transactionId })).unwrap();
      toast.success(isArabic ? "تم تحديث حالة الدفع" : "Payment status updated");
      await refreshDetails();
    } catch (verificationError) {
      reportOperationError(verificationError);
    }
  };

  const summaryFields = transaction ? [
    [isArabic ? "الحالة" : "Status", (
      <StatusBadge
        value={status.toLowerCase()}
        type="payment"
        isArabic={isArabic}
      />
    )],
    [isArabic ? "مرجع الدفع" : "Payment reference", transaction.paymentReference || "—"],
    [isArabic ? "مرجع المزود" : "Provider reference", transaction.providerReference || "—"],
    [isArabic ? "المبلغ" : "Amount", formatPrice(transaction.amount, transaction.currency || "SAR")],
    [isArabic ? "طريقة الدفع" : "Payment method", transaction.paymentMethodCode || "—"],
    [isArabic ? "مزود الدفع" : "Payment provider", transaction.providerCode || "—"],
    [isArabic ? "رقم الحجز" : "Booking number", transaction.bookingNumber || transaction.booking?.bookingNumber || "—"],
    [isArabic ? "تاريخ الإنشاء" : "Created at", formatDate(transaction.createdAt, { isArabic })],
    [isArabic ? "تم التحقق بواسطة" : "Verified by", userName(transaction.verifiedBy)],
    [isArabic ? "تاريخ التحقق" : "Verified at", formatDate(transaction.verifiedAt, { isArabic })],
  ] : [];

  return (
    <div className="container-fluid position-relative py-4" dir={isArabic ? "rtl" : "ltr"}>
      <LoadingOverlay
        show={detailsLoading && !transaction}
        text={isArabic ? "جاري تحميل تفاصيل المعاملة..." : "Loading transaction details..."}
      />

      <PageHeader
        titleAr="تفاصيل معاملة الدفع"
        titleEn="Payment Transaction Details"
        subtitleAr={transaction?.paymentReference || transactionId}
        subtitleEn={transaction?.paymentReference || transactionId}
        actions={transaction ? (
          <AdminPageActions>
            {availableActions.approve && (
              <ActionButton action="activate" label={isArabic ? "اعتماد التحويل" : "Approve transfer"} onClick={() => setDialog(ACTIONS.APPROVE)} />
            )}
            {availableActions.reject && (
              <ActionButton action="deactivate" label={isArabic ? "رفض التحويل" : "Reject transfer"} onClick={() => setDialog(ACTIONS.REJECT)} />
            )}
            {availableActions.capture && (
              <ActionButton action="apply" label={isArabic ? "تأكيد التحصيل" : "Capture"} onClick={() => setDialog(ACTIONS.CAPTURE)} />
            )}
            {availableActions.verify && (
              <ActionButton action="view" disabled={operationLoading} label={isArabic ? "التحقق من الدفع" : "Verify payment"} onClick={verifyProviderPayment} />
            )}
            {availableActions.refund && (
              <ActionButton action="default" label={isArabic ? "استرداد" : "Refund"} onClick={() => setDialog(ACTIONS.REFUND)} />
            )}
            {availableActions.cancel && (
              <ActionButton action="delete" label={isArabic ? "إلغاء المعاملة" : "Cancel transaction"} onClick={() => setDialog(ACTIONS.CANCEL)} />
            )}
          </AdminPageActions>
        ) : null}
      />

      <ErrorOverlay show={Boolean(error)} message={error} />

      {!detailsLoading && !error && !transaction && (
        <EmptyState title={isArabic ? "معاملة الدفع غير موجودة" : "Payment transaction not found"} />
      )}

      {transaction && !error && (
        <div className="d-grid gap-4">
          <PublicSectionCard
            title={isArabic ? "ملخص المعاملة" : "Transaction summary"}
            subtitle={isArabic ? "البيانات التشغيلية الآمنة للمعاملة." : "Safe operational transaction data."}
          >
            <dl className="row g-3 mb-0">
              {summaryFields.map(([label, value]) => (
                <div className="col-12 col-md-6 col-xl-4" key={label}>
                  <dt className="small text-muted mb-1">{label}</dt>
                  <dd className="mb-0 fw-semibold text-break">{value}</dd>
                </div>
              ))}
            </dl>
            {transaction.bookingId && (
              <div className="mt-4">
                <ActionButton
                  action="view"
                  label={isArabic ? "فتح الحجز 360°" : "Open Booking 360°"}
                  onClick={() => navigate(`/admin/operations/bookings/${transaction.bookingId}`)}
                />
              </div>
            )}
          </PublicSectionCard>

          <PublicSectionCard
            title={isArabic ? "سجل الأحداث" : "Events timeline"}
            subtitle={isArabic ? "مرتب زمنيًا من الأقدم إلى الأحدث." : "Ordered chronologically from oldest to newest."}
          >
            {timeline.length ? (
              <div className="d-grid gap-3">
                {timeline.map((event, index) => (
                  <article
                    key={`${event.eventCode}-${event.createdAt}-${index}`}
                    className="rounded-3 border bg-light p-3"
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <strong>{event.eventCode || (isArabic ? "حدث دفع" : "Payment event")}</strong>
                      <small className="text-muted">{formatDate(event.createdAt, { isArabic })}</small>
                    </div>
                    <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
                      <StatusBadge value={String(event.fromStatus || "").toLowerCase()} type="payment" isArabic={isArabic} />
                      <span aria-hidden="true">→</span>
                      <StatusBadge value={String(event.toStatus || "").toLowerCase()} type="payment" isArabic={isArabic} />
                    </div>
                    {event.message && <p className="mb-0 mt-2 text-muted">{event.message}</p>}
                    <small className="d-block mt-2 text-muted">
                      {isArabic ? "نفذ بواسطة: " : "Performed by: "}{userName(event.createdBy)}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title={isArabic ? "لا توجد أحداث مسجلة" : "No events recorded"} />
            )}
          </PublicSectionCard>
        </div>
      )}

      <UniversalFormModal
        show={Boolean(dialog)}
        onHide={() => setDialog(null)}
        onSave={executeAction}
        config={actionFormConfig}
        initialData={{ reason: "" }}
        errors={{}}
        loading={operationLoading}
        titleAr={dialogLabels[dialog]?.ar || "تأكيد العملية"}
        titleEn={dialogLabels[dialog]?.en || "Confirm operation"}
      />
    </div>
  );
}
