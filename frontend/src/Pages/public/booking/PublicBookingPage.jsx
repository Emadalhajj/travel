/*
1. استقبال programId
2. إنشاء Draft عند بدء الحجز
3. حفظ بيانات العميل
4. حفظ بيانات المعتمرين
5. مراجعة السعر والخدمات
6. تنفيذ completeDraftBooking
7. عرض صفحة النجاح
*/

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  fetchPublicProgramById,
  clearSelectedProgram,
} from "../../../redux/public/programSlice";

import {
  createPublicDraftBooking,
  updatePublicDraftBooking,
  resetPublicBooking,
} from "../../../redux/public/bookingSlice";

import usePublicBookingForm from "../../../hooks/public-booking/usePublicBookingForm";

import { getProgramAvailableSeats } from "../../../Components/shared/booking-wizard/bookingPricing";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import BookingPartyDetailsForm from "../../../Components/shared/booking/BookingPartyDetailsForm";
import { apiUploadDraftDocument } from "../../../services/api/public/bookingApi";

export default function PublicBookingPage() {
  const { programId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { selectedProgram, detailsLoading } = useSelector(
    (state) => state.publicPrograms,
  );

  const { submitLoading, error } = useSelector((state) => state.publicBooking);

  const {
    formData,
    pricing,
    handleCustomerChange,
    handleTravelerChange,
    addTraveler,
    removeTraveler,
    buildDraftCreatePayload,
    buildDraftUpdatePayload,
  } = usePublicBookingForm({
    selectedProgram,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(resetPublicBooking());

    if (programId) {
      dispatch(fetchPublicProgramById(programId));
    }

    return () => {
      dispatch(clearSelectedProgram());
    };
  }, [dispatch, programId]);

  const programName = useMemo(() => {
    if (!selectedProgram) return "";

    return isArabic
      ? selectedProgram.nameAr ||
          selectedProgram.name?.ar ||
          selectedProgram.nameEn
      : selectedProgram.nameEn ||
          selectedProgram.name?.en ||
          selectedProgram.nameAr;
  }, [selectedProgram, isArabic]);

  const travelers = formData.travelers || [];
  const availableSeats = getProgramAvailableSeats(selectedProgram);
  const inventoryLoading = detailsLoading;
  const reachedAvailableSeats =
    availableSeats !== null && travelers.length >= availableSeats;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validatePartyDetails(formData, isArabic);
    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmissionError("");
    setIsSubmitting(true);

    try {
      const createResult = await dispatch(
        createPublicDraftBooking(buildDraftCreatePayload()),
      ).unwrap();

      const draftId =
        createResult?.data?._id ||
        createResult?._id;

      if (!draftId) {
        throw new Error(
          isArabic
            ? "لم يتم استلام معرف المسودة بعد إنشائها"
            : "Draft ID was not returned after creation",
        );
      }

      const travelersWithPassports = [];

      for (const traveler of formData.travelers) {
        const selectedFile = (traveler.passportFiles || []).find(
          (file) => file instanceof File,
        );

        let passportImage = traveler.passportImage || "";

        if (selectedFile) {
          const uploaded = await apiUploadDraftDocument({
            draftId,
            file: selectedFile,
          });
          passportImage = uploaded?.data?.url || "";
        }

        const { passportFiles, ...travelerData } = traveler;
        travelersWithPassports.push({ ...travelerData, passportImage });
      }

      const updateResult = await dispatch(
        updatePublicDraftBooking({
          draftId,
          data: {
            ...buildDraftUpdatePayload(),
            travelers: travelersWithPassports,
          },
        }),
      ).unwrap();

      const updatedDraftId =
        updateResult?.data?._id ||
        updateResult?._id ||
        draftId;

      navigate(`/draft-booking/${updatedDraftId}`);
    } catch (submitError) {
      setSubmissionError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          (typeof submitError === "string" ? submitError : "") ||
          (isArabic
            ? "تعذر إنشاء مسودة الحجز"
            : "Unable to create the booking draft"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (detailsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            {t("draftBooking", "حجز مبدئي")}
          </p>

          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
            {t("completeBookingData", "إكمال بيانات الحجز")}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {t(
              "completeBookingDataDesc",
              "أدخل بيانات العميل والمعتمرين لإنشاء مسودة حجز قابلة للمراجعة.",
            )}
          </p>
        </div>

        <BookingProgressTimeline
          currentStep="customer_info"
          isArabic={isArabic}
        />

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {submissionError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submissionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <BookingPartyDetailsForm
              customer={formData.customer}
              travelers={formData.travelers}
              onCustomerChange={(name, value) => {
                handleCustomerChange(name, value);
                setValidationErrors((previous) => ({ ...previous, [`customer.${name}`]: "" }));
              }}
              onTravelerChange={(index, name, value) => {
                handleTravelerChange(index, name, value);
                setValidationErrors((previous) => ({ ...previous, [`travelers.${index}.${name}`]: "" }));
              }}
              onAddTraveler={addTraveler}
              onRemoveTraveler={removeTraveler}
              canAddTraveler={!inventoryLoading && !reachedAvailableSeats}
              errors={validationErrors}
              isArabic={isArabic}
            />
            {reachedAvailableSeats && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-700">
                  لا يمكن إضافة معتمر جديد، لأن عدد المعتمرين الحالي يساوي السعة
                  المتاحة لهذا البرنامج.
                </p>

                <p className="mt-1 text-xs text-red-600">
                  السعة المتاحة: {availableSeats} — عدد المعتمرين الحالي:{" "}
                  {travelers.length}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col md:flex-row gap-3">
              <button
                type="submit"
                disabled={submitLoading || isSubmitting}
                className="flex-1 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:bg-slate-400"
              >
                {submitLoading || isSubmitting
                  ? t("saving", "جاري الحفظ...")
                  : t("createDraftBooking", "إنشاء مسودة الحجز")}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/programs/${programId}`)}
                className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                {t("back", "رجوع")}
              </button>
            </div>
          </form>

          <aside className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-fit">
            <h2 className="text-lg font-bold text-slate-900">
              {t("bookingSummary", "ملخص الحجز")}
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow
                label={t("program", "البرنامج")}
                value={programName || "-"}
              />

              <SummaryRow
                label={t("travelersCount", "عدد المعتمرين")}
                value={formData.travelers.length}
              />

              <SummaryRow
                label={t("total", "الإجمالي")}
                value={`${pricing.total} ${pricing.currency}`}
              />
            </div>

            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">
              {t(
                "draftOnlyNote",
                "هذه ليست عملية تأكيد نهائي. سيتم حفظ البيانات كمسودة قابلة للمراجعة.",
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <strong className="text-end text-slate-900">{value}</strong>
    </div>
  );
}

function validatePartyDetails(formData, isArabic) {
  const errors = {};
  const required = isArabic ? "هذا الحقل مطلوب" : "This field is required";

  ["name", "phone", "email", "nationality"].forEach((field) => {
    if (!String(formData.customer?.[field] || "").trim()) {
      errors[`customer.${field}`] = required;
    }
  });

  if (
    formData.customer?.phone &&
    !/^\+?\d{7,15}$/.test(formData.customer.phone)
  ) {
    errors["customer.phone"] = isArabic
      ? "رقم الجوال يجب أن يتكون من 7 إلى 15 رقمًا دون حروف"
      : "Phone number must contain 7 to 15 digits without letters";
  }

  (formData.travelers || []).forEach((traveler, index) => {
    ["fullName", "passportNumber", "nationality", "birthDate"].forEach((field) => {
      if (!String(traveler?.[field] || "").trim()) {
        errors[`travelers.${index}.${field}`] = required;
      }
    });

    if (!traveler.passportImage && !(traveler.passportFiles || []).length) {
      errors[`travelers.${index}.passportFiles`] = isArabic
        ? "صورة الجواز مطلوبة"
        : "Passport copy is required";
    }
  });

  return errors;
}
