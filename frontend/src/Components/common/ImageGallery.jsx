// src/components/common/ImageGallery.jsx
import React from "react";
import { Image } from "react-bootstrap";
import { Image as ImageIcon } from "lucide-react";

const ImageGallery = ({ 
  images = [], 
  size = "md", // sm, md, lg
  showCount = true, // للقوائم
  onClickImage = null // اختياري لفتح lightbox
}) => {
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-4 bg-light rounded-3">
        <ImageIcon size={40} className="text-muted mb-2" />
        <p className="text-muted mb-0">لا توجد صور</p>
      </div>
    );
  }

  const height = size === "sm" ? 80 : size === "lg" ? 120 : 200;

  return (
    <div className="image-gallery">
      {showCount && images.length > 1 && (
        <div className="position-relative d-inline-block">
          <Image
            src={`http://localhost:5000${images[0]}`}
            rounded
            style={{ width: height, height: height, objectFit: "cover" }}
          />
          <div className="position-absolute bottom-0 end-0 bg-primary text-white px-2 py-1 rounded-start fw-bold">
            +{images.length - 1}
          </div>
        </div>
      )}

      {!showCount && (
        <div className="row g-3">
          {images.map((img, i) => (
            <div key={i} className={`col-6 col-md-4 col-lg-${size === "lg" ? 3 : 4}`}>
              <div 
                className="rounded-3 overflow-hidden shadow-sm cursor-pointer"
                style={{ height }}
                onClick={() => onClickImage && onClickImage(i)}
              >
                <Image
                  src={`http://localhost:5000${img}`}
                  fluid
                  style={{ height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;