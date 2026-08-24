import DraftBookingInfoCard from "../draft-bookings/DraftBookingInfoCard";
import AttachmentPreviewCard from "../attachments/AttachmentPreviewCard";

export default function HostReviewCard({ host, index, t, isArabic = true }) {
  const items = [
    { label: t("name", "الاسم"), value: host.name || "-" },
    { label: t("nationalId", "رقم الهوية أو الإقامة"), value: host.nationalId || "-" },
    { label: t("phone", "رقم الجوال"), value: host.phone || "-" },
    { label: t("nationalAddress", "العنوان الوطني"), value: host.nationalAddress || "-" },
  ];

  return (
    <article className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
      <h3 className="mb-4 text-lg font-bold text-slate-900">{t("host", "المستضيف")} {index + 1}</h3>
      <DraftBookingInfoCard title={t("hostData", "بيانات المستضيف")} items={items} />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AttachmentPreviewCard label={t("hostIdAttachment", "صورة الهوية أو الإقامة")} value={host.idImage} isArabic={isArabic} />
        <AttachmentPreviewCard label={t("nationalAddressAttachment", "صورة العنوان الوطني")} value={host.nationalAddressImage} isArabic={isArabic} />
      </div>
    </article>
  );
}
