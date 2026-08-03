import { useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchPaymentTransactions,
  setPaymentTransactionFilters,
} from "../../../redux/payments/paymentTransactionSlice";

const STATUS_OPTIONS = [
  "",
  "INITIATED",
  "PENDING",
  "PENDING_PROOF",
  "PENDING_VERIFICATION",
  "PENDING_REVIEW",
  "PROCESSING",
  "AUTHORIZED",
  "CAPTURED",
  "SUCCESS",
  "FAILED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
  "REFUNDED",
];

export default function AdminPaymentTransactionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items,
    pagination,
    filters,
    listLoading,
  } = useSelector(
    (state) => state.paymentTransactions,
  );

  useEffect(() => {
    dispatch(fetchPaymentTransactions(filters));
  }, [dispatch, filters]);

  const updateFilter = (field, value) => {
    dispatch(
      setPaymentTransactionFilters({
        [field]: value,
        ...(field !== "page" ? { page: 1 } : {}),
      }),
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">معاملات الدفع</h3>
        <Button
          variant="outline-secondary"
          onClick={() =>
            dispatch(fetchPaymentTransactions(filters))
          }
        >
          تحديث
        </Button>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Control
                value={filters.search}
                placeholder="مرجع الدفع أو التحويل"
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value)
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status || "ALL"} value={status}>
                    {status || "كل الحالات"}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                value={filters.paymentMethodCode}
                placeholder="طريقة الدفع"
                onChange={(event) =>
                  updateFilter(
                    "paymentMethodCode",
                    event.target.value.toUpperCase(),
                  )
                }
              />
            </Col>
            <Col md={2}>
              <Form.Control
                value={filters.providerCode}
                placeholder="المزود"
                onChange={(event) =>
                  updateFilter(
                    "providerCode",
                    event.target.value.toUpperCase(),
                  )
                }
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  updateFilter("dateFrom", event.target.value)
                }
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          {listLoading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>المرجع</th>
                  <th>الحجز</th>
                  <th>الطريقة</th>
                  <th>المزود</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.transactionId}>
                    <td>{item.paymentReference || item.transactionId}</td>
                    <td>{item.bookingNumber || "—"}</td>
                    <td>{item.paymentMethodCode}</td>
                    <td>{item.providerCode || "—"}</td>
                    <td>{item.amount} {item.currency}</td>
                    <td>{item.status}</td>
                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("ar-SA")
                        : "—"}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/admin/payments/payment-transactions/${item.transactionId}`,
                          )
                        }
                      >
                        التفاصيل
                      </Button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {pagination && (
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button
            variant="outline-secondary"
            disabled={!pagination.hasPreviousPage}
            onClick={() => updateFilter("page", filters.page - 1)}
          >
            السابق
          </Button>
          <span className="align-self-center">
            {pagination.page} / {pagination.totalPages || 1}
          </span>
          <Button
            variant="outline-secondary"
            disabled={!pagination.hasNextPage}
            onClick={() => updateFilter("page", filters.page + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
