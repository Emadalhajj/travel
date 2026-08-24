import DraftBookingInfoCard from "../draft-bookings/DraftBookingInfoCard";
import AttachmentPreviewCard from "../attachments/AttachmentPreviewCard";
import { getNationalityLabel } from "../../../Utils/nationality";
import { formatDate } from "../../../Utils/dateUtils";
import { buildTravelerFullName, formatGenderLabel } from "../../../Utils/bookingDisplay";

export default function TravelerReviewCard({ traveler, index, t, isArabic = true }) {
  const travelerItems = [
    { label: t("fullName", "الاسم الكامل"), value: traveler.fullName || buildTravelerFullName(traveler) || "-" },
    { label: t("passportNumber", "رقم الجواز"), value: traveler.passportNumber || "-" },
    { label: t("nationality", "الجنسية"), value: getNationalityLabel(traveler.nationality, isArabic) },
    { label: t("birthDate", "تاريخ الميلاد"), value: formatDate(traveler.birthDate, { isArabic }) },
    { label: t("gender", "الجنس"), value: formatGenderLabel(traveler.gender, t) },
    { label: t("mobile", "رقم الجوال"), value: traveler.mobile || "-" },
    { label: t("whatsapp", "رقم الواتساب"), value: traveler.whatsapp || "-" },
  ];
  const attachments = [
    ["passportImage", t("passportImage", "صورة الجواز")],
    ["personalPhoto", t("personalPhoto", "الصورة الشخصية")],
    ["vaccinationCertificate", t("vaccinationCertificate", "شهادة التطعيم")],
    ["visaAttachment", t("visaAttachment", "مرفق التأشيرة")],
  ];

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-5 text-lg font-bold text-slate-900">{t("traveler", "معتمر")} {index + 1}</h3>
      <DraftBookingInfoCard title={t("travelerPersonalData", "البيانات الشخصية")} items={travelerItems} />
      <div className="mt-5">
        <h4 className="mb-3 text-sm font-bold text-slate-900">{t("travelerAttachments", "المستندات المرفقة")}</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attachments.map(([key, label]) => <AttachmentPreviewCard key={key} label={label} value={traveler[key]} isArabic={isArabic} />)}
        </div>
      </div>
    </article>
  );
}
