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

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";

import { fetchPublicDraftBookingById } from "../../../redux/public/bookingSlice";
import {
  fetchPublicPaymentConfigurations,
  selectPublicPaymentConfigurations,
  selectPublicPaymentConfigurationsError,
  selectPublicPaymentConfigurationsLoading,
} from "../../../redux/public/publicPaymentConfigurationSlice";
import { initializePublicPayment } from "../../../redux/public/publicPaymentSlice";
import {
  PAYMENT_CONFIGURATION_TYPES,
  PAYMENT_SECTION_CODES,
  PUBLIC_PAYMENT_GROUPS,
  groupPublicPaymentConfigurations,
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

export default function PublicBookingPaymentPage() {
  const { draftId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { draftBooking, loading, error } = useSelector(
    (state) => state.publicBooking,
  );
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

  const lang = localStorage.getItem("lang") || "ar";
  const isArabic = lang === "ar";

  const [selectedGroupCode, setSelectedGroupCode] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [embeddedPayment, setEmbeddedPayment] = useState(null);

  useEffect(() => {
    if (draftId) dispatch(fetchPublicDraftBookingById(draftId));
  }, [dispatch, draftId]);

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

  useEffect(() => {
    if (!draftBooking?._id) return;

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

  const paymentGroups = useMemo(
    () => groupPublicPaymentConfigurations(paymentConfigurations),
    [paymentConfigurations],
  );

  const selectedGroup = useMemo(
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

  const programName = useMemo(() => {
    if (!draftBooking?.program) return "-";

    return isArabic
      ? draftBooking.program.nameAr || draftBooking.program.nameEn || "-"
      : draftBooking.program.nameEn || draftBooking.program.nameAr || "-";
  }, [draftBooking, isArabic]);

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
    }
  };

  const handleContinuePayment = async () => {
    if (!selectedConfiguration) {
      toast.error(
        isArabic
          ? "يرجى اختيار طريقة الدفع"
          : "Please select a payment method",
      );
      return;
    }

    try {
      const result = await initializeConfiguration(selectedConfiguration);
      if (!result) return;

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

      if (result.action === "BANK_TRANSFER") {
        navigate(
          `/booking/payment/${draftId}/bank-transfer/${result.paymentTransactionId}`,
        );
        return;
      }

      if (result.action === "PENDING_APPROVAL") {
        navigate(
          `/booking/payment/${draftId}/pending/${result.paymentTransactionId}`,
        );
      }
    } catch (paymentError) {
      toast.error(
        paymentError?.message ||
          (isArabic
            ? "تعذر بدء عملية الدفع"
            : "Unable to initialize payment"),
      );
    }
  };

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
          subtitleAr="اختر طريقة الدفع المناسبة وأكمل العملية من نفس الصفحة."
          subtitleEn="Choose the payment option that suits you and complete it securely."
        />

        <BookingProgressTimeline currentStep="payment" isArabic={isArabic} />
        <ErrorOverlay show={Boolean(error)} message={error} />

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
        </div>
      </div>
    </div>
  );
}

function PaymentGroupCard({ group, isArabic, selected, onSelect }) {
  const meta = PAYMENT_GROUP_META[group.code];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
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
    </button>
  );
}

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
            </p>
          </div>
        </div>

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
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
}

function BankTransferPanel({
  configuration,
  selectedBankAccountId,
  setSelectedBankAccountId,
  isArabic,
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
        {accounts.map((account) => {
          const selected = selectedBankAccountId === account._id;

          return (
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
                  <div className="font-bold text-slate-900">
                    {isArabic
                      ? account.bankNameAr || account.bankNameEn
                      : account.bankNameEn || account.bankNameAr}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {account.beneficiaryName ||
                      account.accountNameAr ||
                      account.accountNameEn ||
                      "-"}
                  </div>
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
          );
        })}
      </div>
    </div>
  );
}

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
    </div>
  );
}

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

function formatDate(value, isArabic) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

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
