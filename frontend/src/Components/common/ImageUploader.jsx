// src/components/common/ImageUploader.jsx
import React, { useState, useEffect, useRef } from "react";
import { Form, Image, Button, Row, Col } from "react-bootstrap";
import { X, Image as ImageIcon } from "lucide-react";
import { formatImagePath } from "../../Utils/imageUtils";

export default function ImageUploader({
  initialImages = [],
  onChange,
  multiple = true,
  maxImages = 10,
  label = "الصور التوضيحية",
  className = "",
}) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [oldImages, setOldImages] = useState([]); // هنا [] فقط
  const [deletedOld, setDeletedOld] = useState([]);

  const prevDataRef = useRef({ images: [], deletedOld: [] });

  useEffect(() => {
    if (!onChange) return;

    const current = { newImages: images, deletedOldImages: deletedOld };

    // مقارنة بسيطة وآمنة 100%
    const changed =
      images.length !== prevDataRef.current.newImages?.length ||
      deletedOld.length !== prevDataRef.current.deletedOldImages?.length ||
      images.some(
        (f, i) =>
          f.name !== prevDataRef.current.newImages[i]?.name ||
          f.size !== prevDataRef.current.newImages[i]?.size
      ) ||
      deletedOld.some(
        (path, i) => path !== prevDataRef.current.deletedOldImages[i]
      );

    if (changed) {
      prevDataRef.current = current;
      onChange(current);
    }
  }, [images, deletedOld, onChange]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // الحل النهائي هنا
useEffect(() => {
  // ✅ لا تعيد التهيئة في وضع الإنشاء
  if (!Array.isArray(initialImages) || initialImages.length === 0) return;

  const safeImages = initialImages
    .map((img) => {
      if (typeof img === "string") return img;
      if (img && typeof img === "object") return img.url || img.path || "";
      return "";
    })
    .filter((s) => typeof s === "string" && s.trim() !== "");

  setOldImages(safeImages);
  setDeletedOld([]);
  setImages([]);
  setPreviews([]);
  prevDataRef.current = { newImages: [], deletedOldImages: [] };
}, [initialImages]);



  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const total = images.length + oldImages.length + files.length;

    if (total > maxImages) {
      alert(`الحد الأقصى ${maxImages} صور فقط`);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeOldImage = (index) => {
    const path = oldImages[index];
    setDeletedOld((prev) => [...prev, path]);
    setOldImages((prev) => prev.filter((_, i) => i !== index));
  };

  const allImages = [
    ...oldImages.map((path, i) => ({
      src: formatImagePath(path),
      isOld: true,
      index: i,
    })),
    ...previews.map((src, i) => ({
      src,
      isOld: false,
      index: i,
    })),
  ];

  return (
    <Form.Group className="mb-4">
      <Form.Label className="fw-bold">{label}</Form.Label>

      {allImages.length > 0 ? (
        <Row className="g-3 mb-3">
          {allImages.map((item, idx) => (
            <Col xs={multiple ? 6 : 12} md={multiple ? 4 : 12} lg={multiple ? 3 : 12} key={idx}>
              <div className="position-relative">
                <Image
                  src={item.src}
                  alt="preview"
                  rounded
                  className={className || "img-thumbnail shadow-sm"}
                  style={
                    className
                      ? { objectFit: "cover" }
                      : { height: 150, width: "100%", objectFit: "cover" }
                  }
                />
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-2 rounded-circle"
                  style={{ width: 32, height: 32 }}
                  onClick={() =>
                    item.isOld
                      ? removeOldImage(item.index)
                      : removeNewImage(item.index)
                  }
                >
                  <X size={16} />
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5 border border-dashed rounded-3 bg-light mb-3">
          <ImageIcon size={48} className="text-muted mb-3" />
          <p className="text-muted mb-0">لا توجد صور بعد</p>
        </div>
      )}

      {allImages.length < maxImages && (
        <Form.Control
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="form-control"
        />
      )}
    </Form.Group>
  );
}
