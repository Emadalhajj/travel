import React from "react";
import { Pagination, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function PaginationComponent({
  total = 0,
  page = 1,
  limit = 10,
  totalPages = 0,
  onPageChange,
  onLimitChange,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className=" mb-3">
      <Row className="align-items-center justify-content-between g-3">
        
        {/* معلومات النتائج */}
        <Col xs={12} md={4} className="text-muted small text-center text-md-start">
          {isArabic 
            ? `${startItem} - ${endItem} من ${total} نتيجة`
            : `${startItem} - ${endItem} of ${total} results`}
        </Col>

        {/* الترقيم الرئيسي */}
        <Col xs={12} md={4} className="d-flex justify-content-center">
          <Pagination className="mb-0 custom-pagination">
            <Pagination.First 
              onClick={() => onPageChange(1)} 
              disabled={page === 1}
            />
            <Pagination.Prev 
              onClick={() => onPageChange(page - 1)} 
              disabled={page === 1}
            />

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => {
                if (totalPages <= 7) return true;
                return p === 1 || p === totalPages || 
                       (p >= page - 2 && p <= page + 2);
              })
              .map((p, index, array) => (
                <React.Fragment key={p}>
                  {index > 0 && array[index - 1] !== p - 1 && (
                    <Pagination.Ellipsis disabled />
                  )}
                  <Pagination.Item
                    active={p === page}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </Pagination.Item>
                </React.Fragment>
              ))}

            <Pagination.Next 
              onClick={() => onPageChange(page + 1)} 
              disabled={page === totalPages}
            />
            <Pagination.Last 
              onClick={() => onPageChange(totalPages)} 
              disabled={page === totalPages}
            />
          </Pagination>
        </Col>

        {/* تحكم عدد النتائج */}
        <Col xs={12} md={4} className="d-flex justify-content-center justify-content-md-end">
          <div className="d-flex align-items-center gap-2">
            <Form.Label className="mb-0 text-muted small ">
              {isArabic ? "عرض" : "Show"}
            </Form.Label>
            <Form.Select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{ 
                width: "100px",
                textAlign: "center"
            }}
              size="sm"
              
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </Form.Select>
            <span className="text-muted small textAlign-end ">
              {isArabic ? "لكل صفحة" : "per page"}
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
}