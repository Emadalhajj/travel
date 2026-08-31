import { formatImagePath } from "../../../Utils/imageUtils";

export default function ProgramCard({
  program,
  isArabic = true,
  t,
  onViewDetails,
}) {
  const name = getProgramName(program, isArabic);
  const description = getProgramDescription(program, isArabic);
  const image = getProgramImage(program);

const imageSrc = formatImagePath(image);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="h-52 overflow-hidden bg-slate-100">
       <img
  src={imageSrc}
  alt={name}
  loading="lazy"
  decoding="async"
  className="h-full w-full object-cover transition hover:scale-105"
/>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="line-clamp-1 text-xl font-bold text-slate-900">
            {name}
          </h2>

          {program.serviceLevel && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {program.serviceLevel}
            </span>
          )}
        </div>

        <p className="min-h-[44px] line-clamp-2 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-5 space-y-2 text-sm">
          <InfoRow
            label={t("duration", "المدة")}
            value={`${program.durationDays || "-"} ${t("days", "أيام")}`}
          />

          <InfoRow
            label={t("availableSeats", "المقاعد المتاحة")}
            value={program.capacity?.availableSeats ?? "-"}
          />

          <InfoRow
            label={t("priceStartsFrom", "السعر يبدأ من")}
            value={`${program.pricing?.totalPrice || 0} ${
              program.pricing?.currency || "SAR"
            }`}
            strongClassName="text-emerald-700"
          />
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-3 font-bold text-white transition hover:bg-emerald-800"
        >
          {t("viewProgramDetails", "عرض التفاصيل")}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, strongClassName = "text-slate-900" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <strong className={`text-end ${strongClassName}`}>
        {value}
      </strong>
    </div>
  );
}

function getProgramName(program, isArabic) {
  return isArabic
    ? program.nameAr || program.name?.ar || program.nameEn || program.name?.en || "-"
    : program.nameEn || program.name?.en || program.nameAr || program.name?.ar || "-";
}

function getProgramDescription(program, isArabic) {
  return isArabic
    ? program.shortDescriptionAr ||
        program.descriptionAr ||
        program.shortDescriptionEn ||
        program.descriptionEn ||
        ""
    : program.shortDescriptionEn ||
        program.descriptionEn ||
        program.shortDescriptionAr ||
        program.descriptionAr ||
        "";
}

function getProgramImage(program) {
  if (program.thumbnailUrl) return program.thumbnailUrl;
  if (Array.isArray(program.images) && program.images.length > 0) {
    return program.images[0]?.thumbnailUrl || program.images[0]?.url || program.images[0];
  }

  return "/images/default-program.jpg";
}
