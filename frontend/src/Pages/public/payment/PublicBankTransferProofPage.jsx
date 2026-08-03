import { useMemo, useState } from "react";

import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useParams } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { toast } from "react-toastify";

import { submitBankTransferProof } from "../../../redux/public/publicPaymentSlice";

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

  const instructions = isArabic
    ? initializationResult?.instructionsAr
    : initializationResult?.instructionsEn;

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

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);

    setProofAttachments(files);
  };

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

      navigate(`/draft-booking/${draftId}`, {
        replace: true,
      });
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
      <div className="container py-5">
        <Alert variant="warning">
          {isArabic
            ? "بيانات الحساب البنكي غير متاحة. ارجع إلى صفحة الدفع وأعد اختيار طريقة الدفع."
            : "Bank account details are unavailable. Return to the payment page and select the payment method again."}
        </Alert>

        <Button onClick={() => navigate(`/booking/payment/${draftId}`)}>
          {isArabic ? "العودة إلى الدفع" : "Back to payment"}
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h3 className="mb-4">
                {isArabic ? "تأكيد التحويل البنكي" : "Confirm bank transfer"}
              </h3>

              {instructions && <Alert variant="info">{instructions}</Alert>}

              <div className="border rounded-3 p-3 mb-4 bg-light">
                <div className="fw-bold mb-2">
                  {isArabic
                    ? bankAccount.bankNameAr || bankAccount.bankNameEn
                    : bankAccount.bankNameEn || bankAccount.bankNameAr}
                </div>

                <div>
                  {isArabic
                    ? bankAccount.accountNameAr || bankAccount.beneficiaryName
                    : bankAccount.accountNameEn || bankAccount.beneficiaryName}
                </div>

                <div dir="ltr" className="mt-2">
                  IBAN: {bankAccount.iban}
                </div>

                {bankAccount.accountNumber && (
                  <div dir="ltr">Account: {bankAccount.accountNumber}</div>
                )}

                {bankAccount.swiftCode && (
                  <div dir="ltr">SWIFT: {bankAccount.swiftCode}</div>
                )}
              </div>

              <Form.Group className="mb-4">
                <Form.Label>
                  {isArabic ? "الرقم المرجعي للحوالة" : "Transfer reference"}

                  {requiresReference && (
                    <span className="text-danger ms-1">*</span>
                  )}
                </Form.Label>

                <Form.Control
                  value={transferReference}
                  onChange={(event) => setTransferReference(event.target.value)}
                  isInvalid={Boolean(proofFieldErrors.transferReference)}
                />

                <Form.Control.Feedback type="invalid">
                  {proofFieldErrors.transferReference}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  {isArabic ? "إيصال التحويل" : "Transfer receipt"}

                  {requiresAttachment && (
                    <span className="text-danger ms-1">*</span>
                  )}
                </Form.Label>

                <Form.Control
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={handleFilesChange}
                  isInvalid={Boolean(proofFieldErrors.proofAttachments)}
                />

                <Form.Text>
                  {isArabic
                    ? "يمكن رفع صورة أو ملف PDF."
                    : "You can upload an image or PDF file."}
                </Form.Text>

                {proofFieldErrors.proofAttachments && (
                  <div className="text-danger small mt-1">
                    {proofFieldErrors.proofAttachments}
                  </div>
                )}
              </Form.Group>

              <div className="d-flex gap-2">
                <Button
                  variant="secondary"
                  disabled={proofSubmitting}
                  onClick={() => navigate(`/booking/payment/${draftId}`)}
                >
                  {isArabic ? "رجوع" : "Back"}
                </Button>

                <Button
                  variant="primary"
                  disabled={proofSubmitting || !canSubmit}
                  onClick={handleSubmit}
                >
                  {proofSubmitting
                    ? isArabic
                      ? "جارٍ الإرسال..."
                      : "Submitting..."
                    : isArabic
                      ? "إرسال للمراجعة"
                      : "Submit for review"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
