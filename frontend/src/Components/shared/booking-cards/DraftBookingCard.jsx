import BookingStatusBadge from "./BookingStatusBadge";

export default function DraftBookingCard({
  draft,
  onContinue,
  onCancel,
  disabled = false,
}) {
  const title =
    draft?.program?.nameAr ||
    draft?.program?.nameEn ||
    draft?.data?.selectedPackage?.nameAr ||
    draft?.data?.selectedPackage?.nameEn ||
    "مسودة حجز";

  const customerName = draft?.customer?.name || "-";

  const total = draft?.pricing?.total || 0;
  const currency = draft?.pricing?.currency || "SAR";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">
              {title}
            </h3>

            <BookingStatusBadge status={draft?.status} />
          </div>

          <p className="text-sm text-gray-500 mt-2">
            العميل: {customerName}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            الخطوة الحالية: {draft?.currentStep || "-"}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            آخر تحديث:{" "}
            {draft?.updatedAt
              ? new Date(draft.updatedAt).toLocaleDateString("ar-SA")
              : "-"}
          </p>
        </div>

        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {total} {currency}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onContinue?.(draft)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              متابعة
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onCancel?.(draft)}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}