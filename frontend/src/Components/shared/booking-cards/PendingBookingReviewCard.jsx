import { Clock3, CreditCard, Eye } from "lucide-react";

export default function PendingBookingReviewCard({
  request,
  isArabic = true,
  onView,
}) {
  const programName = isArabic
    ? request.program?.nameAr || request.program?.nameEn
    : request.program?.nameEn || request.program?.nameAr;

  const total = request.pricing?.totalAmount || request.pricing?.total || 0;
  const currency = request.pricing?.currency || "SAR";

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-extrabold text-slate-900">
              {programName || (isArabic ? "طلب حجز" : "Booking Request")}
            </h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              {isArabic ? "بانتظار مراجعة الدفع" : "Payment Review Pending"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <Info
              icon={<Clock3 size={16} />}
              label={isArabic ? "حالة الدفع" : "Payment Status"}
              value={request.paymentStatus || "PENDING_VERIFICATION"}
            />
            <Info
              icon={<CreditCard size={16} />}
              label={isArabic ? "طريقة الدفع" : "Payment Method"}
              value={request.paymentMethodCode || "BANK_TRANSFER"}
            />
            <Info
              label={isArabic ? "المبلغ" : "Amount"}
              value={`${total} ${currency}`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onView(request)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 px-5 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-50"
        >
          <Eye size={17} />
          {isArabic ? "عرض حالة الحجز" : "View Booking Status"}
        </button>
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-bold text-slate-900">{value || "-"}</div>
    </div>
  );
}
