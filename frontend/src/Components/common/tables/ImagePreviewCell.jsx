import { Image, Badge } from "react-bootstrap";
import { Image as ImageIcon } from "lucide-react";
import { formatImagePath } from "../../../Utils/formatImagePath";

export default function ImagePreviewCell({
  images = [],
  size = 80,
}) {
  if (!images?.length) {
    return (
      <div
        className="bg-light border d-flex align-items-center justify-content-center rounded"
        style={{ width: size, height: size }}
      >
        <ImageIcon size={size / 2} className="text-muted" />
      </div>
    );
  }

  return (
    <div className="position-relative d-inline-block">
      <Image
        src={formatImagePath(images[0])}
        rounded
        width={size}
        height={size}
        style={{ objectFit: "cover" }}
        className="shadow-sm"
      />
      {images.length > 1 && (
        <Badge
          bg="primary"
          className="position-absolute top-0 end-0"
        >
          +{images.length - 1}
        </Badge>
      )}
    </div>
  );
}
