import { useMemo, useState } from "react";

import { Form } from "react-bootstrap";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useParams } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { toast } from "react-toastify";

import { submitBankTransferProof } from "../../../redux/public/publicPaymentSlice";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ReceiptText,
  Send,
  ShieldCheck,
} from "lucide-react";

import CopyableValue from "../../../Components/common/CopyableValue";
import FileAttachmentUploader from "../../../Components/common/FileAttachmentUploader";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";
import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";

const sanitizeInstructions = (value) => {
  const instructions = String(value || "").trim();

  if (
    (instructions.startsWith("{") || instructions.startsWith("[")) &&
    /"(?:success|message|field|errors)"\s*:/.test(instructions)
  ) {
    return "";
  }

  return instructions;
};

export default function PublicBankTransferProofPage() {
  const { draftId, transactionId } = useParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const initializationResult = useSelector(
    (state) => state.publicPayment?.initializationResult || null,
  );

  const proofSubmitting = useSelector((state) =>
    Boolean(state.publicPayment?.proofSubmitting),
  );

  const proofFieldErrors = useSelector(
    (state) => state.publicPayment?.proofFieldErrors || {},
  );

  const [transferReference, setTransferReference] = useState("");

  const [proofAttachments, setProofAttachments] = useState([]);

  const bankAccount =
    initializationResult?.bankAccounts?.[0] ||
    initializationResult?.bankAccount ||
    null;

  const requiresReference = Boolean(initializationResult?.requiresReference);

  const requiresAttachment = Boolean(initializationResult?.requiresAttachment);

  const instructions = sanitizeInstructions(
    isArabic
      ? initializationResult?.instructionsAr
      : initializationResult?.instructionsEn,
  );

  const canSubmit = useMemo(() => {
    if (requiresReference && !transferReference.trim()) {
      return false;
    }

    if (requiresAttachment && proofAttachments.length === 0) {
      return false;
    }

    return true;
  }, [
    requiresReference,
    requiresAttachment,
    transferReference,
    proofAttachments,
  ]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(
        isArabic
          ? "يرجى استكمال بيانات التحويل"
          : "Please complete the transfer details",
      );

      return;
    }

    try {
      await dispatch(
        submitBankTransferProof({
          transactionId,

          transferReference,

          proofAttachments,
        }),
      ).unwrap();

      toast.success(
        isArabic
          ? "تم إرسال إثبات التحويل للمراجعة"
          : "Transfer proof submitted for review",
      );

      navigate(
        `/booking/payment/${draftId}/result?transactionId=${encodeURIComponent(
          transactionId,
        )}`,
        {
        replace: true,
        },
      );
    } catch (error) {
      toast.error(
        error?.message ||
          (isArabic
            ? "تعذر إرسال إثبات التحويل"
            : "Unable to submit transfer proof"),
      );
    }
  };

  if (!bankAccount) {
    return (
      <PublicPageLayout containerClassName="max-w-4xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          {isArabic
            ? "بيانات الحساب البنكي غير متاحة. ارجع إلى صفحة الدفع وأعد اختيار طريقة الدفع."
            : "Bank account details are unavailable. Return to the payment page and select the payment method again."}
        </div>

        <button
          type="button"
          className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
          onClick={() => navigate(`/booking/payment/${draftId}`)}
        >
          {isArabic ? "العودة إلى الدفع" : "Back to payment"}
        </button>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout containerClassName="max-w-6xl">
      <PageHeader
        eyebrowAr="إثبات الدفع"
        eyebrowEn="Payment Proof"
        titleAr="تأكيد التحويل البنكي"
        titleEn="Confirm Bank Transfer"
        subtitleAr="حوّل المبلغ إلى الحساب المحدد، ثم أرفق الإيصال لإرساله إلى المراجعة."
        subtitleEn="Transfer the amount to the selected account, then attach the receipt for review."
      />

      <BookingProgressTimeline currentStep="payment" isArabic={isArabic} />

      {instructions && (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-800">
          {instructions}
        </div>
      )}

      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Building2 size={24} />
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-700">
                {isArabic ? "الحساب المحدد" : "Selected Account"}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                {isArabic
                  ? bankAccount.bankNameAr || bankAccount.bankNameEn
                  : bankAccount.bankNameEn || bankAccount.bankNameAr}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isArabic
                  ? bankAccount.accountNameAr || bankAccount.beneficiaryName
                  : bankAccount.accountNameEn || bankAccount.beneficiaryName}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <CopyableValue
              label="IBAN"
              value={bankAccount.iban}
              isArabic={isArabic}
            />
            <CopyableValue
              label={isArabic ? "رقم الحساب" : "Account Number"}
              value={bankAccount.accountNumber}
              isArabic={isArabic}
            />
            <CopyableValue
              label="SWIFT"
              value={bankAccount.swiftCode}
              isArabic={isArabic}
            />
          </div>

          <div className="mt-6 flex gap-2 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            <ShieldCheck className="mt-1 shrink-0" size={19} />
            <span>
              {isArabic
                ? "تأكد من مطابقة بيانات الحساب قبل تنفيذ التحويل واحتفظ بالإيصال."
                : "Verify the account details before transferring and keep your receipt."}
            </span>
          </div>
        </section>

        <section className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ReceiptText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {isArabic ? "بيانات الحوالة" : "Transfer Details"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isArabic
                  ? "أدخل الرقم المرجعي وارفع صورة الإيصال أو ملف PDF."
                  : "Enter the reference and upload a receipt image or PDF."}
              </p>
            </div>
          </div>

          <Form.Group className="mb-5">
            <Form.Label className="fw-semibold">
              {isArabic ? "الرقم المرجعي للحوالة" : "Transfer Reference"}
              {requiresReference && <span className="text-danger ms-1">*</span>}
            </Form.Label>
            <Form.Control
              size="lg"
              value={transferReference}
              placeholder={isArabic ? "أدخل الرقم المرجعي" : "Enter transfer reference"}
              onChange={(event) => setTransferReference(event.target.value)}
              isInvalid={Boolean(proofFieldErrors.transferReference)}
            />
            <Form.Control.Feedback type="invalid">
              {proofFieldErrors.transferReference}
            </Form.Control.Feedback>
          </Form.Group>

          <FileAttachmentUploader
            labelAr={`إيصال التحويل${requiresAttachment ? " *" : ""}`}
            labelEn={`Transfer Receipt${requiresAttachment ? " *" : ""}`}
            name="proofAttachments"
            multiple
            acceptedTypes=".jpg,.jpeg,.png,.pdf"
            maxFiles={5}
            maxSizeMB={10}
            initialFiles={proofAttachments}
            onChange={setProofAttachments}
          />

          {proofFieldErrors.proofAttachments && (
            <div className="mt-2 text-sm text-red-600">
              {proofFieldErrors.proofAttachments}
            </div>
          )}

          {proofAttachments.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              {isArabic
                ? `تم اختيار ${proofAttachments.length} مرفق`
                : `${proofAttachments.length} attachment(s) selected`}
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              disabled={proofSubmitting}
              onClick={() => navigate(`/booking/payment/${draftId}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isArabic ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              {isArabic ? "العودة" : "Back"}
            </button>

            <button
              type="button"
              disabled={proofSubmitting || !canSubmit}
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send size={18} />
              {proofSubmitting
                ? isArabic
                  ? "جارٍ الإرسال..."
                  : "Submitting..."
                : isArabic
                  ? "إرسال للمراجعة"
                  : "Submit for Review"}
            </button>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}
