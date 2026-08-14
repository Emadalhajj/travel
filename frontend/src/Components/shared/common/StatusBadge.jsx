export default function StatusBadge({
  value,
  type = "booking",
  isArabic = true,
}) {
  const bookingClasses = {
    draft: "bg-slate-100 text-slate-700",
    pending_review: "bg-amber-100 text-amber-800",
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const paymentClasses = {
    pending: "bg-amber-100 text-amber-700",
    partial: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-slate-100 text-slate-700",
  };

  const classes =
    type === "payment"
      ? paymentClasses[value]
      : bookingClasses[value];

  const bookingLabels = {
    draft: isArabic ? "مسودة" : "Draft",
    pending_review: isArabic ? "بانتظار المراجعة" : "Pending Review",
    confirmed: isArabic ? "مؤكد" : "Confirmed",
    completed: isArabic ? "مكتمل" : "Completed",
    cancelled: isArabic ? "ملغي" : "Cancelled",
  };

  const label =
    type === "booking"
      ? bookingLabels[value] || value
      : value;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        classes || "bg-slate-100 text-slate-700"
      }`}
    >
      {label || "-"}
    </span>
  );
}
