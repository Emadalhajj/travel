import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";

import { fetchPublicDraftBookingById } from "../../../redux/public/bookingSlice";
import {
  fetchPublicPaymentConfigurations,
  selectPublicPaymentConfigurations,
  selectPublicPaymentConfigurationsLoading,
  selectPublicPaymentConfigurationsError,
} from "../../../redux/public/publicPaymentConfigurationSlice";
import {
  initializePublicPayment,
} from "../../../redux/public/publicPaymentSlice";
import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";
import {
  PAYMENT_CONFIGURATION_TYPES,
  PAYMENT_SECTION_CODES,
} from "../../../constants/payments/paymentConfigurationConstants";

export default function PublicBookingPaymentPage() {
  const { draftId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { draftBooking, loading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const paymentConfigurations = useSelector(
    selectPublicPaymentConfigurations,
  );
  const paymentMethodsLoading = useSelector(
    selectPublicPaymentConfigurationsLoading,
  );
  const paymentMethodsError = useSelector(
    selectPublicPaymentConfigurationsError,
  );
  const initializationLoading = useSelector(
    (state) =>
      Boolean(
        state.publicPayment
          ?.initializationLoading,
      ),
  );

  const lang = localStorage.getItem("lang") || "ar";
  const isArabic = lang === "ar";

  const [selectedConfigurationId, setSelectedConfigurationId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

  useEffect(() => {
    if (draftId) {
      dispatch(fetchPublicDraftBookingById(draftId));
    }
  }, [dispatch, draftId]);

  const travelers = useMemo(() => {
    return draftBooking?.travelers || [];
  }, [draftBooking]);

  const selectedProducts = useMemo(() => {
    return (
      draftBooking?.data?.selectedProducts ||
      draftBooking?.data?.selectedProductsList ||
      []
    );
  }, [draftBooking]);

  const pricing = useMemo(() => {
    return calculateBookingPricing({
      selectedPackage:
        draftBooking?.data?.selectedPackage || draftBooking?.program,
      travelers,
      selectedProducts,
      fallbackPricing: draftBooking?.pricing || {},
    });
  }, [draftBooking, travelers, selectedProducts]);

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

  const programName = useMemo(() => {
    if (!draftBooking?.program) return "-";

    return isArabic
      ? draftBooking.program.nameAr || draftBooking.program.nameEn || "-"
      : draftBooking.program.nameEn || draftBooking.program.nameAr || "-";
  }, [draftBooking, isArabic]);

  const selectedConfiguration = paymentConfigurations.find(
    (configuration) =>
      configuration._id === selectedConfigurationId,
  );

  const handleSelectConfiguration = (configurationId) => {
    setSelectedConfigurationId(configurationId);
    setSelectedBankAccountId("");
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

    if (
      selectedConfiguration.configurationType ===
        PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT &&
      !selectedBankAccountId
    ) {
      toast.error(
        isArabic
          ? "يرجى اختيار الحساب البنكي"
          : "Please select a bank account",
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
    } catch (paymentInitializationError) {
      toast.error(
        paymentInitializationError?.message ||
          (isArabic
            ? "تعذر بدء عملية الدفع"
            : "Unable to initialize payment"),
      );
    }
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
          subtitleAr="اختر طريقة الدفع المناسبة، وسيتم عرض نموذج الدفع الآمن."
          subtitleEn="Choose a payment method and continue securely."
        />
        <BookingProgressTimeline
  currentStep="payment"
  isArabic={isArabic}
/>

        <ErrorOverlay show={Boolean(error)} message={error} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-5">
            <div className="sticky top-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">
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
                    ? "المبلغ النهائي يتم اعتماده من الخادم عند إنشاء جلسة الدفع."
                    : "The final amount is calculated server-side when creating the payment session."}
                </p>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-7">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-8 text-2xl font-bold text-slate-900">
                {isArabic ? "اختر طريقة الدفع" : "Choose Payment Method"}
              </h2>

              {paymentMethodsLoading ? (
                <div className="py-8 text-center text-slate-500">
                  {isArabic
                    ? "جارٍ تحميل طرق الدفع..."
                    : "Loading payment methods..."}
                </div>
              ) : paymentMethodsError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {paymentMethodsError?.message || String(paymentMethodsError)}
                </div>
              ) : paymentConfigurations.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  {isArabic
                    ? "لا توجد طرق دفع متاحة لهذا الحجز حاليًا."
                    : "No payment methods are currently available for this booking."}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {paymentConfigurations.map((configuration) => {
                    const isSelected =
                      selectedConfigurationId === configuration._id;
                    const title = isArabic
                      ? configuration.displayNameAr ||
                        configuration.paymentMethodCode
                      : configuration.displayNameEn ||
                        configuration.paymentMethodCode;
                    const instructions = isArabic
                      ? configuration.instructionsAr
                      : configuration.instructionsEn;

                    return (
                      <div
                        key={configuration._id}
                        className={`rounded-2xl border-2 p-5 transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-3 font-bold text-slate-900">
                          <input
                            type="radio"
                            name="paymentConfiguration"
                            value={configuration._id}
                            checked={isSelected}
                            onChange={() =>
                              handleSelectConfiguration(
                                configuration._id,
                              )
                            }
                          />
                          <span>{title}</span>
                        </label>

                        {instructions && (
                          <p className="mt-2 text-sm text-slate-500">
                            {instructions}
                          </p>
                        )}

                        {isSelected &&
                          configuration.configurationType ===
                            PAYMENT_CONFIGURATION_TYPES.BANK_ACCOUNT && (
                            <div className="mt-4 space-y-2">
                              {(configuration.bankAccounts || []).map(
                                (account) => (
                                  <label
                                    key={account._id}
                                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                                  >
                                    <input
                                      type="radio"
                                      name="bankAccount"
                                      value={account._id}
                                      checked={
                                        selectedBankAccountId === account._id
                                      }
                                      onChange={() =>
                                        setSelectedBankAccountId(account._id)
                                      }
                                    />
                                    <div>
                                      <div className="font-bold">
                                        {isArabic
                                          ? account.bankNameAr ||
                                            account.bankNameEn
                                          : account.bankNameEn ||
                                            account.bankNameAr}
                                      </div>
                                      <div className="text-sm text-slate-600">
                                        {isArabic
                                          ? account.accountNameAr ||
                                            account.beneficiaryName
                                          : account.accountNameEn ||
                                            account.beneficiaryName}
                                      </div>
                                      <div className="mt-1 text-sm" dir="ltr">
                                        IBAN: {account.iban || "-"}
                                      </div>
                                    </div>
                                  </label>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleContinuePayment}
                disabled={
                  initializationLoading ||
                  !selectedConfigurationId
                }
                className="mt-8 w-full rounded-2xl bg-emerald-600 px-6 py-5 text-xl font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {initializationLoading
                  ? isArabic
                    ? "جارٍ تجهيز الدفع..."
                    : "Preparing payment..."
                  : isArabic
                    ? "متابعة الدفع"
                    : "Continue payment"}
              </button>

              <p className="mt-4 text-center text-xs leading-6 text-slate-500">
                {isArabic
                  ? "لا يتم تخزين بيانات البطاقة أو رمز CVV داخل النظام."
                  : "Card number and CVV are never stored or processed by this system."}
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

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
    <div className="mb-4 flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>

      <span
        className={
          strong
            ? "text-lg font-extrabold text-emerald-700"
            : "text-sm font-bold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatMoney(amount, currency = "SAR") {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-CA");
}
