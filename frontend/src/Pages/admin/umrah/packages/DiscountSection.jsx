import { Card, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function DiscountSection({
  discount = {
    discountType: "none",
    discountPercentage: 0,
    discountAmount: 0,
    discountExpiresAt: "",
  },
  setDiscount,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  const handleChange = (field, value) => {
    setDiscount((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="shadow-sm border-0 rounded-4">
      <Card.Header className="bg-white border-bottom py-3">
        <h5 className="fw-bold mb-0">
          {isArabic ? "الخصم" : "Discount"}
        </h5>
      </Card.Header>

      <Card.Body>
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>
              {isArabic ? "نوع الخصم" : "Discount Type"}
            </Form.Label>

            <Form.Select
              value={discount.discountType || "none"}
              onChange={(e) =>
                handleChange("discountType", e.target.value)
              }
            >
              <option value="none">
                {isArabic ? "بدون خصم" : "No Discount"}
              </option>
              <option value="percentage">
                {isArabic ? "نسبة مئوية" : "Percentage"}
              </option>
              <option value="fixed">
                {isArabic ? "مبلغ ثابت" : "Fixed Amount"}
              </option>
            </Form.Select>
          </Col>

          {discount.discountType === "percentage" && (
            <Col md={4}>
              <Form.Label>
                {isArabic ? "نسبة الخصم %" : "Discount Percentage"}
              </Form.Label>

              <Form.Control
                type="number"
                min="0"
                max="100"
                value={discount.discountPercentage || 0}
                onChange={(e) =>
                  handleChange("discountPercentage", e.target.value)
                }
              />
            </Col>
          )}

          {discount.discountType === "fixed" && (
            <Col md={4}>
              <Form.Label>
                {isArabic ? "مبلغ الخصم" : "Discount Amount"}
              </Form.Label>

              <Form.Control
                type="number"
                min="0"
                value={discount.discountAmount || 0}
                onChange={(e) =>
                  handleChange("discountAmount", e.target.value)
                }
              />
            </Col>
          )}

          {discount.discountType !== "none" && (
            <Col md={4}>
              <Form.Label>
                {isArabic ? "تاريخ انتهاء الخصم" : "Discount Expiry Date"}
              </Form.Label>

              <Form.Control
                type="date"
                value={discount.discountExpiresAt || ""}
                onChange={(e) =>
                  handleChange("discountExpiresAt", e.target.value)
                }
              />
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );
}