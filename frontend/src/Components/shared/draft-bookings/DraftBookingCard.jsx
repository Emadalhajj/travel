import StatusBadge from "../common/StatusBadge";

export default function DraftBookingCard({
  draft,
  isArabic = true,
  t,
  onView,
}) {
  const programName = getProgramName(draft, isArabic);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {draft.customer?.name || draft._id}
            </h2>

            <StatusBadge value={draft.status || "draft"} />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {programName || t("draftBooking", "مسودة حجز")}
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <MiniInfo
              label={t("createdAt", "تاريخ الإنشاء")}
              value={formatDate(draft.createdAt)}
            />

            <MiniInfo
              label={t("currentStep", "الخطوة الحالية")}
              value={draft.currentStep}
            />

            <MiniInfo
              label={t("travelersCount", "عدد المعتمرين")}
              value={draft.travelers?.length || 0}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          {t("viewDraft", "عرض المسودة")}
        </button>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function getProgramName(draft, isArabic) {
  return isArabic
    ? draft.program?.nameAr || draft.program?.nameEn
    : draft.program?.nameEn || draft.program?.nameAr;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-CA");
}