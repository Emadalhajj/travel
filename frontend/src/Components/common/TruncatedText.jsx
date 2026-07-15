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
  const { t, i18n } = useTranslation();
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
// export default function TruncatedText({
//   text,
//   limit = 30  ,
//      maxWidth = "200px", // ✅ عرض أقصى
//   maxLines = 2,      // ✅ عدد أسطر أقصى
//   showToggle = true,   // إظهار "عرض المزيد"
//   }) {
//   const {t , lang } = useTranslation();
//   const { shortText, hasMore, fullText } = useTruncatedText(text, limit);
//   const [showFull, setShowFull] = useState(false);

// const isArabic = i18n.language === "ar";        // ← تصحيح مهم

//   if (!text) return null;

//   return (
//     <div className="truncated-text">
//       <p className="mb-2">
//         {showFull ? fullText : shortText}
//         {hasMore && !showFull && "..."}
//       </p>

//       {hasMore && (
//         <Button
//           variant="link"
//           size="sm"
//           className="p-0 text-primary fw-medium"
//           onClick={() => setShowFull(!showFull)}
//           style={{ textDecoration: "none" }}
//         >
//           {showFull

// ? (isArabic ? "إخفاء" : t("common.showLess", "Show Less"))
//             : (isArabic ? "عرض المزيد" : t("common.showMore", "Show More"))
//             }
//         </Button>
//       )}
//     </div>
//   );
// }
