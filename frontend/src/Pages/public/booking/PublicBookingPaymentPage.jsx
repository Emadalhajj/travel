import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import api from "../../../services/api/api";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";

import { fetchPublicDraftBookingById } from "../../../redux/public/bookingSlice";
import { calculateBookingPricing } from "../../../Components/shared/booking-wizard/bookingPricing";

const paymentMethods = [
  {
    id: "mada",
    labelAr: "بطاقة مدى",
    labelEn: "Mada Card",
    descriptionAr: "الدفع عبر بطاقة مدى البنكية",
    descriptionEn: "Pay with Mada debit card",
    icon: "💳",
    brands: "MADA",
  },
  {
    id: "credit",
    labelAr: "بطاقة ائتمانية",
    labelEn: "Credit Card",
    descriptionAr: "Visa / MasterCard",
    descriptionEn: "Visa / MasterCard",
    icon: "💳",
    brands: "VISA MASTER",
  },
  {
    id: "sadad",
    labelAr: "سداد",
    labelEn: "SADAD",
    descriptionAr: "إنشاء فاتورة سداد لإتمام الدفع",
    descriptionEn: "Create SADAD bill",
    icon: "📱",
    brands: "",
  },
];

export default function PublicBookingPaymentPage() {
  const { draftId } = useParams();
  const dispatch = useDispatch();

  const { draftBooking, loading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const lang = localStorage.getItem("lang") || "ar";
  const isArabic = lang === "ar";

  const [selectedMethod, setSelectedMethod] = useState("mada");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [checkoutId, setCheckoutId] = useState("");
  const [sadadReference, setSadadReference] = useState("");

  useEffect(() => {
    if (draftId) {
      dispatch(fetchPublicDraftBookingById(draftId));
    }
  }, [dispatch, draftId]);

  useEffect(() => {
    if (!checkoutId || selectedMethod === "sadad") return;

    const oldScript = document.getElementById("hyperpay-widget-script");
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = "hyperpay-widget-script";
    script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById("hyperpay-widget-script");
      if (existingScript) existingScript.remove();
    };
  }, [checkoutId, selectedMethod]);

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

  const programName = useMemo(() => {
    if (!draftBooking?.program) return "-";

    return isArabic
      ? draftBooking.program.nameAr || draftBooking.program.nameEn || "-"
      : draftBooking.program.nameEn || draftBooking.program.nameAr || "-";
  }, [draftBooking, isArabic]);

  const activeMethod = paymentMethods.find(
    (method) => method.id === selectedMethod,
  );

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId);
    setCheckoutId("");
    setSadadReference("");
    setPaymentError("");
  };

  const handleStartPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentError("");
      setCheckoutId("");
      setSadadReference("");

      const { data } = await api.post("/payment/checkout-session", {
        draftId,
        paymentMethod: selectedMethod,
        gateway: selectedMethod === "sadad" ? "sadad" : "hyperpay",
      });

      const nextCheckoutId = data?.data?.checkoutId;
      const paymentReference = data?.data?.paymentReference;

      if (selectedMethod === "sadad") {
        setSadadReference(paymentReference || "");
        return;
      }

      if (nextCheckoutId) {
        setCheckoutId(nextCheckoutId);
        return;
      }

      throw new Error(
        isArabic ? "لم يتم استلام جلسة الدفع" : "Checkout session not received",
      );
    } catch (err) {
      setPaymentError(
        err?.response?.data?.message ||
          err?.message ||
          (isArabic
            ? "حدث خطأ أثناء إنشاء جلسة الدفع"
            : "Failed to create checkout session"),
      );
    } finally {
      setIsProcessing(false);
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
        <ErrorOverlay show={Boolean(paymentError)} message={paymentError} />

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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {paymentMethods.map((method) => {
                  const active = selectedMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleSelectMethod(method.id)}
                      className={`rounded-2xl border-2 p-5 text-center transition ${
                        active
                          ? "border-lime-400 bg-white shadow-md"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-3xl">{method.icon}</div>

                      <div className="mt-3 text-sm font-bold text-purple-900">
                        {isArabic ? method.labelAr : method.labelEn}
                      </div>

                      <div className="mt-2 text-xs leading-5 text-slate-500">
                        {isArabic
                          ? method.descriptionAr
                          : method.descriptionEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <h3 className="text-base font-bold text-emerald-800">
                  {isArabic ? activeMethod?.labelAr : activeMethod?.labelEn}
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  {selectedMethod === "sadad"
                    ? isArabic
                      ? "سيتم إنشاء مرجع سداد لإتمام الدفع من تطبيق البنك."
                      : "A SADAD reference will be created for payment."
                    : isArabic
                      ? "سيتم عرض نموذج الدفع الآمن الخاص ببوابة HyperPay داخل الصفحة."
                      : "The secure HyperPay payment widget will be displayed on this page."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartPayment}
                disabled={isProcessing || !draftBooking}
                className="mt-8 w-full rounded-2xl bg-emerald-600 px-6 py-5 text-xl font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isProcessing
                  ? isArabic
                    ? "جاري إنشاء جلسة الدفع..."
                    : "Creating checkout session..."
                  : isArabic
                    ? `المتابعة للدفع ${formatMoney(
                        pricing.total || pricing.totalPrice,
                        pricing.currency,
                      )}`
                    : `Continue to pay ${formatMoney(
                        pricing.total || pricing.totalPrice,
                        pricing.currency,
                      )}`}
              </button>

              {checkoutId && selectedMethod !== "sadad" && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-5 text-lg font-bold text-slate-900">
                    {isArabic ? "بيانات الدفع" : "Payment Details"}
                  </h3>

                  <form
                    action={`/booking/payment/redirect/${draftId}`}
                    className="paymentWidgets"
                    data-brands={activeMethod?.brands || "VISA MASTER"}
                  />
                </div>
              )}

              {sadadReference && selectedMethod === "sadad" && (
                <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <h3 className="text-lg font-bold text-blue-900">
                    {isArabic ? "مرجع سداد" : "SADAD Reference"}
                  </h3>

                  <p className="mt-3 break-all text-sm font-bold text-blue-700">
                    {sadadReference}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-blue-700">
                    {isArabic
                      ? "استخدم هذا المرجع لإتمام الدفع عبر تطبيق البنك."
                      : "Use this reference to complete payment through your bank app."}
                  </p>
                </div>
              )}

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
