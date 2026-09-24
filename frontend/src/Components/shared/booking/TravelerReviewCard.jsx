import DraftBookingInfoCard from "../draft-bookings/DraftBookingInfoCard";
import AttachmentPreviewCard from "../attachments/AttachmentPreviewCard";
import { getNationalityLabel } from "../../../Utils/nationality";
import { formatDate } from "../../../Utils/dateUtils";
import { buildTravelerFullName, formatGenderLabel } from "../../../Utils/bookingDisplay";

const resolveDuffelTitle = (traveler = {}) => {
  const title = String(traveler.title || "").toUpperCase();
  if (title === "MR") return "mr";
  if (title === "MRS") return "mrs";
  if (title === "MS") return "ms";
  return traveler.gender === "female" ? "miss" : "mr";
};

export const buildTravelerReviewItems = ({
  traveler = {},
  t,
  isArabic,
  isExternalFlight,
  allTravelers = [],
  supportedIdentityDocumentTypes = [],
}) => {
  if (!isExternalFlight) return [
    { label: t("fullName", "الاسم الكامل"), value: traveler.fullName || buildTravelerFullName(traveler) || "-" },
    { label: t("passportNumber", "رقم الجواز"), value: traveler.passportNumber || "-" },
    { label: t("nationality", "الجنسية"), value: getNationalityLabel(traveler.nationality, isArabic) },
    { label: t("birthDate", "تاريخ الميلاد"), value: formatDate(traveler.birthDate, { isArabic }) },
    { label: t("gender", "الجنس"), value: formatGenderLabel(traveler.gender, t) },
    { label: t("mobile", "رقم الجوال"), value: traveler.mobile || "-" },
    { label: t("whatsapp", "رقم الواتساب"), value: traveler.whatsapp || "-" },
  ];

  const categoryLabels = isArabic
    ? { adult: "بالغ", child: "طفل", infant_without_seat: "رضيع" }
    : { adult: "Adult", child: "Child", infant_without_seat: "Infant" };
  const documentNumber = traveler.documentNumber || traveler.passportNumber || "";
  const issuingCountry = traveler.documentIssuingCountry ||
    traveler.passportIssuingCountryCode || "";
  const passportSupported = supportedIdentityDocumentTypes
    .map((value) => String(value).toLowerCase())
    .includes("passport");
  const sendsIdentityDocument = passportSupported &&
    String(traveler.documentType || "PASSPORT").toUpperCase() === "PASSPORT" &&
    Boolean(documentNumber && issuingCountry && traveler.passportExpiryDate);
  const responsibleAdult = traveler.passengerCategory === "infant_without_seat"
    ? allTravelers.find((item) =>
      String(item._id || item.id || "") ===
      String(traveler.responsibleAdultTravelerId || ""))
    : null;

  return [
    { label: isArabic ? "فئة الراكب" : "Passenger category", value: categoryLabels[traveler.passengerCategory] || traveler.passengerCategory || "-" },
    { label: isArabic ? "اللقب المرسل للمزود" : "Provider title", value: resolveDuffelTitle(traveler) },
    { label: isArabic ? "الاسم الأول المرسل" : "Given name", value: traveler.firstName || traveler.givenName || "-" },
    { label: isArabic ? "اسم العائلة المرسل" : "Family name", value: traveler.lastName || traveler.familyName || "-" },
    { label: t("birthDate", "تاريخ الميلاد"), value: formatDate(traveler.birthDate, { isArabic }) },
    { label: t("gender", "الجنس"), value: formatGenderLabel(traveler.gender, t) },
    { label: isArabic ? "البريد المرسل" : "Email", value: traveler.email || "-" },
    { label: isArabic ? "الهاتف المرسل" : "Phone number", value: traveler.phoneNumber || "-" },
    { label: isArabic ? "نوع الوثيقة" : "Document type", value: traveler.documentType || "PASSPORT" },
    { label: isArabic ? "رقم الوثيقة" : "Document number", value: documentNumber || "-" },
    { label: isArabic ? "بلد إصدار الوثيقة" : "Issuing country", value: issuingCountry ? getNationalityLabel(issuingCountry, isArabic) : "-" },
    { label: isArabic ? "انتهاء الوثيقة" : "Document expiry", value: traveler.passportExpiryDate ? formatDate(traveler.passportExpiryDate, { isArabic }) : "-" },
    { label: isArabic ? "إرسال الوثيقة إلى المزود" : "Identity document sent", value: sendsIdentityDocument ? (isArabic ? "نعم" : "Yes") : (isArabic ? "لا" : "No") },
    ...(traveler.passengerCategory === "infant_without_seat" ? [{
      label: isArabic ? "البالغ المسؤول عن الرضيع" : "Responsible adult",
      value: responsibleAdult
        ? (responsibleAdult.firstName || responsibleAdult.givenName || responsibleAdult.fullName || "-")
        : "-",
    }] : []),
  ];
};

export default function TravelerReviewCard({
  traveler,
  index,
  t,
  isArabic = true,
  documentRequirements,
  isExternalFlight = false,
  allTravelers = [],
  supportedIdentityDocumentTypes = [],
}) {
  const travelerItems = buildTravelerReviewItems({
    traveler, t, isArabic, isExternalFlight, allTravelers,
    supportedIdentityDocumentTypes,
  });
  const attachments = [
    ["passport", "passportImage", t("passportImage", "صورة الجواز")],
    ["personalPhoto", "personalPhoto", t("personalPhoto", "الصورة الشخصية")],
    ["vaccinationCertificate", "vaccinationCertificate", t("vaccinationCertificate", "شهادة التطعيم")],
    ["visaAttachment", "visaAttachment", t("visaAttachment", "مرفق التأشيرة")],
  ].filter(([requirementKey, travelerKey]) => (
    (documentRequirements?.[requirementKey]?.visible !== false ||
      (requirementKey === "passport" &&
        documentRequirements?.travelDocument?.visible)) &&
      traveler[travelerKey]
  ));

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-5 text-lg font-bold text-slate-900">{isExternalFlight ? (isArabic ? "المسافر" : "Traveler") : t("traveler", "معتمر")} {index + 1}</h3>
      <DraftBookingInfoCard title={t("travelerPersonalData", "البيانات الشخصية")} items={travelerItems} />
      {attachments.length > 0 && <div className="mt-5">
        <h4 className="mb-3 text-sm font-bold text-slate-900">{t("travelerAttachments", "المستندات المرفقة")}</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attachments.map(([, key, label]) => <AttachmentPreviewCard key={key} label={label} value={traveler[key]} isArabic={isArabic} />)}
        </div>
      </div>}
    </article>
  );
}
