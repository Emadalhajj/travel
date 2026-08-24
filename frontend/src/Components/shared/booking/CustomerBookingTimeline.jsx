import { CheckCircle2, Circle, Clock3 } from "lucide-react";

const REVIEW_PAYMENT_STATUSES = new Set([
  "pending_approval",
  "pending_verification",
  "pending_review",
]);

export const buildCustomerBookingTimeline = ({
  bookingStatus = "",
  paymentStatus = "",
  latestPaymentStatus = "",
  isArabic = true,
} = {}) => {
  const confirmed = ["confirmed", "completed"].includes(bookingStatus);
  const completed = bookingStatus === "completed";
  const paidPending = latestPaymentStatus === "paid_pending_booking";
  const bankReview = REVIEW_PAYMENT_STATUSES.has(latestPaymentStatus);
  const paymentReceived = paymentStatus === "paid" || paidPending;
  const paymentLabel = paidPending
    ? (isArabic ? "تم استلام الدفع وجارٍ استكمال تأكيد الحجز" : "Payment received; booking confirmation is in progress")
    : bankReview
      ? (isArabic ? "تم استلام التحويل البنكي وهو قيد المراجعة" : "Bank transfer received and under review")
      : paymentReceived
        ? (isArabic ? "تم استلام الدفع" : "Payment received")
        : (isArabic ? "الدفع أو المراجعة" : "Payment or review");
  const progress = completed
    ? 5
    : confirmed
      ? 4
      : paidPending || bankReview
        ? 2
        : paymentReceived
          ? 3
          : 2;
  const labels = [
    isArabic ? "تم إنشاء الحجز" : "Booking created",
    isArabic ? "اكتملت بيانات الحجز" : "Booking details completed",
    paymentLabel,
    isArabic ? "تأكيد الحجز" : "Booking confirmation",
    isArabic ? "المستندات والفاوتشر" : "Documents and voucher",
  ];
  return labels.map((label, index) => ({
    key: ["created", "details", "payment", "confirmation", "documents"][index],
    label,
    status: index < progress ? "complete" : index === progress ? "current" : "upcoming",
  }));
};

export default function CustomerBookingTimeline(props) {
  const steps = buildCustomerBookingTimeline(props);
  const isArabic = props.isArabic !== false;
  return (
    <ol className="grid gap-3 md:grid-cols-5" dir={isArabic ? "rtl" : "ltr"}>
      {steps.map((step) => {
        const Icon = step.status === "complete" ? CheckCircle2 : step.status === "current" ? Clock3 : Circle;
        return (
          <li key={step.key} className={`rounded-xl border p-4 ${
            step.status === "complete" ? "border-emerald-200 bg-emerald-50" :
              step.status === "current" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
          }`}>
            <Icon className={step.status === "complete" ? "text-emerald-600" : step.status === "current" ? "text-amber-600" : "text-slate-300"} size={22} />
            <p className="mt-3 text-sm font-bold text-slate-800">{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}
