import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";
import {
  Banknote,
  Building2,
  Clock3,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import CopyableValue from "../../../Components/common/CopyableValue";

import {
  ensurePublicDraftBooking,
  selectPublicDraftBooking,
  selectPublicDraftError,
  selectPublicDraftLoading,
} from "../../../redux/public/bookingSlice";

import {
  fetchPublicPaymentConfigurations,
  selectPublicPaymentConfigurations,
  selectPublicPaymentConfigurationsError,
  selectPublicPaymentConfigurationsLoading,
} from "../../../redux/public/publicPaymentConfigurationSlice";

import {
  clearPublicPaymentError,
  initializePublicPayment,
} from "../../../redux/public/publicPaymentSlice";

import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";

import { apiVerifyPublicProviderPayment } from "../../../services/api/public/paymentApi";

import {
  PAYMENT_CONFIGURATION_TYPES,
  PAYMENT_SECTION_CODES,
  PUBLIC_PAYMENT_GROUPS,
  groupPublicPaymentConfigurations,
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

export default function PublicBookingPaymentPage() {
  const { draftId } = useParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const draftBooking = useSelector(selectPublicDraftBooking);
  const loading = useSelector(selectPublicDraftLoading);
  const error = useSelector(selectPublicDraftError);

  const paymentConfigurations = useSelector(selectPublicPaymentConfigurations);

  const paymentMethodsLoading = useSelector(
    selectPublicPaymentConfigurationsLoading,
  );

  const paymentMethodsError = useSelector(
    selectPublicPaymentConfigurationsError,
  );

  const initializationLoading = useSelector((state) =>
    Boolean(state.publicPayment?.initializationLoading),
  );

  const initializationError = useSelector(
    (state) => state.publicPayment?.initializationError || null,
  );

  const lang = localStorage.getItem("lang") || "ar";

  const isArabic = lang === "ar";

  const [selectedGroupCode, setSelectedGroupCode] = useState("");

  const [selectedConfigurationId, setSelectedConfigurationId] = useState("");

  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
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
    if (!draftId) {
      return;
    }

    dispatch(ensurePublicDraftBooking(draftId));
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

        travelers,

        selectedProducts,

        fallbackPricing: draftBooking?.pricing || {},
      }),
    [draftBooking, travelers, selectedProducts],
  );

  /*
  =====================================================
  Load Payment Configurations
  =====================================================
  */

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

  /*
  =====================================================
  Payment Groups
  =====================================================
  */

  const paymentGroups = useMemo(
    () => groupPublicPaymentConfigurations(paymentConfigurations),
    [paymentConfigurations],
  );

  const selectedGroup = useMemo(
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

  const programName = useMemo(() => {
    if (!draftBooking?.program) {
      return "-";
    }

    return isArabic
      ? draftBooking.program.nameAr || draftBooking.program.nameEn || "-"
      : draftBooking.program.nameEn || draftBooking.program.nameAr || "-";
  }, [draftBooking, isArabic]);

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
        paymentError?.message ||
          (isArabic ? "تعذر بدء عملية الدفع" : "Unable to initialize payment"),
      );
    }
  };

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
          subtitleAr="اختر طريقة الدفع المناسبة لإتمام الحجز بأمان."
          subtitleEn="Choose the most suitable payment method to complete your booking securely."
        />

        <BookingProgressTimeline currentStep="payment" isArabic={isArabic} />
        <ErrorOverlay show={Boolean(error)} message={error} />

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
        </div>
      </div>
    </div>
  );
}

/*
=====================================================
Payment Group Card
=====================================================
*/

function PaymentGroupCard({ group, selected, isArabic, onSelect }) {
  const meta = getPaymentGroupMeta(group.code, isArabic);

  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
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
    </button>
  );
}

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
            </p>
          </div>
        </div>

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
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-extrabold text-slate-900">
        {getPaymentGroupMeta(group.code, isArabic).title}
      </h3>

      {instructions && (
        <p className="mt-2 text-sm leading-6 text-slate-500">{instructions}</p>
      )}
    </div>
  );
}

/*
=====================================================
Bank Transfer Content
=====================================================
*/

function BankTransferContent({
  configuration,
  selectedBankAccountId,
  setSelectedBankAccountId,
  isArabic,
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
        {accounts.map((account) => {
          const selected = selectedBankAccountId === account._id;

          return (
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
                  <div className="font-bold text-slate-900">
                    {isArabic
                      ? account.bankNameAr || account.bankNameEn
                      : account.bankNameEn || account.bankNameAr}
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {account.beneficiaryName ||
                      account.accountNameAr ||
                      account.accountNameEn ||
                      "-"}
                  </div>

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
          );
        })}
      </div>
    </div>
  );
}

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
    </div>
  );
}

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
          value={formatDate(draftBooking?.program?.startDate, isArabic)}
        />

        <SummaryItem
          label={isArabic ? "تاريخ النهاية" : "End Date"}
          value={formatDate(draftBooking?.program?.endDate, isArabic)}
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

function formatDate(value, isArabic) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(isArabic ? "en-US" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMoney(value, currency = "SAR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
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

