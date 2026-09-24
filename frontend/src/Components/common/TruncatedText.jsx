// src/components/common/TruncatedText.jsx
// src/components/common/TruncatedText.jsx
// src/components/common/TruncatedText.jsx
// src/components/common/TruncatedText.jsx
// src/components/common/TruncatedText.jsx
import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function TruncatedText({
  text,
  maxLines = 2,        // عدد الأسطر قبل "عرض المزيد"
  maxWidth = "100%",   // عرض العنصر
}) {
  const { i18n } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const isArabic = i18n.language === "ar";

  if (!text) return <span className="text-muted">—</span>;

  return (
    <div style={{ maxWidth, width: "100%" }}>
      <div
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: showAll ? "unset" : maxLines,
          overflow: "hidden",
          wordBreak: "break-word",
          lineHeight: "1.5",
        }}
      >
        {text}
      </div>

      {/* زر "عرض المزيد" يظهر فقط إذا النص طويل */}
      <Button
        variant="link"
        size="sm"
        className="p-0 mt-1"
        onClick={() => setShowAll(!showAll)}
        style={{ fontSize: "0.75rem" }}
      >
        {showAll
          ? (isArabic ? "إخفاء" : "Hide")
          : (isArabic ? "عرض المزيد" : "Show More")
        }
      </Button>
    </div>
  );
}
