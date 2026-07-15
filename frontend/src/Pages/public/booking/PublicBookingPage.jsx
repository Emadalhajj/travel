/*
1. استقبال programId
2. إنشاء Draft عند بدء الحجز
3. حفظ بيانات العميل
4. حفظ بيانات المعتمرين
5. مراجعة السعر والخدمات
6. تنفيذ completeDraftBooking
7. عرض صفحة النجاح
*/

import { useEffect, useMemo } from "react";
import { Row } from "react-bootstrap";
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

import { publicBookingFormConfig } from "../../../config/public-booking/publicBookingFormConfig";
import usePublicBookingForm from "../../../hooks/public-booking/usePublicBookingForm";

import ConfigFieldsRenderer from "../../../Components/shared/forms/ConfigFieldsRenderer";
import FieldRenderer from "../../../Components/shared/forms/FieldRenderer";
import { getProgramAvailableSeats } from "../../../Components/shared/booking-wizard/bookingPricing";

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
    getValue,
    handleFieldChange,
    handleTravelerChange,
    addTraveler,
    removeTraveler,
    buildDraftCreatePayload,
    buildDraftUpdatePayload,
  } = usePublicBookingForm({
    selectedProgram,
  });

  const config = publicBookingFormConfig();

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

    const createResult = await dispatch(
      createPublicDraftBooking(buildDraftCreatePayload()),
    );

    const draftId =
      createResult.payload?.data?._id || createResult.payload?._id;

    if (!draftId) return;

    const updateResult = await dispatch(
      updatePublicDraftBooking({
        draftId,
        data: buildDraftUpdatePayload(),
      }),
    );

    const updatedDraftId =
      updateResult.payload?.data?._id || updateResult.payload?._id || draftId;

    navigate(`/draft-booking/${updatedDraftId}`);
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

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <SectionTitle
              title={t("customerInfo", "بيانات العميل")}
              subtitle={t("customerInfoDesc", "بيانات الشخص المسؤول عن الحجز")}
            />

            <ConfigFieldsRenderer
              fields={config.customerFields}
              isArabic={isArabic}
              getValue={getValue}
              onChange={handleFieldChange}
            />

            <div className="my-8 border-t border-slate-100" />

            <SectionTitle
              title={t("travelers", "المعتمرون")}
              subtitle={t(
                "travelersDesc",
                "أضف بيانات كل معتمر داخل مسودة الحجز",
              )}
            />

            <div className="space-y-4">
              {formData.travelers.map((traveler, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      {t("traveler", "معتمر")} {index + 1}
                    </h3>

                    {formData.travelers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTraveler(index)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        {t("remove", "حذف")}
                      </button>
                    )}
                  </div>

                  <Row className="g-4">
                    {[...config.travelerFields]
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((field) => (
                        <FieldRenderer
                          key={field.name}
                          field={field}
                          isArabic={isArabic}
                          value={traveler[field.name]}
                          onChange={(value) =>
                            handleTravelerChange(index, field.name, value)
                          }
                        />
                      ))}
                  </Row>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTraveler}
              disabled={
                inventoryLoading ||
                reachedAvailableSeats
              }
              className={`mt-4 rounded-xl border px-4 py-2 text-sm font-semibold transition
    ${
      inventoryLoading ||
      reachedAvailableSeats
        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
    }`}
            >
              + {t("addTraveler", "إضافة معتمر")}
            </button>
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
                disabled={submitLoading}
                className="flex-1 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:bg-slate-400"
              >
                {submitLoading
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

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>

      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
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
