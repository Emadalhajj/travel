import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";
import {
  Banknote,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { loadStripe } from "@stripe/stripe-js";

import {
  Banknote,
  Building2,
  Clock3,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
<<<<<<< HEAD
import CopyableValue from "../../../Components/common/CopyableValue";
=======
import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

import { fetchPublicDraftBookingById } from "../../../redux/public/bookingSlice";

import {
  fetchPublicPaymentConfigurations,
  selectPublicPaymentConfigurations,
  selectPublicPaymentConfigurationsError,
  selectPublicPaymentConfigurationsLoading,
} from "../../../redux/public/publicPaymentConfigurationSlice";
<<<<<<< HEAD

import {
  clearPublicPaymentError,
  initializePublicPayment,
} from "../../../redux/public/publicPaymentSlice";

import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";

import { apiVerifyPublicProviderPayment } from "../../../services/api/public/paymentApi";

=======
import { initializePublicPayment } from "../../../redux/public/publicPaymentSlice";
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
import {
  PAYMENT_CONFIGURATION_TYPES,
  PAYMENT_SECTION_CODES,
  PUBLIC_PAYMENT_GROUPS,
  groupPublicPaymentConfigurations,
<<<<<<< HEAD
  resolvePrimaryPaymentConfiguration,
} from "../../../constants/payments/paymentConfigurationConstants";

/*
=====================================================
Public Booking Payment Page
=====================================================

المسؤوليات:
-----------------------------------------------------
1. عرض ملخص الحجز.
2. تجميع طرق الدفع حسب تجربة المستخدم.
3. إظهار تفاصيل الطريقة المختارة فقط.
4. بدء عملية الدفع من خلال Redux الحالية.
=====================================================
*/
=======
} from "../../../constants/payments/paymentConfigurationConstants";

const PAYMENT_GROUP_META = {
  [PUBLIC_PAYMENT_GROUPS.ELECTRONIC]: {
    icon: CreditCard,
    titleAr: "الدفع الإلكتروني",
    titleEn: "Card Payment",
    descriptionAr: "أدخل بيانات بطاقتك بأمان دون مغادرة صفحة الحجز.",
    descriptionEn: "Pay securely by card without leaving this page.",
  },
  [PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER]: {
    icon: Building2,
    titleAr: "تحويل بنكي",
    titleEn: "Bank Transfer",
    descriptionAr: "حوّل المبلغ إلى أحد الحسابات البنكية المعتمدة.",
    descriptionEn: "Transfer the amount to an approved bank account.",
  },
  [PUBLIC_PAYMENT_GROUPS.SADAD]: {
    icon: ReceiptText,
    titleAr: "سداد",
    titleEn: "SADAD",
    descriptionAr: "الدفع عبر خدمة سداد عند توفر مزود مفعّل.",
    descriptionEn: "Pay using SADAD when an active provider is available.",
  },
  [PUBLIC_PAYMENT_GROUPS.PAY_LATER]: {
    icon: Clock3,
    titleAr: "الدفع الآجل",
    titleEn: "Pay Later",
    descriptionAr: "إتمام الحجز وفق سياسة الدفع الآجل المعتمدة.",
    descriptionEn: "Continue using the configured pay-later policy.",
  },
  [PUBLIC_PAYMENT_GROUPS.CASH]: {
    icon: Banknote,
    titleAr: "دفع نقدي",
    titleEn: "Cash Payment",
    descriptionAr: "تسجيل طلب دفع نقدي حسب سياسة الحجز.",
    descriptionEn: "Register a cash payment request under the booking policy.",
  },
};
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

export default function PublicBookingPaymentPage() {
  const { draftId } = useParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { draftBooking, loading, error } = useSelector(
    (state) => state.publicBooking,
  );
<<<<<<< HEAD

  const paymentConfigurations = useSelector(selectPublicPaymentConfigurations);

=======
  const paymentConfigurations = useSelector(selectPublicPaymentConfigurations);
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  const paymentMethodsLoading = useSelector(
    selectPublicPaymentConfigurationsLoading,
  );

  const paymentMethodsError = useSelector(
    selectPublicPaymentConfigurationsError,
  );
<<<<<<< HEAD

  const initializationLoading = useSelector((state) =>
    Boolean(state.publicPayment?.initializationLoading),
  );

  const initializationError = useSelector(
    (state) => state.publicPayment?.initializationError || null,
=======
  const initializationLoading = useSelector((state) =>
    Boolean(state.publicPayment?.initializationLoading),
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  );

  const lang = localStorage.getItem("lang") || "ar";

  const isArabic = lang === "ar";

  const [selectedGroupCode, setSelectedGroupCode] = useState("");
<<<<<<< HEAD

  const [selectedConfigurationId, setSelectedConfigurationId] = useState("");

=======
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [embeddedPayment, setEmbeddedPayment] = useState(null);

  const [embeddedPayment, setEmbeddedPayment] = useState(null);

  const [stripePromise, setStripePromise] = useState(null);

  const [autoInitializedConfigurationId, setAutoInitializedConfigurationId] =
    useState("");

  /*
  =====================================================
  Load Draft
  =====================================================
  */

  useEffect(() => {
<<<<<<< HEAD
    if (!draftId) {
      return;
    }

    dispatch(fetchPublicDraftBookingById(draftId));
  }, [dispatch, draftId]);

  /*
  =====================================================
  Booking Data
  =====================================================
  */

  const travelers = useMemo(
    () => draftBooking?.travelers || [],
    [draftBooking],
  );

=======
    if (draftId) dispatch(fetchPublicDraftBookingById(draftId));
  }, [dispatch, draftId]);

  const travelers = useMemo(
    () => draftBooking?.travelers || [],
    [draftBooking],
  );

>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  const selectedProducts = useMemo(
    () =>
      draftBooking?.data?.selectedProducts ||
      draftBooking?.data?.selectedProductsList ||
      [],
    [draftBooking],
  );

  const pricing = useMemo(
    () =>
      calculateBookingPricing({
        selectedPackage:
          draftBooking?.data?.selectedPackage || draftBooking?.program,
<<<<<<< HEAD

        travelers,

        selectedProducts,

=======
        travelers,
        selectedProducts,
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
        fallbackPricing: draftBooking?.pricing || {},
      }),
    [draftBooking, travelers, selectedProducts],
  );
<<<<<<< HEAD

  /*
  =====================================================
  Load Payment Configurations
  =====================================================
  */
=======
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

  useEffect(() => {
    if (!draftBooking?._id) {
      return;
    }

    dispatch(
      fetchPublicPaymentConfigurations({
        sectionCode: PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,

        currency: draftBooking.currency || pricing.currency || "SAR",

        amount: pricing.totalPrice ?? pricing.total,
      }),
    );
  }, [
    dispatch,
    draftBooking?._id,
    draftBooking?.currency,
    pricing.currency,
    pricing.total,
    pricing.totalPrice,
  ]);

<<<<<<< HEAD
  /*
  =====================================================
  Payment Groups
  =====================================================
  */

=======
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  const paymentGroups = useMemo(
    () => groupPublicPaymentConfigurations(paymentConfigurations),
    [paymentConfigurations],
  );

  const selectedGroup = useMemo(
<<<<<<< HEAD
    () =>
      paymentGroups.find((group) => group.code === selectedGroupCode) || null,
    [paymentGroups, selectedGroupCode],
  );

  const selectedConfiguration = useMemo(
    () =>
      paymentConfigurations.find(
        (configuration) => configuration._id === selectedConfigurationId,
      ) || null,
    [paymentConfigurations, selectedConfigurationId],
  );

  /*
  =====================================================
  Program Name
  =====================================================
  */
=======
    () => paymentGroups.find((group) => group.code === selectedGroupCode),
    [paymentGroups, selectedGroupCode],
  );

  const selectedConfiguration = useMemo(() => {
    if (!selectedGroup) return null;

    if (selectedGroup.code === PUBLIC_PAYMENT_GROUPS.ELECTRONIC) {
      return (
        selectedGroup.configurations.find(
          (configuration) =>
            String(configuration.provider?.code || "").toUpperCase() ===
            "STRIPE",
        ) || selectedGroup.primaryConfiguration
      );
    }

    return selectedGroup.primaryConfiguration;
  }, [selectedGroup]);

  const stripePromise = useMemo(() => {
    if (!embeddedPayment?.publishableKey) return null;
    return loadStripe(embeddedPayment.publishableKey);
  }, [embeddedPayment?.publishableKey]);
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

  const programName = useMemo(() => {
    if (!draftBooking?.program) {
      return "-";
    }

    return isArabic
      ? draftBooking.program.nameAr || draftBooking.program.nameEn || "-"
      : draftBooking.program.nameEn || draftBooking.program.nameAr || "-";
  }, [draftBooking, isArabic]);

<<<<<<< HEAD
  /*
  =====================================================
  Select Payment Group
  =====================================================
  */

  const handleSelectGroup = (group) => {
    dispatch(clearPublicPaymentError());

    setEmbeddedPayment(null);

    setStripePromise(null);

    setAutoInitializedConfigurationId("");

    const configuration = resolvePrimaryPaymentConfiguration(
      group.configurations,
    );

    setSelectedGroupCode(group.code);

    setSelectedConfigurationId(configuration?._id || "");

    setSelectedBankAccountId("");

    if (
      group.code === PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER &&
      configuration?.bankAccounts?.length === 1
    ) {
      setSelectedBankAccountId(configuration.bankAccounts[0]._id);
=======
  const selectGroup = (groupCode) => {
    setSelectedGroupCode(groupCode);
    setSelectedBankAccountId("");

    if (groupCode !== PUBLIC_PAYMENT_GROUPS.ELECTRONIC) {
      setEmbeddedPayment(null);
    }
  };

  const initializeConfiguration = async (configuration) => {
    if (!configuration) {
      toast.error(
        isArabic ? "طريقة الدفع غير متاحة" : "Payment method is unavailable",
      );
      return null;
    }

    if (
      configuration.configurationType ===
        PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT &&
      !selectedBankAccountId
    ) {
      toast.error(
        isArabic
          ? "يرجى اختيار الحساب البنكي"
          : "Please select a bank account",
      );
      return null;
    }

    const response = await dispatch(
      initializePublicPayment({
        draftId,
        configurationId: configuration._id,
        sectionCode: PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,
        paymentMethodCode: configuration.paymentMethodCode,
        selectedBankAccountId: selectedBankAccountId || null,
      }),
    ).unwrap();

    return response?.data || response;
  };

  const handleElectronicPayment = async () => {
    try {
      const result = await initializeConfiguration(selectedConfiguration);
      if (!result) return;

      if (result.action === "EMBEDDED_CHECKOUT") {
        setEmbeddedPayment({
          clientSecret: result.clientSecret,
          publishableKey: result.publishableKey,
          paymentTransactionId: result.paymentTransactionId,
        });
        return;
      }

      if (result.action === "REDIRECT" && result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }

      throw new Error(
        isArabic
          ? "مزود الدفع لا يدعم نموذج الدفع داخل الصفحة"
          : "The payment provider does not support embedded checkout",
      );
    } catch (paymentError) {
      toast.error(
        paymentError?.message ||
          (isArabic
            ? "تعذر تجهيز الدفع الإلكتروني"
            : "Unable to prepare card payment"),
      );
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
    }
  };

  /*
  =====================================================
  Continue Payment
  =====================================================
  */

  const handleContinuePayment = async () => {
    if (!selectedConfiguration) {
      toast.error(
        isArabic ? "يرجى اختيار طريقة الدفع" : "Please select a payment method",
      );

      return;
    }

<<<<<<< HEAD
    if (
      selectedConfiguration.configurationType ===
        PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT &&
      !selectedBankAccountId
    ) {
      toast.error(
        isArabic ? "يرجى اختيار الحساب البنكي" : "Please select a bank account",
      );

      return;
    }

    try {
      const response = await dispatch(
        initializePublicPayment({
          draftId,

          configurationId: selectedConfiguration._id,

          sectionCode: PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,

          paymentMethodCode: selectedConfiguration.paymentMethodCode,

          selectedBankAccountId: selectedBankAccountId || null,
        }),
      ).unwrap();

      const result = response?.data || response;
=======
    try {
      const result = await initializeConfiguration(selectedConfiguration);
      if (!result) return;
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

      /*
      توجد معاملة قائمة أو مدفوعة لهذه المسودة.
      لا نسمح بإنشاء عملية دفع ثانية، وننقل العميل
      إلى صفحة الحالة الحالية.
      */
      if (result.action === "EXISTING_PAYMENT") {
        navigate(
          `/booking/payment/${draftId}/result?transactionId=${encodeURIComponent(
            result.paymentTransactionId,
          )}`,
          { replace: true },
        );
        return;
      }

      /*
        =================================================
        Stripe Embedded Checkout
        =================================================
        */

      if (result.action === "EMBEDDED_CHECKOUT") {
        if (!result.clientSecret || !result.publishableKey) {
          throw new Error(
            isArabic
              ? "بيانات جلسة الدفع المضمنة غير مكتملة"
              : "Embedded payment session data is incomplete",
          );
        }

        setStripePromise(
          loadStripe(result.publishableKey),
        );

        setEmbeddedPayment({
          clientSecret: result.clientSecret,
          transactionId:
            result.paymentTransactionId,
        });

        return;
      }

      /*
        =================================================
        Hosted Provider Fallback
        =================================================
        */

      if (result.action === "REDIRECT") {
        if (!result.redirectUrl) {
          throw new Error(
            isArabic
              ? "لم يتم استلام رابط الدفع"
              : "Payment redirect URL was not returned",
          );
        }
        window.location.assign(result.redirectUrl);

        return;
      }

      /*
        =================================================
        Bank Transfer
        =================================================
        */

      if (result.action === "BANK_TRANSFER") {
        navigate(
          `/booking/payment/${draftId}/bank-transfer/${result.paymentTransactionId}`,
        );

        return;
      }

      /*
        =================================================
        Manual Payment
        =================================================
        */

      if (result.action === "PENDING_APPROVAL") {
        navigate(
          `/booking/payment/${draftId}/pending/${result.paymentTransactionId}`,
        );
      }
    } catch (paymentError) {
      toast.error(
<<<<<<< HEAD
        paymentInitializationError?.message ||
          (isArabic ? "تعذر بدء عملية الدفع" : "Unable to initialize payment"),
=======
        paymentError?.message ||
          (isArabic
            ? "تعذر بدء عملية الدفع"
            : "Unable to initialize payment"),
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
      );
    }
  };

<<<<<<< HEAD
  /*
  =====================================================
  Initialize Online Payment Automatically
  =====================================================

  Stripe Embedded Checkout يجب أن يظهر داخل الصفحة فور
  اختيار الدفع الإلكتروني، من دون زر تهيئة وسيط.
  =====================================================
  */

  useEffect(() => {
    if (
      selectedGroupCode !== PUBLIC_PAYMENT_GROUPS.ONLINE ||
      !selectedConfiguration?._id ||
      embeddedPayment ||
      initializationLoading ||
      autoInitializedConfigurationId === selectedConfiguration._id
    ) {
      return;
    }

    setAutoInitializedConfigurationId(selectedConfiguration._id);

    handleContinuePayment();

    // تعتمد إعادة المحاولة على إعادة اختيار مجموعة الدفع يدويًا.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedGroupCode,
    selectedConfiguration?._id,
    embeddedPayment,
    initializationLoading,
    autoInitializedConfigurationId,
  ]);

  if (loading) {
    return <Loader />;
  }
=======
  const copyText = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(isArabic ? "تم النسخ" : "Copied");
    } catch {
      toast.error(isArabic ? "تعذر النسخ" : "Unable to copy");
    }
  };

  const handleStripeComplete = () => {
    if (!embeddedPayment?.paymentTransactionId) return;

    navigate(
      `/booking/payment/${draftId}/result?transactionId=${embeddedPayment.paymentTransactionId}`,
    );
  };

  if (loading) return <Loader />;
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrowAr="الدفع"
          eyebrowEn="Payment"
          titleAr="إتمام الدفع"
          titleEn="Complete Payment"
<<<<<<< HEAD
          subtitleAr="اختر طريقة الدفع المناسبة لإتمام الحجز بأمان."
          subtitleEn="Choose the most suitable payment method to complete your booking securely."
        />

        <BookingProgressTimeline currentStep="payment" isArabic={isArabic} />
=======
          subtitleAr="اختر طريقة الدفع المناسبة وأكمل العملية من نفس الصفحة."
          subtitleEn="Choose the payment option that suits you and complete it securely."
        />
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

        <BookingProgressTimeline currentStep="payment" isArabic={isArabic} />
        <ErrorOverlay show={Boolean(error)} message={error} />

<<<<<<< HEAD
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-5">
            <BookingSummary
              draftBooking={draftBooking}
              travelers={travelers}
              pricing={pricing}
              programName={programName}
              isArabic={isArabic}
            />
          </aside>

          <main className="lg:col-span-7">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {isArabic ? "اختر طريقة الدفع" : "Choose Payment Method"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isArabic
                    ? "يتم عرض طرق الدفع المتاحة فقط لهذا الحجز."
                    : "Only payment methods available for this booking are shown."}
                </p>
              </div>

              {paymentMethodsLoading ? (
                <PaymentLoading isArabic={isArabic} />
              ) : paymentMethodsError ? (
                <PaymentError error={paymentMethodsError} />
              ) : paymentGroups.length === 0 ? (
                <EmptyPaymentMethods isArabic={isArabic} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {paymentGroups.map((group) => (
                      <PaymentGroupCard
                        key={group.code}
                        group={group}
                        selected={selectedGroupCode === group.code}
                        isArabic={isArabic}
                        onSelect={() => handleSelectGroup(group)}
                      />
                    ))}
                  </div>

                  {selectedGroup && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <SelectedPaymentContent
                        group={selectedGroup}
                        configuration={selectedConfiguration}
                        selectedBankAccountId={selectedBankAccountId}
                        setSelectedBankAccountId={setSelectedBankAccountId}
                        embeddedPayment={embeddedPayment}
                        stripePromise={stripePromise}
                        initializationLoading={initializationLoading}
                        initializationError={initializationError}
                        onRetryOnlinePayment={() => {
                          dispatch(clearPublicPaymentError());
                          setEmbeddedPayment(null);
                          setStripePromise(null);
                          setAutoInitializedConfigurationId("");
                        }}
                        draftId={draftId}
                        isArabic={isArabic}
                      />
                    </div>
                  )}

                  {selectedGroupCode !== PUBLIC_PAYMENT_GROUPS.ONLINE && (
                    <button
                      type="button"
                      onClick={handleContinuePayment}
                      disabled={
                        initializationLoading ||
                        !selectedConfigurationId
                      }
                      className="mt-6 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {initializationLoading
                        ? isArabic
                          ? "جارٍ تجهيز الدفع..."
                          : "Preparing payment..."
                        : getContinueButtonLabel(
                            selectedGroupCode,
                            isArabic,
                          )}
                    </button>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={16} />

                    <span>
                      {isArabic
                        ? "يتم تنفيذ عمليات الدفع الإلكتروني عبر مزود دفع آمن."
                        : "Electronic payments are processed securely by the payment provider."}
                    </span>
                  </div>
                </>
              )}
            </section>
          </main>
=======
        <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-12">
          <main className="lg:col-span-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                <h2 className="text-2xl font-bold text-slate-900">
                  {isArabic ? "اختر طريقة الدفع" : "Choose payment method"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isArabic
                    ? "نعرض فقط الطرق المفعلة والمتاحة لهذا الحجز."
                    : "Only active payment options available for this booking are shown."}
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {paymentMethodsLoading ? (
                  <div className="py-12 text-center text-slate-500">
                    {isArabic
                      ? "جارٍ تحميل طرق الدفع..."
                      : "Loading payment methods..."}
                  </div>
                ) : paymentMethodsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                    {paymentMethodsError?.message || String(paymentMethodsError)}
                  </div>
                ) : paymentGroups.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                    {isArabic
                      ? "لا توجد طرق دفع متاحة لهذا الحجز حاليًا."
                      : "No payment methods are currently available for this booking."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentGroups.map((group) => (
                      <PaymentGroupCard
                        key={group.code}
                        group={group}
                        isArabic={isArabic}
                        selected={selectedGroupCode === group.code}
                        onSelect={() => selectGroup(group.code)}
                      />
                    ))}
                  </div>
                )}

                {selectedGroup && (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-7">
                    {selectedGroup.code === PUBLIC_PAYMENT_GROUPS.ELECTRONIC ? (
                      <ElectronicPaymentPanel
                        isArabic={isArabic}
                        embeddedPayment={embeddedPayment}
                        stripePromise={stripePromise}
                        initializationLoading={initializationLoading}
                        onPrepare={handleElectronicPayment}
                        onComplete={handleStripeComplete}
                      />
                    ) : selectedGroup.code ===
                      PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER ? (
                      <BankTransferPanel
                        configuration={selectedConfiguration}
                        selectedBankAccountId={selectedBankAccountId}
                        setSelectedBankAccountId={setSelectedBankAccountId}
                        isArabic={isArabic}
                        onCopy={copyText}
                      />
                    ) : (
                      <SimplePaymentPanel
                        configuration={selectedConfiguration}
                        groupCode={selectedGroup.code}
                        isArabic={isArabic}
                      />
                    )}

                    {selectedGroup.code !== PUBLIC_PAYMENT_GROUPS.ELECTRONIC && (
                      <button
                        type="button"
                        onClick={handleContinuePayment}
                        disabled={initializationLoading}
                        className="mt-6 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {initializationLoading
                          ? isArabic
                            ? "جارٍ تجهيز العملية..."
                            : "Preparing..."
                          : getActionLabel(selectedGroup.code, isArabic)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className="lg:col-span-4">
            <div className="sticky top-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-900 px-6 py-6 text-white">
                <p className="text-sm text-slate-300">
                  {isArabic ? "المبلغ المستحق" : "Amount due"}
                </p>
                <div className="mt-2 text-3xl font-black tracking-tight">
                  {formatMoney(
                    pricing.total || pricing.totalPrice,
                    pricing.currency,
                  )}
                </div>
              </div>

              <div className="space-y-5 p-6">
                <SummaryItem
                  label={isArabic ? "البرنامج" : "Program"}
                  value={programName}
                />
                <SummaryItem
                  label={isArabic ? "عدد المعتمرين" : "Travelers"}
                  value={travelers.length}
                />
                <SummaryItem
                  label={isArabic ? "تاريخ البداية" : "Start Date"}
                  value={formatDate(draftBooking?.program?.startDate, isArabic)}
                />

                <div className="border-t border-slate-200 pt-5">
                  <SummaryRow
                    label={isArabic ? "قبل الضريبة" : "Subtotal"}
                    value={formatMoney(pricing.subtotal, pricing.currency)}
                  />
                  <SummaryRow
                    label={
                      isArabic
                        ? `الضريبة ${pricing.taxRate || 15}%`
                        : `VAT ${pricing.taxRate || 15}%`
                    }
                    value={formatMoney(
                      pricing.tax || pricing.taxAmount,
                      pricing.currency,
                    )}
                  />
                  <SummaryRow
                    label={isArabic ? "الإجمالي" : "Total"}
                    value={formatMoney(
                      pricing.total || pricing.totalPrice,
                      pricing.currency,
                    )}
                    strong
                  />
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-xs leading-6">
                    {isArabic
                      ? "بيانات البطاقة يتم إدخالها داخل نموذج آمن تابع لمزود الدفع ولا يتم تخزينها في النظام."
                      : "Card details are entered in the payment provider's secure form and are never stored by this system."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
/*
=====================================================
Payment Group Card
=====================================================
*/

function PaymentGroupCard({ group, selected, isArabic, onSelect }) {
  const meta = getPaymentGroupMeta(group.code, isArabic);

=======
function PaymentGroupCard({ group, isArabic, selected, onSelect }) {
  const meta = PAYMENT_GROUP_META[group.code];
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
<<<<<<< HEAD
      className={`flex min-h-28 items-center gap-4 rounded-2xl border-2 p-5 text-start transition-all ${
        selected
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        <Icon size={24} />
      </div>

      <div className="min-w-0">
        <div className="font-extrabold text-slate-900">{meta.title}</div>

        <div className="mt-1 text-xs leading-5 text-slate-500">
          {meta.description}
        </div>
      </div>
=======
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-start transition sm:p-5 ${
        selected
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          selected
            ? "bg-emerald-600 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900">
          {isArabic ? meta.titleAr : meta.titleEn}
        </span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {isArabic ? meta.descriptionAr : meta.descriptionEn}
        </span>
      </span>

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          selected
            ? "bg-emerald-600 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {selected ? (
          <Check className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </span>
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
    </button>
  );
}

<<<<<<< HEAD
/*
=====================================================
Selected Payment Content
=====================================================
*/

function SelectedPaymentContent({
  group,
  configuration,
  selectedBankAccountId,
  setSelectedBankAccountId,
  embeddedPayment,
  stripePromise,
  initializationLoading,
  initializationError,
  onRetryOnlinePayment,
  draftId,
  isArabic,
}) {
  if (!configuration) {
    return null;
  }

  const instructions = isArabic
    ? configuration.instructionsAr
    : configuration.instructionsEn;

  if (group.code === PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER) {
    return (
      <BankTransferContent
        configuration={configuration}
        selectedBankAccountId={selectedBankAccountId}
        setSelectedBankAccountId={setSelectedBankAccountId}
        isArabic={isArabic}
      />
    );
  }

  if (group.code === PUBLIC_PAYMENT_GROUPS.ONLINE) {
    return (
      <div>
        <div className="flex items-start gap-3">
          <CreditCard className="mt-1 text-emerald-600" size={22} />

          <div>
            <h3 className="font-extrabold text-slate-900">
              {isArabic ? "الدفع الإلكتروني" : "Electronic Payment"}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {isArabic
                ? "أدخل بيانات الدفع في النموذج الآمن أدناه."
                : "Enter your payment details securely below."}
=======
function ElectronicPaymentPanel({
  isArabic,
  embeddedPayment,
  stripePromise,
  initializationLoading,
  onPrepare,
  onComplete,
}) {
  if (!embeddedPayment) {
    return (
      <div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-bold text-slate-900">
              {isArabic ? "دفع إلكتروني آمن" : "Secure card payment"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {isArabic
                ? "سيظهر نموذج البطاقة الآمن هنا داخل الصفحة، ولن يتم نقلك إلى صفحة دفع منفصلة."
                : "The secure card form will open here without sending you to a separate checkout page."}
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
            </p>
          </div>
        </div>

<<<<<<< HEAD
        {!embeddedPayment && (
          <>
            <SupportedElectronicMethods
              configurations={group.configurations}
            />

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              {initializationLoading ? (
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
              ) : (
                <CreditCard
                  size={30}
                  className="mx-auto text-slate-400"
                />
              )}

              <p
                className={`mt-3 text-sm ${
                  initializationError
                    ? "text-red-600"
                    : "text-slate-500"
                }`}
              >
                {initializationLoading
                  ? isArabic
                    ? "جارٍ تحميل نموذج Stripe الآمن..."
                    : "Loading the secure Stripe payment form..."
                  : initializationError?.message ||
                      (typeof initializationError === "string"
                        ? initializationError
                        : "") ||
                      (isArabic
                        ? "تعذر تحميل نموذج الدفع."
                        : "Unable to load the payment form.")}
              </p>

              {!initializationLoading && initializationError && (
                <button
                  type="button"
                  onClick={onRetryOnlinePayment}
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  {isArabic ? "إعادة المحاولة" : "Try Again"}
                </button>
              )}
            </div>
          </>
        )}

        {embeddedPayment && stripePromise && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret:
                  embeddedPayment.clientSecret,
                onComplete: async () => {
                  try {
                    await apiVerifyPublicProviderPayment(
                      embeddedPayment.transactionId,
                    );
                  } catch (verificationError) {
                    /*
                    قد يكون Webhook قد عالج المعاملة بالفعل، أو قد
                    تصل المعالجة بعد الانتقال. صفحة النتيجة ستقرأ
                    الحالة الآمنة من Backend.
                    */
                    console.error(
                      "Stripe payment verification failed:",
                      verificationError,
                    );
                  } finally {
                    window.location.assign(
                      `/booking/payment/${draftId}/result?transactionId=${embeddedPayment.transactionId}`,
                    );
                  }
                },
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}

        {instructions && (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {instructions}
          </p>
        )}
=======
        <button
          type="button"
          onClick={onPrepare}
          disabled={initializationLoading}
          className="mt-6 w-full rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {initializationLoading
            ? isArabic
              ? "جارٍ تجهيز نموذج البطاقة..."
              : "Preparing secure card form..."
            : isArabic
              ? "إدخال بيانات البطاقة"
              : "Enter card details"}
        </button>
      </div>
    );
  }

  if (!stripePromise || !embeddedPayment.clientSecret) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        {isArabic
          ? "تعذر تحميل نموذج الدفع الآمن."
          : "Unable to load the secure payment form."}
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
      </div>
    );
  }

  return (
    <div>
<<<<<<< HEAD
      <h3 className="font-extrabold text-slate-900">
        {getPaymentGroupMeta(group.code, isArabic).title}
      </h3>

      {instructions && (
        <p className="mt-2 text-sm leading-6 text-slate-500">{instructions}</p>
      )}
=======
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <ShieldCheck className="h-5 w-5" />
        <span>
          {isArabic
            ? "نموذج دفع آمن داخل الصفحة"
            : "Secure embedded checkout"}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white p-2 sm:p-4">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret: embeddedPayment.clientSecret,
            onComplete,
          }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
    </div>
  );
}

<<<<<<< HEAD
/*
=====================================================
Bank Transfer Content
=====================================================
*/

function BankTransferContent({
=======
function BankTransferPanel({
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
  configuration,
  selectedBankAccountId,
  setSelectedBankAccountId,
  isArabic,
<<<<<<< HEAD
}) {
  const accounts = configuration.bankAccounts || [];

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-extrabold text-slate-900">
          {isArabic ? "اختر الحساب البنكي" : "Choose Bank Account"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {isArabic
            ? "سيتم استخدام الحساب المحدد لإكمال طلب التحويل."
            : "The selected account will be used for the bank transfer."}
        </p>
      </div>

      <div className="space-y-3">
=======
  onCopy,
}) {
  const accounts = configuration?.bankAccounts || [];

  return (
    <div>
      <h3 className="font-bold text-slate-900">
        {isArabic ? "اختر الحساب البنكي" : "Choose bank account"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {isArabic
          ? "اختر الحساب الذي ستحول إليه المبلغ، ثم أكمل رفع إثبات التحويل."
          : "Choose the account you will transfer to, then continue with the transfer proof."}
      </p>

      <div className="mt-5 space-y-3">
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
        {accounts.map((account) => {
          const selected = selectedBankAccountId === account._id;

          return (
<<<<<<< HEAD
            <div
              key={account._id}
              onClick={() => setSelectedBankAccountId(account._id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedBankAccountId(account._id);
                }
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              className={`w-full rounded-2xl border p-4 text-start transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-200"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="bankAccount"
                  value={account._id}
                  checked={selected}
                  onChange={() => setSelectedBankAccountId(account._id)}
                  className="mt-2 h-4 w-4 accent-emerald-600"
                  aria-label={
                    isArabic
                      ? `اختيار ${account.bankNameAr || account.bankNameEn}`
                      : `Select ${account.bankNameEn || account.bankNameAr}`
                  }
                />

                <Building2 size={22} className="mt-1 text-emerald-600" />

                <div className="min-w-0 flex-1">
=======
            <button
              type="button"
              key={account._id}
              onClick={() => setSelectedBankAccountId(account._id)}
              className={`w-full rounded-2xl border p-4 text-start transition ${
                selected
                  ? "border-emerald-500 bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
                  <div className="font-bold text-slate-900">
                    {isArabic
                      ? account.bankNameAr || account.bankNameEn
                      : account.bankNameEn || account.bankNameAr}
                  </div>
<<<<<<< HEAD

                  <div className="mt-1 text-sm text-slate-600">
=======
                  <div className="mt-1 text-sm text-slate-500">
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
                    {account.beneficiaryName ||
                      account.accountNameAr ||
                      account.accountNameEn ||
                      "-"}
                  </div>
<<<<<<< HEAD

                  <div className="mt-3 space-y-2">
                    <CopyableValue
                      label="IBAN"
                      value={account.iban}
                      isArabic={isArabic}
                    />

                    <CopyableValue
                      label={isArabic ? "رقم الحساب" : "Account Number"}
                      value={account.accountNumber}
                      isArabic={isArabic}
                    />

                    <CopyableValue
                      label="SWIFT"
                      value={account.swiftCode}
                      isArabic={isArabic}
                    />
                  </div>
                </div>
              </div>
            </div>
=======
                </div>
                {selected && (
                  <span className="rounded-full bg-emerald-600 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span
                    dir="ltr"
                    className="break-all text-sm font-semibold text-slate-700"
                  >
                    IBAN: {account.iban || "-"}
                  </span>
                  {account.iban && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onCopy(account.iban);
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900"
                    >
                      <Copy className="h-4 w-4" />
                    </span>
                  )}
                </div>
                {account.accountNumber && (
                  <div dir="ltr" className="mt-2 text-xs text-slate-500">
                    {isArabic ? "رقم الحساب" : "Account"}: {account.accountNumber}
                  </div>
                )}
              </div>
            </button>
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
          );
        })}
      </div>
    </div>
  );
}

<<<<<<< HEAD
/*
=====================================================
Electronic Method Badges
=====================================================

هذه ليست خيارات اختيار.
هي فقط توضح للعميل الوسائل المدعومة.
=====================================================
*/

function SupportedElectronicMethods({ configurations }) {
  const methods = [
    ...new Set(
      configurations.map((configuration) => configuration.paymentMethodCode),
    ),
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {methods.map((method) => (
        <span
          key={method}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
        >
          {formatPaymentMethodName(method)}
        </span>
      ))}
=======
function SimplePaymentPanel({ configuration, groupCode, isArabic }) {
  const instructions = isArabic
    ? configuration?.instructionsAr
    : configuration?.instructionsEn;
  const meta = PAYMENT_GROUP_META[groupCode];

  return (
    <div>
      <h3 className="font-bold text-slate-900">
        {isArabic ? meta.titleAr : meta.titleEn}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {instructions || (isArabic ? meta.descriptionAr : meta.descriptionEn)}
      </p>
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
    </div>
  );
}

<<<<<<< HEAD
/*
=====================================================
Booking Summary
=====================================================
*/

function BookingSummary({
  draftBooking,
  travelers,
  pricing,
  programName,
  isArabic,
}) {
  return (
    <div className="sticky top-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
        {isArabic ? "ملخص الحجز" : "Booking Summary"}
      </h2>

      <div className="space-y-5">
        <SummaryItem
          label={isArabic ? "البرنامج" : "Program"}
          value={programName}
        />

        <SummaryItem
          label={isArabic ? "تاريخ البداية" : "Start Date"}
          value={formatDate(draftBooking?.program?.startDate)}
        />

        <SummaryItem
          label={isArabic ? "تاريخ النهاية" : "End Date"}
          value={formatDate(draftBooking?.program?.endDate)}
        />

        <SummaryItem
          label={isArabic ? "عدد المعتمرين" : "Travelers"}
          value={travelers.length}
        />

        <div className="border-y border-slate-200 py-5">
          <SummaryRow
            label={isArabic ? "الإجمالي قبل الضريبة" : "Subtotal"}
            value={formatMoney(pricing.subtotal, pricing.currency)}
          />

          <SummaryRow
            label={
              isArabic
                ? `ضريبة القيمة المضافة ${pricing.taxRate}%`
                : `VAT ${pricing.taxRate}%`
            }
            value={formatMoney(
              pricing.tax || pricing.taxAmount,
              pricing.currency,
            )}
          />

          <SummaryRow
            label={isArabic ? "الإجمالي شامل الضريبة" : "Total"}
            value={formatMoney(
              pricing.total || pricing.totalPrice,
              pricing.currency,
            )}
            strong
          />
        </div>

        <p className="text-xs leading-6 text-slate-500">
          {isArabic
            ? "المبلغ النهائي يتم اعتماده من الخادم عند بدء عملية الدفع."
            : "The final amount is confirmed by the server when payment begins."}
        </p>
      </div>
    </div>
  );
}

/*
=====================================================
Group Metadata
=====================================================
*/

function getPaymentGroupMeta(groupCode, isArabic) {
  const data = {
    [PUBLIC_PAYMENT_GROUPS.ONLINE]: {
      icon: CreditCard,

      titleAr: "الدفع الإلكتروني",

      titleEn: "Electronic Payment",

      descriptionAr: "الدفع الآمن باستخدام البطاقة",

      descriptionEn: "Secure card payment",
    },

    [PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER]: {
      icon: Building2,

      titleAr: "تحويل بنكي",

      titleEn: "Bank Transfer",

      descriptionAr: "التحويل إلى أحد الحسابات البنكية",

      descriptionEn: "Transfer to a bank account",
    },

    [PUBLIC_PAYMENT_GROUPS.SADAD]: {
      icon: ReceiptText,

      titleAr: "سداد",

      titleEn: "SADAD",

      descriptionAr: "الدفع باستخدام خدمة سداد",

      descriptionEn: "Pay using SADAD",
    },

    [PUBLIC_PAYMENT_GROUPS.BNPL]: {
      icon: Clock3,

      titleAr: "الدفع الآجل",

      titleEn: "Pay Later",

      descriptionAr: "خيارات الدفع لاحقًا أو بالتقسيط",

      descriptionEn: "Pay later or installment options",
    },

    [PUBLIC_PAYMENT_GROUPS.CASH]: {
      icon: Banknote,

      titleAr: "الدفع النقدي",

      titleEn: "Cash Payment",

      descriptionAr: "الدفع النقدي حسب شروط الحجز",

      descriptionEn: "Cash payment according to booking terms",
    },
  };

  const group = data[groupCode] || {
    icon: WalletCards,

    titleAr: "طريقة دفع",

    titleEn: "Payment Method",

    descriptionAr: "",

    descriptionEn: "",
  };

  return {
    ...group,

    title: isArabic ? group.titleAr : group.titleEn,

    description: isArabic ? group.descriptionAr : group.descriptionEn,
  };
}

/*
=====================================================
Continue Button Label
=====================================================
*/

function getContinueButtonLabel(groupCode, isArabic) {
  if (groupCode === PUBLIC_PAYMENT_GROUPS.ONLINE) {
    return isArabic ? "إدخال بيانات الدفع" : "Enter Payment Details";
  }

  if (groupCode === PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER) {
    return isArabic ? "متابعة التحويل البنكي" : "Continue Bank Transfer";
  }

  return isArabic ? "متابعة الدفع" : "Continue Payment";
}

/*
=====================================================
Loading / Error / Empty
=====================================================
*/

function PaymentLoading({ isArabic }) {
  return (
    <div className="py-10 text-center text-slate-500">
      {isArabic ? "جارٍ تحميل طرق الدفع..." : "Loading payment methods..."}
    </div>
  );
}

function PaymentError({ error }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
      {error?.message || String(error)}
    </div>
  );
}

function EmptyPaymentMethods({ isArabic }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
      {isArabic
        ? "لا توجد طرق دفع متاحة لهذا الحجز حاليًا."
        : "No payment methods are currently available for this booking."}
    </div>
  );
}

/*
=====================================================
Summary Helpers
=====================================================
*/

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>

=======
function getActionLabel(groupCode, isArabic) {
  if (groupCode === PUBLIC_PAYMENT_GROUPS.BANK_TRANSFER) {
    return isArabic ? "متابعة التحويل البنكي" : "Continue bank transfer";
  }
  if (groupCode === PUBLIC_PAYMENT_GROUPS.SADAD) {
    return isArabic ? "متابعة الدفع عبر سداد" : "Continue with SADAD";
  }
  if (groupCode === PUBLIC_PAYMENT_GROUPS.PAY_LATER) {
    return isArabic ? "تأكيد الدفع الآجل" : "Confirm pay later";
  }
  if (groupCode === PUBLIC_PAYMENT_GROUPS.CASH) {
    return isArabic ? "تأكيد الدفع النقدي" : "Confirm cash payment";
  }

  return isArabic ? "متابعة الدفع" : "Continue payment";
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc
      <p className="mt-1 font-bold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={
          strong
            ? "text-lg font-black text-slate-900"
            : "font-semibold text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

<<<<<<< HEAD
/*
=====================================================
Formatting
=====================================================
*/

function formatPaymentMethodName(code) {
  const labels = {
    CARD: "Card",

    MADA: "Mada",

    VISA: "Visa",

    MASTERCARD: "Mastercard",

    APPLE_PAY: "Apple Pay",

    STC_PAY: "STC Pay",
  };

  return labels[code] || code;
}

function formatMoney(amount, currency = "SAR") {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }
=======
function formatDate(value, isArabic) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
>>>>>>> 37d0473aa4e4e14bc20efe68e7605e4e3680acfc

  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMoney(value, currency = "SAR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: currency || "SAR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, useParams } from "react-router-dom";
// import { toast } from "react-toastify";

// import Loader from "../../../Components/common/Loader";
// import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
// import PageHeader from "../../../Components/layout/PageHeader";
// import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";

// import { fetchPublicDraftBookingById } from "../../../redux/public/bookingSlice";
// import {
//   fetchPublicPaymentConfigurations,
//   selectPublicPaymentConfigurations,
//   selectPublicPaymentConfigurationsLoading,
//   selectPublicPaymentConfigurationsError,
// } from "../../../redux/public/publicPaymentConfigurationSlice";
// import {
//   initializePublicPayment,
// } from "../../../redux/public/publicPaymentSlice";
// import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";
// import {
//   PAYMENT_CONFIGURATION_TYPES,
//   PAYMENT_SECTION_CODES,
// } from "../../../constants/payments/paymentConfigurationConstants";

// export default function PublicBookingPaymentPage() {
//   const { draftId } = useParams();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { draftBooking, loading, error } = useSelector(
//     (state) => state.publicBooking,
//   );

//   const paymentConfigurations = useSelector(
//     selectPublicPaymentConfigurations,
//   );
//   const paymentMethodsLoading = useSelector(
//     selectPublicPaymentConfigurationsLoading,
//   );
//   const paymentMethodsError = useSelector(
//     selectPublicPaymentConfigurationsError,
//   );
//   const initializationLoading = useSelector(
//     (state) =>
//       Boolean(
//         state.publicPayment
//           ?.initializationLoading,
//       ),
//   );

//   const lang = localStorage.getItem("lang") || "ar";
//   const isArabic = lang === "ar";

//   const [selectedConfigurationId, setSelectedConfigurationId] = useState("");
//   const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

//   useEffect(() => {
//     if (draftId) {
//       dispatch(fetchPublicDraftBookingById(draftId));
//     }
//   }, [dispatch, draftId]);

//   const travelers = useMemo(() => {
//     return draftBooking?.travelers || [];
//   }, [draftBooking]);

//   const selectedProducts = useMemo(() => {
//     return (
//       draftBooking?.data?.selectedProducts ||
//       draftBooking?.data?.selectedProductsList ||
//       []
//     );
//   }, [draftBooking]);

//   const pricing = useMemo(() => {
//     return calculateBookingPricing({
//       selectedPackage:
//         draftBooking?.data?.selectedPackage || draftBooking?.program,
//       travelers,
//       selectedProducts,
//       fallbackPricing: draftBooking?.pricing || {},
//     });
//   }, [draftBooking, travelers, selectedProducts]);

//   useEffect(() => {
//     if (!draftBooking?._id) return;

//     dispatch(
//       fetchPublicPaymentConfigurations({
//         sectionCode: PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,
//         currency: draftBooking.currency || pricing.currency || "SAR",
//         amount: pricing.totalPrice ?? pricing.total,
//       }),
//     );
//   }, [
//     dispatch,
//     draftBooking?._id,
//     draftBooking?.currency,
//     pricing.currency,
//     pricing.total,
//     pricing.totalPrice,
//   ]);

//   const programName = useMemo(() => {
//     if (!draftBooking?.program) return "-";

//     return isArabic
//       ? draftBooking.program.nameAr || draftBooking.program.nameEn || "-"
//       : draftBooking.program.nameEn || draftBooking.program.nameAr || "-";
//   }, [draftBooking, isArabic]);

//   const selectedConfiguration = paymentConfigurations.find(
//     (configuration) =>
//       configuration._id === selectedConfigurationId,
//   );

//   const handleSelectConfiguration = (configurationId) => {
//     setSelectedConfigurationId(configurationId);
//     setSelectedBankAccountId("");
//   };

//   const handleContinuePayment = async () => {
//     if (!selectedConfiguration) {
//       toast.error(
//         isArabic
//           ? "يرجى اختيار طريقة الدفع"
//           : "Please select a payment method",
//       );
//       return;
//     }

//     if (
//       selectedConfiguration.configurationType ===
//         PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT &&
//       !selectedBankAccountId
//     ) {
//       toast.error(
//         isArabic
//           ? "يرجى اختيار الحساب البنكي"
//           : "Please select a bank account",
//       );
//       return;
//     }

//     try {
//       const response = await dispatch(
//         initializePublicPayment({
//           draftId,
//           configurationId: selectedConfiguration._id,
//           sectionCode: PAYMENT_SECTION_CODES.CUSTOM_PACKAGE,
//           paymentMethodCode: selectedConfiguration.paymentMethodCode,
//           selectedBankAccountId: selectedBankAccountId || null,
//         }),
//       ).unwrap();

//       const result = response?.data || response;

//       if (result.action === "REDIRECT") {
//         if (!result.redirectUrl) {
//           throw new Error(
//             isArabic
//               ? "لم يتم استلام رابط الدفع"
//               : "Payment redirect URL was not returned",
//           );
//         }

//         window.location.assign(result.redirectUrl);
//         return;
//       }

//       if (result.action === "BANK_TRANSFER") {
//         navigate(
//           `/booking/payment/${draftId}/bank-transfer/${result.paymentTransactionId}`,
//         );
//         return;
//       }

//       if (result.action === "PENDING_APPROVAL") {
//         navigate(
//           `/booking/payment/${draftId}/pending/${result.paymentTransactionId}`,
//         );
//       }
//     } catch (paymentInitializationError) {
//       toast.error(
//         paymentInitializationError?.message ||
//           (isArabic
//             ? "تعذر بدء عملية الدفع"
//             : "Unable to initialize payment"),
//       );
//     }
//   };

//   if (loading) return <Loader />;

//   return (
//     <div
//       className="min-h-screen bg-slate-50 px-4 py-8"
//       dir={isArabic ? "rtl" : "ltr"}
//     >
//       <div className="mx-auto max-w-7xl">
//         <PageHeader
//           eyebrowAr="الدفع"
//           eyebrowEn="Payment"
//           titleAr="إتمام الدفع"
//           titleEn="Complete Payment"
//           subtitleAr="اختر طريقة الدفع المناسبة، وسيتم عرض نموذج الدفع الآمن."
//           subtitleEn="Choose a payment method and continue securely."
//         />
//         <BookingProgressTimeline
//   currentStep="payment"
//   isArabic={isArabic}
// />

//         <ErrorOverlay show={Boolean(error)} message={error} />

//         <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
//           <aside className="lg:col-span-5">
//             <div className="sticky top-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
//               <h2 className="mb-6 text-2xl font-bold text-slate-900">
//                 {isArabic ? "ملخص الحجز" : "Booking Summary"}
//               </h2>

//               <div className="space-y-5">
//                 <SummaryItem
//                   label={isArabic ? "البرنامج" : "Program"}
//                   value={programName}
//                 />

//                 <SummaryItem
//                   label={isArabic ? "تاريخ البداية" : "Start Date"}
//                   value={formatDate(draftBooking?.program?.startDate)}
//                 />

//                 <SummaryItem
//                   label={isArabic ? "تاريخ النهاية" : "End Date"}
//                   value={formatDate(draftBooking?.program?.endDate)}
//                 />

//                 <SummaryItem
//                   label={isArabic ? "عدد المعتمرين" : "Travelers"}
//                   value={travelers.length}
//                 />

//                 <div className="border-y border-slate-200 py-5">
//                   <SummaryRow
//                     label={isArabic ? "الإجمالي قبل الضريبة" : "Subtotal"}
//                     value={formatMoney(pricing.subtotal, pricing.currency)}
//                   />

//                   <SummaryRow
//                     label={
//                       isArabic
//                         ? `ضريبة القيمة المضافة ${pricing.taxRate}%`
//                         : `VAT ${pricing.taxRate}%`
//                     }
//                     value={formatMoney(
//                       pricing.tax || pricing.taxAmount,
//                       pricing.currency,
//                     )}
//                   />

//                   <SummaryRow
//                     label={isArabic ? "الإجمالي شامل الضريبة" : "Total"}
//                     value={formatMoney(
//                       pricing.total || pricing.totalPrice,
//                       pricing.currency,
//                     )}
//                     strong
//                   />
//                 </div>

//                 <p className="text-xs leading-6 text-slate-500">
//                   {isArabic
//                     ? "المبلغ النهائي يتم اعتماده من الخادم عند إنشاء جلسة الدفع."
//                     : "The final amount is calculated server-side when creating the payment session."}
//                 </p>
//               </div>
//             </div>
//           </aside>

//           <main className="lg:col-span-7">
//             <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
//               <h2 className="mb-8 text-2xl font-bold text-slate-900">
//                 {isArabic ? "اختر طريقة الدفع" : "Choose Payment Method"}
//               </h2>

//               {paymentMethodsLoading ? (
//                 <div className="py-8 text-center text-slate-500">
//                   {isArabic
//                     ? "جارٍ تحميل طرق الدفع..."
//                     : "Loading payment methods..."}
//                 </div>
//               ) : paymentMethodsError ? (
//                 <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
//                   {paymentMethodsError?.message || String(paymentMethodsError)}
//                 </div>
//               ) : paymentConfigurations.length === 0 ? (
//                 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
//                   {isArabic
//                     ? "لا توجد طرق دفع متاحة لهذا الحجز حاليًا."
//                     : "No payment methods are currently available for this booking."}
//                 </div>
//               ) : (
//                 <div className="flex flex-col gap-4">
//                   {paymentConfigurations.map((configuration) => {
//                     const isSelected =
//                       selectedConfigurationId === configuration._id;
//                     const title = isArabic
//                       ? configuration.displayNameAr ||
//                         configuration.paymentMethodCode
//                       : configuration.displayNameEn ||
//                         configuration.paymentMethodCode;
//                     const instructions = isArabic
//                       ? configuration.instructionsAr
//                       : configuration.instructionsEn;

//                     return (
//                       <div
//                         key={configuration._id}
//                         className={`rounded-2xl border-2 p-5 transition ${
//                           isSelected
//                             ? "border-emerald-500 bg-emerald-50 shadow-sm"
//                             : "border-slate-200 bg-white"
//                         }`}
//                       >
//                         <label className="flex cursor-pointer items-center gap-3 font-bold text-slate-900">
//                           <input
//                             type="radio"
//                             name="paymentConfiguration"
//                             value={configuration._id}
//                             checked={isSelected}
//                             onChange={() =>
//                               handleSelectConfiguration(
//                                 configuration._id,
//                               )
//                             }
//                           />
//                           <span>{title}</span>
//                         </label>

//                         {instructions && (
//                           <p className="mt-2 text-sm text-slate-500">
//                             {instructions}
//                           </p>
//                         )}

//                         {isSelected &&
//                           configuration.configurationType ===
//                             PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT && (
//                             <div className="mt-4 space-y-2">
//                               {(configuration.bankAccounts || []).map(
//                                 (account) => (
//                                   <label
//                                     key={account._id}
//                                     className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
//                                   >
//                                     <input
//                                       type="radio"
//                                       name="bankAccount"
//                                       value={account._id}
//                                       checked={
//                                         selectedBankAccountId === account._id
//                                       }
//                                       onChange={() =>
//                                         setSelectedBankAccountId(account._id)
//                                       }
//                                     />
//                                     <div className="min-w-0 flex-1">
//                                       <div className="font-bold">
//                                         {isArabic
//                                           ? account.bankNameAr ||
//                                             account.bankNameEn
//                                           : account.bankNameEn ||
//                                             account.bankNameAr}
//                                       </div>
//                                       <div className="text-sm text-slate-600">
//                                         {isArabic
//                                           ? account.accountNameAr ||
//                                             account.beneficiaryName
//                                           : account.accountNameEn ||
//                                             account.beneficiaryName}
//                                       </div>

//                                       <div className="mt-2 space-y-1 text-sm text-slate-600">
//                                         <div>
//                                           {isArabic
//                                             ? "اسم المستفيد"
//                                             : "Beneficiary"}
//                                           : {" "}
//                                           {account.beneficiaryName || "-"}
//                                         </div>

//                                         <div dir="ltr">
//                                         IBAN: {account.iban || "-"}
//                                         </div>

//                                         <div dir="ltr">
//                                           {isArabic
//                                             ? "رقم الحساب"
//                                             : "Account Number"}
//                                           : {account.accountNumber || "-"}
//                                         </div>

//                                         {account.swiftCode && (
//                                           <div dir="ltr">
//                                             SWIFT: {account.swiftCode}
//                                           </div>
//                                         )}

//                                         <div>
//                                           {isArabic ? "العملة" : "Currency"}
//                                           : {" "}
//                                           {account.currency || "SAR"}
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </label>
//                                 ),
//                               )}
//                             </div>
//                           )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}

//               <button
//                 type="button"
//                 onClick={handleContinuePayment}
//                 disabled={
//                   initializationLoading ||
//                   !selectedConfigurationId
//                 }
//                 className="mt-8 w-full rounded-2xl bg-emerald-600 px-6 py-5 text-xl font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
//               >
//                 {initializationLoading
//                   ? isArabic
//                     ? "جارٍ تجهيز الدفع..."
//                     : "Preparing payment..."
//                   : isArabic
//                     ? "متابعة الدفع"
//                     : "Continue payment"}
//               </button>

//               <p className="mt-4 text-center text-xs leading-6 text-slate-500">
//                 {isArabic
//                   ? "لا يتم تخزين بيانات البطاقة أو رمز CVV داخل النظام."
//                   : "Card number and CVV are never stored or processed by this system."}
//               </p>
//             </section>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SummaryItem({ label, value }) {
//   return (
//     <div>
//       <p className="text-sm text-slate-500">{label}</p>
//       <p className="mt-1 font-bold text-slate-900">{value || "-"}</p>
//     </div>
//   );
// }

// function SummaryRow({ label, value, strong }) {
//   return (
//     <div className="mb-4 flex items-center justify-between gap-4">
//       <span className="text-sm text-slate-500">{label}</span>

//       <span
//         className={
//           strong
//             ? "text-lg font-extrabold text-emerald-700"
//             : "text-sm font-bold text-slate-900"
//         }
//       >
//         {value}
//       </span>
//     </div>
//   );
// }

// function formatMoney(amount, currency = "SAR") {
//   return `${Number(amount || 0).toFixed(2)} ${currency}`;
// }

// function formatDate(value) {
//   if (!value) return "-";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleDateString("en-CA");
// }
