import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import api from "../../../services/api/api";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

export default function PublicPaymentRedirectPage() {
  const { draftId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentReference = searchParams.get("reference");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reference = useMemo(() => {
    return paymentReference || `PAY-TEST-${Date.now()}`;
  }, [paymentReference]);

  const handleConfirmTestPayment = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/payment/callback", {
        draftId,
        paymentReference: reference,
        gateway: "test_gateway",
        status: "paid",
        currency: "SAR",
        transactionId: `TXN-${Date.now()}`,
        method: "card",
      });

      const bookingId = data?.data?.booking?._id;

      if (bookingId) {
        navigate(`/booking/success/${bookingId}`);
        return;
      }

      throw new Error("لم يتم استلام رقم الحجز بعد الدفع");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "حدث خطأ أثناء تأكيد الدفع",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
          💳
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">
          بوابة دفع تجريبية
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          هذه الصفحة مؤقتة لمحاكاة نجاح الدفع أثناء التطوير.
          لاحقًا سيتم استبدالها ببوابة دفع حقيقية مثل HyperPay أو PayTabs.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-bold">Payment Reference</p>
          <p className="mt-1 break-all">{reference}</p>
        </div>

        <ErrorOverlay show={Boolean(error)} message={error} />

        <button
          type="button"
          onClick={handleConfirmTestPayment}
          className="mt-8 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white hover:bg-emerald-700"
        >
          تأكيد الدفع التجريبي
        </button>

        <button
          type="button"
          onClick={() => navigate(`/booking/payment/${draftId}`)}
          className="mt-3 w-full rounded-2xl border border-slate-200 px-6 py-4 text-base font-bold text-slate-700 hover:bg-slate-50"
        >
          العودة لصفحة الدفع
        </button>
      </div>
    </div>
  );
}