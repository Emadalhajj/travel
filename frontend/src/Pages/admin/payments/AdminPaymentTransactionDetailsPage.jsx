import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  approveBankTransfer,
  cancelPaymentTransaction,
  capturePaymentTransaction,
  fetchPaymentTransactionDetails,
  refundPaymentTransaction,
  rejectBankTransfer,
} from "../../../redux/payments/paymentTransactionSlice";

const ACTIONS = {
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  CAPTURE: "CAPTURE",
  REFUND: "REFUND",
  CANCEL: "CANCEL",
};

const getOperationErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.message ||
    error?.errors?.[error?.field] ||
    "تعذر تنفيذ عملية الدفع"
  );
};

export default function AdminPaymentTransactionDetailsPage() {
  const { transactionId } = useParams();
  const dispatch = useDispatch();
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");

  const {
    selectedTransaction: transaction,
    detailsLoading,
    operationLoading,
    error,
  } = useSelector((state) => state.paymentTransactions);

  useEffect(() => {
    dispatch(fetchPaymentTransactionDetails(transactionId));
  }, [dispatch, transactionId]);

  const status = String(transaction?.status || "").toUpperCase();

  const availableActions = useMemo(() => ({
    approve:
      transaction?.paymentMethodCode === "BANK_TRANSFER" &&
      ["PENDING_VERIFICATION", "PENDING_REVIEW"].includes(status),
    reject:
      transaction?.paymentMethodCode === "BANK_TRANSFER" &&
      ["PENDING_VERIFICATION", "PENDING_REVIEW"].includes(status),
    capture: ["AUTHORIZED", "PROCESSING", "PENDING_REVIEW"].includes(status),
    refund: ["CAPTURED", "SUCCESS", "PAID_PENDING_BOOKING"].includes(status),
    cancel: [
      "INITIATED",
      "PENDING",
      "PENDING_PROOF",
      "PENDING_APPROVAL",
      "PENDING_VERIFICATION",
      "PENDING_REVIEW",
      "PROCESSING",
      "AUTHORIZED",
    ].includes(status),
  }), [status, transaction]);

  const executeAction = async () => {
    const payload = { transactionId };

    try {
      if (dialog === ACTIONS.APPROVE) {
        payload.notes = reason;
        await dispatch(approveBankTransfer(payload)).unwrap();
      } else if (dialog === ACTIONS.REJECT) {
        payload.reason = reason;
        await dispatch(rejectBankTransfer(payload)).unwrap();
      } else if (dialog === ACTIONS.CAPTURE) {
        payload.notes = reason;
        await dispatch(capturePaymentTransaction(payload)).unwrap();
      } else if (dialog === ACTIONS.REFUND) {
        payload.reason = reason;
        await dispatch(refundPaymentTransaction(payload)).unwrap();
      } else if (dialog === ACTIONS.CANCEL) {
        payload.reason = reason;
        await dispatch(cancelPaymentTransaction(payload)).unwrap();
      }

      setDialog(null);
      setReason("");
      toast.success("تم تنفيذ عملية الدفع بنجاح");

      await dispatch(
        fetchPaymentTransactionDetails(transactionId),
      ).unwrap();
    } catch (operationError) {
      toast.error(
        getOperationErrorMessage(operationError),
      );
    }
  };

  if (detailsLoading && !transaction) {
    return <div className="py-5 text-center"><Spinner /></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">تفاصيل معاملة الدفع</h3>
        <div className="d-flex flex-wrap gap-2">
          {availableActions.approve && (
            <Button variant="success" onClick={() => setDialog(ACTIONS.APPROVE)}>
              اعتماد التحويل
            </Button>
          )}
          {availableActions.reject && (
            <Button variant="danger" onClick={() => setDialog(ACTIONS.REJECT)}>
              رفض التحويل
            </Button>
          )}
          {availableActions.capture && (
            <Button onClick={() => setDialog(ACTIONS.CAPTURE)}>Capture</Button>
          )}
          {availableActions.refund && (
            <Button variant="warning" onClick={() => setDialog(ACTIONS.REFUND)}>
              Refund
            </Button>
          )}
          {availableActions.cancel && (
            <Button variant="outline-danger" onClick={() => setDialog(ACTIONS.CANCEL)}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          {error?.message || String(error)}
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Body>
          <div><strong>الحالة:</strong> {status}</div>
          <div><strong>المرجع:</strong> {transaction?.paymentReference || "—"}</div>
          <div><strong>مرجع المزود:</strong> {transaction?.providerReference || "—"}</div>
          <div><strong>المبلغ:</strong> {transaction?.amount} {transaction?.currency}</div>
          <div><strong>الطريقة:</strong> {transaction?.paymentMethodCode}</div>
          <div><strong>المزود:</strong> {transaction?.providerCode || "—"}</div>
          <div><strong>رقم الحجز:</strong> {transaction?.booking?.bookingNumber || "—"}</div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Timeline</Card.Header>
        <Card.Body>
          {(transaction?.timeline || []).map((event, index) => (
            <div key={`${event.eventCode}-${event.createdAt}-${index}`} className="border-bottom py-3">
              <div className="fw-bold">{event.eventCode}</div>
              <div>{event.fromStatus || "—"} → {event.toStatus || "—"}</div>
              <div>{event.message}</div>
              <small className="text-muted">
                {event.createdAt
                  ? new Date(event.createdAt).toLocaleString("ar-SA")
                  : ""}
              </small>
            </div>
          ))}
          {!transaction?.timeline?.length && <div>لا توجد أحداث</div>}
        </Card.Body>
      </Card>

      <Modal show={Boolean(dialog)} onHide={() => setDialog(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد العملية</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>السبب أو الملاحظات</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDialog(null)}>
            إلغاء
          </Button>
          <Button
            disabled={operationLoading || ([ACTIONS.REJECT, ACTIONS.REFUND, ACTIONS.CANCEL].includes(dialog) && !reason.trim())}
            onClick={executeAction}
          >
            {operationLoading ? <Spinner size="sm" /> : "تنفيذ"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
