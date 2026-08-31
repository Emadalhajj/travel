import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  fetchPublicDraftBookingById,
  cancelPublicDraftBooking,
  selectPublicBookingSubmitLoading,
  selectPublicDraftBooking,
  selectPublicDraftError,
  selectPublicDraftLoading,
} from "../../../redux/public/bookingSlice";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import PublicButton from "../../../Components/shared/buttons/PublicButton";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

import BookingProgressTimeline, {
  bookingSteps,
  customPackageSteps,
  formatBookingStepLabel,
  normalizeBookingStep,
} from "../../../Components/shared/booking/BookingProgressTimeline";
import TravelerReviewCard from "../../../Components/shared/booking/TravelerReviewCard";
import HostReviewCard from "../../../Components/shared/booking/HostReviewCard";

import DraftBookingInfoCard from "../../../Components/shared/draft-bookings/DraftBookingInfoCard";
import DraftBookingSummaryCard from "../../../Components/shared/draft-bookings/DraftBookingSummaryCard";
import DraftSelectedProductsCard from "../../../Components/shared/draft-bookings/DraftSelectedProductsCard";

import StatusBadge from "../../../Components/shared/common/StatusBadge";
import { getNationalityLabel } from "../../../Utils/nationality";
import { calculateInclusiveDays, formatDate } from "../../../Utils/dateUtils";
import { formatPrice } from "../../../Utils/roundPrice";

import {
  calculateBookingPricing,
  getProgramUnitPrice,
} from "../../../Components/shared/booking-wizard/bookingPricing";

export default function PublicDraftBookingDetailsPage() {
  const { draftId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const draftBooking = useSelector(selectPublicDraftBooking);
  const loading = useSelector(selectPublicDraftLoading);
  const submitLoading = useSelector(selectPublicBookingSubmitLoading);
  const error = useSelector(selectPublicDraftError);

  const [localError, setLocalError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

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

  const hosts = useMemo(() => Array.isArray(draftBooking?.hosts) ? draftBooking.hosts : [], [draftBooking]);

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
      value: getNationalityLabel(
        draftBooking?.customer?.nationality,
        isArabic,
      ),
    },
  ];

  /*
  =====================================================
  تفاصيل البرنامج
  =====================================================
  */

  const durationDays = calculateInclusiveDays(programStartDate, programEndDate);
  const programItems = [
    {
      label: t("program", "البرنامج"),
      value: programName,
    },
    {
      label: t("startDate", "تاريخ البداية"),
      value: formatDate(programStartDate, { isArabic }),
    },
    {
      label: t("endDate", "تاريخ النهاية"),
      value: formatDate(programEndDate, { isArabic }),
    },
    {
      label: t("duration", "مدة البرنامج"),
      value: durationDays ? `${durationDays} ${t("days", "يوم")}` : "-",
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
      value: formatBookingStepLabel(
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
      value: formatPrice(
        pricingSummary.subtotal,
        pricingSummary.currency,
      ),
    },
    {
      label: t(
        "vat",
        `ضريبة القيمة المضافة ${pricingSummary.taxRate}%`,
      ),
      value: formatPrice(
        pricingSummary.taxAmount,
        pricingSummary.currency,
      ),
    },
    {
      label: t("discount", "الخصم"),
      value: formatPrice(
        pricingSummary.discount,
        pricingSummary.currency,
      ),
    },
    {
      label: t("totalWithVat", "الإجمالي شامل الضريبة"),
      value: formatPrice(
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

  const navigateToPartyDetails = () => {
    navigate(`/booking/draft/${draftId}/details`);
  };

  const hasRequiredServices =
    hasSelectedProducts || hasReadyPackage;

  const isDraft = draftBooking?.status === "draft";

  const isReadyForPayment =
    isDraft &&
    hasCustomerData &&
    hasTravelers &&
    hasRequiredServices;

  /*
  =====================================================
  تحديد الخطوة الحالية
  =====================================================
  */

  const currentTimelineStep = normalizeBookingStep(
    draftBooking?.currentStep,
  );
  const timelineSteps = hasReadyPackage ? bookingSteps : customPackageSteps;

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
      navigateToPartyDetails();
      return;
    }

    if (currentStep === "travelers") {
      navigateToPartyDetails();
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

    navigateToPartyDetails();
  };

  /*
  =====================================================
  العودة لتعديل بيانات العميل
  =====================================================
  */

  const handleEditCustomer = () => {
    navigateToPartyDetails();
  };

  /*
  =====================================================
  العودة لتعديل بيانات المعتمرين
  =====================================================
  */

  const handleEditTravelers = () => {
    navigateToPartyDetails();
  };

  /*
  =====================================================
  إلغاء المسودة
  =====================================================
  */

  const handleCancel = async () => {
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
      setShowCancelConfirmation(false);
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

        <PublicButton
          variant="secondary"
          onClick={() => navigate("/my-draft-bookings")}
          className="mt-6"
        >
          {t("backToDrafts", "العودة للمسودات")}
        </PublicButton>
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
            {isDraft && <ActionButton action="back" onClick={handleEditTravelers} showLabel label={t("previousStep", "الخطوة السابقة")} size="lg" />}
            <PublicButton
              variant="secondary"
              onClick={() => navigate("/my-draft-bookings")}
            >
              {t("backToDrafts", "العودة للمسودات")}
            </PublicButton>

            {isDraft && (
              <PublicButton
                onClick={handleContinue}
                disabled={submitLoading || isCancelling}
              >
                {t("continueBooking", "متابعة الحجز")}
              </PublicButton>
            )}

            {isDraft && (
              <PublicButton
                variant="dangerOutline"
                onClick={() => setShowCancelConfirmation(true)}
                disabled={
                  submitLoading ||
                  isCancelling
                }
                loading={isCancelling}
              >
                {t("cancelDraft", "إلغاء المسودة")}
              </PublicButton>
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
        steps={timelineSteps}
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
              <ActionButton
                action="edit"
                onClick={handleEditCustomer}
                showLabel
                label={t("editCustomerData", "تعديل البيانات")}
                className="absolute left-5 top-5"
              />
            )}
          </section>

          <DraftBookingInfoCard
            title={t(
              "programInfo",
              "بيانات البرنامج",
            )}
            items={programItems}
          />

          <PublicSectionCard>
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
                <ActionButton
                  action="edit"
                  onClick={handleEditTravelers}
                  showLabel
                  label={t("editTravelers", "تعديل المعتمرين")}
                />
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

            {hosts.length > 0 && <div className="mt-8 space-y-5"><h2 className="text-xl font-bold text-slate-900">{t("hosts", "المستضيفون")}</h2>{hosts.map((host, index) => <HostReviewCard key={host.hostId || index} host={host} index={index} t={t} isArabic={isArabic} />)}</div>}
          </PublicSectionCard>
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
                    onClick: () => setShowCancelConfirmation(true),
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
      <ConfirmDialog
        show={showCancelConfirmation}
        onHide={() => !isCancelling && setShowCancelConfirmation(false)}
        onConfirm={handleCancel}
        title={t("cancelDraftTitle", "تأكيد إلغاء المسودة")}
        message={t("confirmCancelDraft", "هل أنت متأكد من إلغاء هذه المسودة؟ لا يمكن التراجع عن هذه العملية.")}
        confirmText={t("confirmCancelDraftAction", "نعم، إلغاء المسودة")}
        cancelText={t("keepDraft", "الاحتفاظ بالمسودة")}
        variant="warning"
        loading={isCancelling}
      />
    </PublicPageLayout>
  );
}

/*
=====================================================
Helpers
=====================================================
*/

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
