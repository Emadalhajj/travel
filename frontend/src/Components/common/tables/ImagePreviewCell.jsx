import { Image as ImageIcon } from "lucide-react";

import { formatImagePath } from "../../../Utils/imageUtils";

export default function ImagePreviewCell({ images = [], size = 64, alt = "" }) {
  if (!images?.length) {
    return (
      <div
        style={{
          width: size,
          height: size,
        }}
        className="
          mx-auto

          flex shrink-0
          items-center justify-center

          rounded-lg

          border border-line

          bg-surface-muted

          text-content-muted
        "
      >
        <ImageIcon
          size={Math.max(20, Math.round(size * 0.4))}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className="relative mx-auto shrink-0"
    >
      <img
        src={formatImagePath(images[0])}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          width: size,
          height: size,
        }}
        className="
          rounded-lg

          border border-line

          object-cover

          shadow-sm
        "
      />

      {images.length > 1 && (
        <span
          className="
            absolute
            -end-1 -top-1

            inline-flex
            min-h-5 min-w-5
            items-center justify-center

            rounded-full

            bg-primary

            px-1.5

            text-[10px]
            font-bold
            text-white

            shadow-sm
          "
        >
          +{images.length - 1}
        </span>
      )}
    </div>
  );
}
