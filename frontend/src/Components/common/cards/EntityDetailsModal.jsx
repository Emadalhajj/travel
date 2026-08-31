import { Modal, Image, Carousel } from "react-bootstrap";
import { formatImagePath } from "../../../Utils/imageUtils";

export default function EntityDetailsModal({
  show,
  onHide,
  title,
  images = [],
  fields = [],
}) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h4 fw-bold">{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-4">
        {/* معرض الصور - Carousel لتجربة عصرية */}
        <h6 className="mb-3 text-primary fw-semibold">المعرض</h6>
        {images.length > 0 ? (
          <Carousel
            indicators={images.length > 1}
            controls={images.length > 1}
            interval={null}
            className="mb-4 shadow-sm rounded overflow-hidden"
            style={{ maxHeight: "400px" }}
          >
            {images.map((img, i) => (
              <Carousel.Item key={i}>
                <Image
                  src={formatImagePath(img)}
                  alt={`${title} - صورة ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="d-block w-100"
                  style={{ height: "400px", objectFit: "cover" }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="text-center py-5 bg-light rounded">
            <p className="text-muted mb-0">لا توجد صور متاحة</p>
          </div>
        )}

        <hr className="my-5" />

        {/* البيانات - عرض بشكل بطاقات حديثة */}
        <h6 className="mb-4 text-primary fw-semibold">التفاصيل</h6>
        <div className="row g-4">
          {fields.map((field, i) => (
            <div key={i} className={field.col || "col-md-6 col-lg-4"}>
              <div className="bg-light rounded p-3 shadow-sm h-100 d-flex flex-column">
                <small className="text-muted text-uppercase fw-medium">
                  {field.label}
                </small>
                <div className="mt-2 mb-0 fw-medium text-dark">
                  {field.type === "attachments" ? (
                    Array.isArray(field.value) && field.value.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {field.value.map((file, index) => (
                          <a
                            key={index}
                            href={formatImagePath(file.url || file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={file.originalName}
                            className="btn btn-sm btn-outline-primary text-start"
                          >
                            📥📎 {file.originalName || `ملف ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">لا توجد مرفقات</span>
                    )
                  ) : (
                    (field.value ?? (
                      <span className="text-muted">غير متوفر</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">لا توجد تفاصيل إضافية</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <button className="btn btn-outline-secondary" onClick={onHide}>
          إغلاق
        </button>
      </Modal.Footer>
    </Modal>
  );
}
