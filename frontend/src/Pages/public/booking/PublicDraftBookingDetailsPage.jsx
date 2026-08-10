import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  PackageCheck,
  User,
  Users,
} from "lucide-react";

import {
  fetchPublicDraftBookingById,
  cancelPublicDraftBooking,
} from "../../../redux/public/bookingSlice";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";

import DraftBookingInfoCard from "../../../Components/shared/draft-bookings/DraftBookingInfoCard";
import DraftBookingSummaryCard from "../../../Components/shared/draft-bookings/DraftBookingSummaryCard";
import DraftSelectedProductsCard from "../../../Components/shared/draft-bookings/DraftSelectedProductsCard";

import StatusBadge from "../../../Components/shared/common/StatusBadge";

import {
  calculateBookingPricing,
  getProgramUnitPrice,
} from "../../../Components/shared/booking-wizard/bookingPricing";

/*
=====================================================
خط سير البرنامج المخصص
=====================================================
*/

const customBookingSteps = [
  {
    key: "dates",
    labelAr: "التواريخ",
    labelEn: "Dates",
    icon: CalendarDays,
  },
  {
    key: "services",
    labelAr: "الخدمات",
    labelEn: "Services",
    icon: PackageCheck,
  },
  {
    key: "customer_info",
    labelAr: "بيانات العميل",
    labelEn: "Customer",
    icon: User,
  },
  {
    key: "travelers",
    labelAr: "المعتمرون",
    labelEn: "Travelers",
    icon: Users,
  },
  {
    key: "review",
    labelAr: "المراجعة",
    labelEn: "Review",
    icon: FileText,
  },
  {
    key: "payment",
    labelAr: "الدفع",
    labelEn: "Payment",
    icon: CreditCard,
  },
  {
    key: "success",
    labelAr: "التأكيد",
    labelEn: "Confirmation",
    icon: Check,
  },
];

export default function PublicDraftBookingDetailsPage() {
  const { draftId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { draftBooking, loading, submitLoading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const [localError, setLocalError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  /*
  =====================================================
  جلب المسودة
  =====================================================
  */

  useEffect(() => {
    if (draftId) {
      dispatch(fetchPublicDraftBookingById(draftId));
    }
  }, [dispatch, draftId]);

  /*
  =====================================================
  بيانات البرنامج
  =====================================================
  */

  const selectedPackage = useMemo(() => {
    return (
      draftBooking?.data?.selectedPackage ||
      draftBooking?.program ||
      {}
    );
  }, [draftBooking]);

  const programName = useMemo(() => {
    if (!selectedPackage) return "-";

    return isArabic
      ? selectedPackage.nameAr ||
          selectedPackage.nameEn ||
          selectedPackage.name ||
          "-"
      : selectedPackage.nameEn ||
          selectedPackage.nameAr ||
          selectedPackage.name ||
          "-";
  }, [selectedPackage, isArabic]);

  const programStartDate =
    draftBooking?.program?.startDate ||
    selectedPackage?.startDate ||
    draftBooking?.data?.startDate ||
    draftBooking?.data?.searchCriteria?.startDate ||
    null;

  const programEndDate =
    draftBooking?.program?.endDate ||
    selectedPackage?.endDate ||
    draftBooking?.data?.endDate ||
    draftBooking?.data?.searchCriteria?.endDate ||
    null;

  /*
  =====================================================
  المعتمرون والخدمات
  =====================================================
  */

  const travelers = useMemo(() => {
    return Array.isArray(draftBooking?.travelers)
      ? draftBooking.travelers
      : [];
  }, [draftBooking]);

  const selectedProductsList = useMemo(() => {
    return (
      draftBooking?.data?.selectedProducts ||
      draftBooking?.data?.selectedProductsList ||
      draftBooking?.selectedProducts ||
      []
    );
  }, [draftBooking]);

  /*
  =====================================================
  حساب السعر

  الأولوية:
  1- القيم المحفوظة في المسودة.
  2- الحساب المحلي كخيار احتياطي.
  =====================================================
  */

  const calculatedPricing = useMemo(() => {
    return calculateBookingPricing({
      selectedPackage,
      travelers,
      selectedProducts: selectedProductsList,
      fallbackPricing: draftBooking?.pricing || {},
    });
  }, [
    selectedPackage,
    travelers,
    selectedProductsList,
    draftBooking?.pricing,
  ]);

  const pricingSummary = useMemo(() => {
    const savedPricing = draftBooking?.pricing || {};

    return {
      subtotal: getNumberWithZeroSupport(
        savedPricing.subtotal,
        calculatedPricing?.subtotal,
      ),

      taxRate: getNumberWithZeroSupport(
        savedPricing.taxRate,
        calculatedPricing?.taxRate,
        15,
      ),

      taxAmount: getNumberWithZeroSupport(
        savedPricing.taxAmount,
        savedPricing.tax,
        calculatedPricing?.taxAmount,
        calculatedPricing?.tax,
      ),

      discount: getNumberWithZeroSupport(
        savedPricing.discount,
        calculatedPricing?.discount,
      ),

      total: getNumberWithZeroSupport(
        savedPricing.totalPrice,
        savedPricing.total,
        savedPricing.totalAmount,
        calculatedPricing?.totalPrice,
        calculatedPricing?.total,
      ),

      currency:
        savedPricing.currency ||
        calculatedPricing?.currency ||
        "SAR",
    };
  }, [draftBooking?.pricing, calculatedPricing]);

  /*
  =====================================================
  بيانات العميل
  =====================================================
  */

  const customerItems = [
    {
      label: t("customerName", "اسم العميل"),
      value: draftBooking?.customer?.name || "-",
    },
    {
      label: t("phone", "رقم الجوال"),
      value: draftBooking?.customer?.phone || "-",
    },
    {
      label: t("email", "البريد الإلكتروني"),
      value: draftBooking?.customer?.email || "-",
    },
    {
      label: t("nationality", "الجنسية"),
      value: draftBooking?.customer?.nationality || "-",
    },
  ];

  /*
  =====================================================
  تفاصيل البرنامج
  =====================================================
  */

  const programItems = [
    {
      label: t("program", "البرنامج"),
      value: programName,
    },
    {
      label: t("startDate", "تاريخ البداية"),
      value: formatDate(programStartDate),
    },
    {
      label: t("endDate", "تاريخ النهاية"),
      value: formatDate(programEndDate),
    },
    {
      label: t("duration", "مدة البرنامج"),
      value: calculateDuration(programStartDate, programEndDate, t),
    },
    {
      label: t("travelersCount", "عدد المعتمرين"),
      value: travelers.length,
    },
  ];

  /*
  =====================================================
  ملخص المسودة
  =====================================================
  */

  const summaryRows = [
    {
      label: t("draftStatus", "حالة المسودة"),
      value: draftBooking?.status || "-",
    },
    {
      label: t("currentStep", "الخطوة الحالية"),
      value: formatStepName(
        draftBooking?.currentStep,
        isArabic,
      ),
    },
    {
      label: t("travelersCount", "عدد المعتمرين"),
      value: travelers.length,
    },
    {
      label: t("selectedServicesCount", "عدد الخدمات المختارة"),
      value: selectedProductsList.length,
    },
    {
      label: t("subtotal", "الإجمالي قبل الضريبة"),
      value: formatMoney(
        pricingSummary.subtotal,
        pricingSummary.currency,
      ),
    },
    {
      label: t(
        "vat",
        `ضريبة القيمة المضافة ${pricingSummary.taxRate}%`,
      ),
      value: formatMoney(
        pricingSummary.taxAmount,
        pricingSummary.currency,
      ),
    },
    {
      label: t("discount", "الخصم"),
      value: formatMoney(
        pricingSummary.discount,
        pricingSummary.currency,
      ),
    },
    {
      label: t("totalWithVat", "الإجمالي شامل الضريبة"),
      value: formatMoney(
        pricingSummary.total,
        pricingSummary.currency,
      ),
    },
  ];

  /*
  =====================================================
  التحقق من اكتمال المسودة
  =====================================================
  */

  const hasCustomerData = Boolean(
    draftBooking?.customer?.name?.trim() &&
      draftBooking?.customer?.phone?.trim() &&
      draftBooking?.customer?.email?.trim(),
  );

  const hasTravelers = travelers.length > 0;
  const hasSelectedProducts = selectedProductsList.length > 0;

  /*
  الباقة الجاهزة تحتوي خدمات مشمولة في سعر البرنامج،
  لذلك لا نشترط وجود إضافات داخل selectedProducts.
  */
  const packageType = String(
    draftBooking?.data?.packageType ||
      draftBooking?.data?.bookingMode ||
      draftBooking?.data?.bookingType ||
      "",
  ).toUpperCase();

  const hasPackageReference = Boolean(
    selectedPackage?._id ||
      selectedPackage?.id ||
      selectedPackage?.refId ||
      selectedPackage?.programId ||
      draftBooking?.program?.programId,
  );

  const hasReadyPackage =
    (hasPackageReference &&
      (getProgramUnitPrice(selectedPackage) > 0 ||
        pricingSummary.total > 0)) ||
    packageType === "READY_PACKAGE" ||
    packageType === "PREDEFINED_PACKAGE";

  const hasRequiredServices =
    hasSelectedProducts || hasReadyPackage;

  const isDraft = draftBooking?.status === "draft";

  const isReadyForPayment =
    isDraft &&
    hasCustomerData &&
    hasTravelers &&
    hasRequiredServices &&
    pricingSummary.total > 0;

  /*
  =====================================================
  تحديد الخطوة الحالية
  =====================================================
  */

  const currentTimelineStep = normalizeBookingStep(
    draftBooking?.currentStep,
  );

  /*
  =====================================================
  متابعة الحجز حسب الخطوة المحفوظة
  =====================================================
  */

  const handleContinue = () => {
    setLocalError("");

    const currentStep = normalizeBookingStep(
      draftBooking?.currentStep,
    );

    if (currentStep === "dates" || currentStep === "services") {
      navigate("/custom-package-builder");
      return;
    }

    if (currentStep === "customer_info") {
      navigate(`/booking/custom/${draftId}/customer`);
      return;
    }

    if (currentStep === "travelers") {
      navigate(`/booking/custom/${draftId}/travelers`);
      return;
    }

    if (currentStep === "review" || currentStep === "payment") {
      if (!isReadyForPayment) {
        setLocalError(
          t(
            "draftIncomplete",
            "المسودة غير مكتملة. يرجى استكمال بيانات العميل والمعتمرين والخدمات قبل المتابعة إلى الدفع.",
          ),
        );

        return;
      }

      navigate(`/booking/payment/${draftId}`);
      return;
    }

    if (
      currentStep === "success" &&
      draftBooking?.finalBooking
    ) {
      const bookingId =
        draftBooking.finalBooking?._id ||
        draftBooking.finalBooking;

      navigate(`/booking/${bookingId}`);
      return;
    }

    navigate(`/booking/custom/${draftId}/customer`);
  };

  /*
  =====================================================
  العودة لتعديل بيانات العميل
  =====================================================
  */

  const handleEditCustomer = () => {
    navigate(`/booking/custom/${draftId}/customer`);
  };

  /*
  =====================================================
  العودة لتعديل بيانات المعتمرين
  =====================================================
  */

  const handleEditTravelers = () => {
    navigate(`/booking/custom/${draftId}/travelers`);
  };

  /*
  =====================================================
  إلغاء المسودة
  =====================================================
  */

  const handleCancel = async () => {
    const confirmed = window.confirm(
      t(
        "confirmCancelDraft",
        "هل أنت متأكد من إلغاء هذه المسودة؟",
      ),
    );

    if (!confirmed) return;

    try {
      setIsCancelling(true);
      setLocalError("");

      /*
      إذا كان thunk لديك يستقبل draftId مباشرة:
      استخدم cancelPublicDraftBooking(draftId)

      إذا كان يستقبل object:
      استخدم cancelPublicDraftBooking({ draftId })

      الكود أدناه يفترض أنه يستقبل object.
      */

      await dispatch(
        cancelPublicDraftBooking({
          draftId,
        }),
      ).unwrap();

      navigate("/my-draft-bookings");
    } catch (cancelError) {
      setLocalError(
        cancelError?.response?.data?.message ||
          cancelError?.message ||
          cancelError ||
          t(
            "cancelDraftFailed",
            "حدث خطأ أثناء إلغاء المسودة.",
          ),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  /*
  =====================================================
  Loading
  =====================================================
  */

  if (loading) {
    return (
      <PublicPageLayout>
        <Loader />
      </PublicPageLayout>
    );
  }

  /*
  =====================================================
  Not Found
  =====================================================
  */

  if (!draftBooking) {
    return (
      <PublicPageLayout>
        <PageHeader
          eyebrowAr="تفاصيل المسودة"
          eyebrowEn="Draft Details"
          titleAr="المسودة غير موجودة"
          titleEn="Draft Not Found"
          subtitleAr="لم يتم العثور على بيانات هذه المسودة."
          subtitleEn="No draft booking data was found."
        />

        <ErrorOverlay
          show={Boolean(error)}
          message={error}
        />

        <button
          type="button"
          onClick={() => navigate("/my-draft-bookings")}
          className="mt-6 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          {t("backToDrafts", "العودة للمسودات")}
        </button>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="مراجعة المسودة"
        eyebrowEn="Draft Review"
        titleAr={programName || "مراجعة مسودة الحجز"}
        titleEn={programName || "Review Draft Booking"}
        subtitleAr="راجع بيانات البرنامج والعميل والمعتمرين والخدمات قبل المتابعة إلى الدفع."
        subtitleEn="Review the program, customer, travelers, and selected services before payment."
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/my-draft-bookings")}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {t("backToDrafts", "العودة للمسودات")}
            </button>

            {isDraft && (
              <button
                type="button"
                onClick={handleContinue}
                disabled={submitLoading || isCancelling}
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {t("continueBooking", "متابعة الحجز")}
              </button>
            )}

            {isDraft && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={
                  submitLoading ||
                  isCancelling
                }
                className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling
                  ? t(
                      "cancellingDraft",
                      "جاري الإلغاء...",
                    )
                  : t(
                      "cancelDraft",
                      "إلغاء المسودة",
                    )}
              </button>
            )}
          </div>
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge
            value={draftBooking?.status || "draft"}
          />

          <StatusBadge
            value={draftBooking?.currentStep || "review"}
            type="step"
          />
        </div>
      </PageHeader>

      <BookingProgressTimeline
        currentStep={currentTimelineStep}
        isArabic={isArabic}
        steps={customBookingSteps}
      />

      <ErrorOverlay
        show={Boolean(error)}
        message={error}
      />

      <ErrorOverlay
        show={Boolean(localError)}
        message={localError}
      />

      {!isReadyForPayment && isDraft && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-bold text-amber-900">
            {t(
              "draftRequiresCompletion",
              "المسودة تحتاج إلى استكمال",
            )}
          </h3>

          <div className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
            {!hasCustomerData && (
              <p>
                •{" "}
                {t(
                  "customerDataIncomplete",
                  "بيانات العميل غير مكتملة.",
                )}
              </p>
            )}

            {!hasTravelers && (
              <p>
                •{" "}
                {t(
                  "travelersDataIncomplete",
                  "لم تتم إضافة بيانات المعتمرين.",
                )}
              </p>
            )}

            {!hasRequiredServices && (
              <p>
                •{" "}
                {t(
                  "servicesNotSelected",
                  "لم يتم اختيار خدمات للبرنامج.",
                )}
              </p>
            )}

            {pricingSummary.total <= 0 && (
              <p>
                •{" "}
                {t(
                  "pricingNotCalculated",
                  "لم يتم احتساب سعر البرنامج.",
                )}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <section className="relative">
            <DraftBookingInfoCard
              title={t(
                "customerInfo",
                "بيانات العميل",
              )}
              items={customerItems}
            />

            {isDraft && (
              <button
                type="button"
                onClick={handleEditCustomer}
                className="absolute left-5 top-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {t(
                  "editCustomerData",
                  "تعديل البيانات",
                )}
              </button>
            )}
          </section>

          <DraftBookingInfoCard
            title={t(
              "programInfo",
              "بيانات البرنامج",
            )}
            items={programItems}
          />

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("travelers", "المعتمرون")}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {t(
                    "travelersReviewDescription",
                    "مراجعة بيانات المعتمرين والمستندات المرفقة.",
                  )}
                </p>
              </div>

              {isDraft && (
                <button
                  type="button"
                  onClick={handleEditTravelers}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {t(
                    "editTravelers",
                    "تعديل المعتمرين",
                  )}
                </button>
              )}
            </div>

            {travelers.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                {t(
                  "noTravelersFound",
                  "لا توجد بيانات معتمرين.",
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {travelers.map((traveler, index) => (
                  <TravelerReviewCard
                    key={
                      traveler._id ||
                      `traveler-${index}`
                    }
                    traveler={traveler}
                    index={index}
                    t={t}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-6">
          <DraftBookingSummaryCard
            title={t(
              "draftSummary",
              "ملخص المسودة",
            )}
            rows={summaryRows}
            primaryAction={
              isDraft
                ? {
                    label: isReadyForPayment
                      ? t(
                          "continueToPayment",
                          "المتابعة إلى الدفع",
                        )
                      : t(
                          "completeDraftData",
                          "استكمال بيانات المسودة",
                        ),

                    onClick: handleContinue,

                    disabled:
                      submitLoading ||
                      isCancelling,
                  }
                : undefined
            }
            secondaryAction={
              isDraft
                ? {
                    label: t(
                      "cancelDraft",
                      "إلغاء المسودة",
                    ),
                    onClick: handleCancel,
                    disabled:
                      submitLoading ||
                      isCancelling,
                  }
                : undefined
            }
            note={t(
              "draftDetailsNote",
              "تأكد من صحة جميع البيانات قبل الانتقال إلى الدفع.",
            )}
          />

          <DraftSelectedProductsCard
            title={t(
              "selectedServices",
              "الخدمات المختارة",
            )}
            items={selectedProductsList}
            isArabic={isArabic}
          />

          {selectedProductsList.length === 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-800">
                {t(
                  "noSelectedServices",
                  "لا توجد خدمات مختارة في هذه المسودة.",
                )}
              </p>
            </section>
          )}
        </aside>
      </div>
    </PublicPageLayout>
  );
}

/*
=====================================================
بطاقة مراجعة المعتمر
=====================================================
*/

function TravelerReviewCard({
  traveler,
  index,
  t,
  isArabic,
}) {
  const travelerItems = [
    {
      label: t("fullName", "الاسم الكامل"),
      value: traveler.fullName || "-",
    },
    {
      label: t("passportNumber", "رقم الجواز"),
      value: traveler.passportNumber || "-",
    },
    {
      label: t("nationality", "الجنسية"),
      value: traveler.nationality || "-",
    },
    {
      label: t("birthDate", "تاريخ الميلاد"),
      value: formatDate(traveler.birthDate),
    },
    {
      label: t("gender", "الجنس"),
      value: formatGender(traveler.gender, t),
    },
    {
      label: t("mobile", "رقم الجوال"),
      value: traveler.mobile || "-",
    },
    {
      label: t("whatsapp", "رقم الواتساب"),
      value: traveler.whatsapp || "-",
    },
  ];

  const attachments = [
    {
      key: "passportImage",
      label: t("passportImage", "صورة الجواز"),
      value: traveler.passportImage,
    },
    {
      key: "personalPhoto",
      label: t("personalPhoto", "الصورة الشخصية"),
      value: traveler.personalPhoto,
    },
    {
      key: "vaccinationCertificate",
      label: t(
        "vaccinationCertificate",
        "شهادة التطعيم",
      ),
      value: traveler.vaccinationCertificate,
    },
    {
      key: "visaAttachment",
      label: t(
        "visaAttachment",
        "مرفق التأشيرة",
      ),
      value: traveler.visaAttachment,
    },
  ];

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-5 text-lg font-bold text-slate-900">
        {t("traveler", "معتمر")} {index + 1}
      </h3>

      <DraftBookingInfoCard
        title={t(
          "travelerPersonalData",
          "البيانات الشخصية",
        )}
        items={travelerItems}
      />

      <div className="mt-5">
        <h4 className="mb-3 text-sm font-bold text-slate-900">
          {t(
            "travelerAttachments",
            "المستندات المرفقة",
          )}
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.key}
              label={attachment.label}
              value={attachment.value}
              isArabic={isArabic}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

/*
=====================================================
عرض المرفق
=====================================================
*/

function AttachmentItem({
  label,
  value,
  isArabic,
}) {
  const attachmentUrl = getAttachmentUrl(value);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      {attachmentUrl ? (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          {isArabic ? "عرض المرفق" : "View attachment"}
        </a>
      ) : (
        <p className="mt-2 text-sm text-slate-400">
          {isArabic ? "غير مرفق" : "Not attached"}
        </p>
      )}
    </div>
  );
}

/*
=====================================================
Helpers
=====================================================
*/

function normalizeBookingStep(step) {
  const stepMap = {
    dates: "dates",
    date: "dates",

    package: "services",
    products: "services",
    services: "services",

    customer: "customer_info",
    customer_info: "customer_info",

    traveler: "travelers",
    travelers: "travelers",
    pilgrim: "travelers",
    pilgrims: "travelers",

    summary: "review",
    review: "review",

    checkout: "payment",
    payment: "payment",

    completed: "success",
    success: "success",
  };

  return (
    stepMap[String(step || "").toLowerCase()] ||
    "review"
  );
}

function formatStepName(step, isArabic) {
  const normalized = normalizeBookingStep(step);

  const labels = {
    dates: {
      ar: "التواريخ",
      en: "Dates",
    },
    services: {
      ar: "الخدمات",
      en: "Services",
    },
    customer_info: {
      ar: "بيانات العميل",
      en: "Customer",
    },
    travelers: {
      ar: "المعتمرون",
      en: "Travelers",
    },
    review: {
      ar: "المراجعة",
      en: "Review",
    },
    payment: {
      ar: "الدفع",
      en: "Payment",
    },
    success: {
      ar: "التأكيد",
      en: "Confirmation",
    },
  };

  return isArabic
    ? labels[normalized]?.ar || "-"
    : labels[normalized]?.en || "-";
}

function getNumberWithZeroSupport(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
}

function calculateDuration(startValue, endValue, t) {
  if (!startValue || !endValue) return "-";

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return "-";
  }

  const difference =
    end.getTime() - start.getTime();

  const days =
    Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ) + 1;

  return `${days} ${t("days", "يوم")}`;
}

function getAttachmentUrl(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.path ||
      value.fileUrl ||
      value.secureUrl ||
      ""
    );
  }

  return "";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-CA");
}

function formatMoney(
  amount,
  currency = "SAR",
) {
  return `${Number(amount || 0).toFixed(
    2,
  )} ${currency}`;
}

function formatGender(value, t) {
  if (value === "male") {
    return t("male", "ذكر");
  }

  if (value === "female") {
    return t("female", "أنثى");
  }

  return "-";
}
