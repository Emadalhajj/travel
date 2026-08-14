import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import BookingPartyDetailsForm from "../../../Components/shared/booking/BookingPartyDetailsForm";
import {
  fetchPublicDraftBookingById,
  updatePublicDraftBooking,
} from "../../../redux/public/bookingSlice";
import { apiUploadDraftDocument } from "../../../services/api/public/bookingApi";

const emptyTraveler = () => ({
  fullName: "",
  passportNumber: "",
  nationality: "",
  birthDate: "",
  gender: "male",
  passportImage: "",
  passportFiles: [],
});

export default function PublicCustomBookingCustomerPage() {
  const { draftId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { draftBooking, loading, submitLoading, error } = useSelector(
    (state) => state.publicBooking,
  );
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", nationality: "" });
  const [travelers, setTravelers] = useState([emptyTraveler()]);
  const [hosts, setHosts] = useState([]);
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState("");

  const requiredCount = useMemo(
    () => Math.max(1, Number(
      draftBooking?.data?.travelersCount ??
      draftBooking?.data?.pilgrimsCount ??
      draftBooking?.data?.searchCriteria?.travelersCount ?? 1,
    )),
    [draftBooking],
  );

  useEffect(() => {
    if (draftId) dispatch(fetchPublicDraftBookingById(draftId));
  }, [dispatch, draftId]);

  useEffect(() => {
    if (!draftBooking?._id) return;
    setCustomer({
      name: draftBooking.customer?.name || "",
      phone: draftBooking.customer?.phone || "",
      email: draftBooking.customer?.email || "",
      nationality: draftBooking.customer?.nationality || "",
    });
    const saved = Array.isArray(draftBooking.travelers) ? draftBooking.travelers : [];
    setHosts(Array.isArray(draftBooking.hosts) ? draftBooking.hosts : []);
    setTravelers(
      Array.from({ length: requiredCount }, (_, index) => ({
        ...emptyTraveler(),
        ...(saved[index] || {}),
      })),
    );
  }, [draftBooking, requiredCount]);

  const handleSave = async () => {
    const nextErrors = validate(customer, travelers, hosts, isArabic);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLocalError("");
      const normalizedTravelers = [];

      for (const traveler of travelers) {
        const file = (traveler.passportFiles || []).find((item) => item instanceof File);
        let passportImage = traveler.passportImage || "";
        if (file) {
          const uploaded = await apiUploadDraftDocument({ draftId, file });
          passportImage = uploaded?.data?.url || "";
        }
        const { passportFiles, ...travelerData } = traveler;
        normalizedTravelers.push({ ...travelerData, passportImage });
      }

      const normalizedHosts = [];
      for (const host of hosts) {
        const idFile = (host.idFiles || []).find((item) => item instanceof File);
        const addressFile = (host.nationalAddressFiles || []).find((item) => item instanceof File);
        let idImage = host.idImage || "";
        let nationalAddressImage = host.nationalAddressImage || "";
        if (idFile) idImage = (await apiUploadDraftDocument({ draftId, file: idFile }))?.data?.url || "";
        if (addressFile) nationalAddressImage = (await apiUploadDraftDocument({ draftId, file: addressFile }))?.data?.url || "";
        const { idFiles, nationalAddressFiles, ...hostData } = host;
        normalizedHosts.push({ ...hostData, idImage, nationalAddressImage });
      }

      await dispatch(updatePublicDraftBooking({
        draftId,
        data: { customer, travelers: normalizedTravelers, hosts: normalizedHosts, currentStep: "review" },
      })).unwrap();

      navigate(`/draft-booking/${draftId}`);
    } catch (saveError) {
      setLocalError(saveError?.message || saveError || (isArabic ? "تعذر حفظ البيانات" : "Unable to save details"));
    }
  };

  if (loading) return <PublicPageLayout><Loader /></PublicPageLayout>;

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="برنامج مخصص"
        eyebrowEn="Custom Package"
        titleAr="بيانات العميل والمعتمرين"
        titleEn="Customer and Travelers"
        subtitleAr="أكمل جميع البيانات في صفحة واحدة ثم انتقل للمراجعة."
        subtitleEn="Complete all details on one page, then continue to review."
      />
      <BookingProgressTimeline currentStep="customer_info" isArabic={isArabic} />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <ErrorOverlay show={Boolean(localError)} message={localError} />

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <BookingPartyDetailsForm
          customer={customer}
          travelers={travelers}
          hosts={hosts}
          onHostsChange={setHosts}
          onCustomerChange={(name, value) => {
            setCustomer((previous) => ({ ...previous, [name]: value }));
            setErrors((previous) => ({ ...previous, [`customer.${name}`]: "" }));
          }}
          onTravelerChange={(index, name, value) => {
            setTravelers((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item));
            setErrors((previous) => ({ ...previous, [`travelers.${index}.${name}`]: "" }));
          }}
          onAddTraveler={() => setTravelers((previous) => [...previous, emptyTraveler()])}
          onRemoveTraveler={(index) => setTravelers((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
          canAddTraveler={travelers.length < requiredCount}
          errors={errors}
          isArabic={isArabic}
        />
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={handleSave} disabled={submitLoading} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-50">
            {submitLoading ? (isArabic ? "جاري الحفظ..." : "Saving...") : (isArabic ? "حفظ والانتقال للمراجعة" : "Save and review")}
          </button>
          <button type="button" onClick={() => navigate("/custom-package-builder")} className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700">
            {isArabic ? "رجوع" : "Back"}
          </button>
        </div>
      </section>
    </PublicPageLayout>
  );
}

function validate(customer, travelers, hosts, isArabic) {
  const errors = {};
  const required = isArabic ? "هذا الحقل مطلوب" : "This field is required";
  ["name", "phone", "email", "nationality"].forEach((field) => {
    if (!String(customer[field] || "").trim()) errors[`customer.${field}`] = required;
  });
  if (customer.phone && !/^\+?\d{7,15}$/.test(customer.phone)) {
    errors["customer.phone"] = isArabic
      ? "رقم الجوال يجب أن يتكون من 7 إلى 15 رقمًا دون حروف"
      : "Phone number must contain 7 to 15 digits without letters";
  }
  travelers.forEach((traveler, index) => {
    ["fullName", "passportNumber", "nationality", "birthDate"].forEach((field) => {
      if (!String(traveler[field] || "").trim()) errors[`travelers.${index}.${field}`] = required;
    });
    if (!traveler.passportImage && !(traveler.passportFiles || []).length) {
      errors[`travelers.${index}.passportFiles`] = isArabic ? "صورة الجواز مطلوبة" : "Passport copy is required";
    }
  });
  const nationalIds = new Set();
  hosts.forEach((host, index) => {
    ["name", "nationalId", "phone", "birthDate", "nationalAddress"].forEach((field) => {
      if (!String(host[field] || "").trim()) errors[`hosts.${index}.${field}`] = required;
    });
    if (host.phone && !/^\+?\d{7,15}$/.test(host.phone)) errors[`hosts.${index}.phone`] = isArabic ? "رقم الجوال غير صالح" : "Invalid phone number";
    if (host.nationalId && nationalIds.has(host.nationalId.trim())) errors[`hosts.${index}.nationalId`] = isArabic ? "لا يمكن تكرار نفس المستضيف" : "The same host cannot be added twice";
    if (host.nationalId) nationalIds.add(host.nationalId.trim());
  });
  return errors;
}
