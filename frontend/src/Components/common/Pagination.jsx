import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const DEFAULT_LIMIT_OPTIONS = [10, 20, 30, 50];

function getPageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  const validPages = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items = [];

  validPages.forEach((value, index) => {
    const previous = validPages[index - 1];

    if (previous && value - previous > 1) {
      items.push(`ellipsis-${previous}-${value}`);
    }

    items.push(value);
  });

  return items;
}

export default function PaginationComponent({
  total = 0,
  page = 1,
  limit = 10,
  totalPages = 0,

  onPageChange,
  onLimitChange,

  limitOptions = DEFAULT_LIMIT_OPTIONS,

  showLimit = true,
  showInfo = true,

  className = "",
}) {
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const safeTotalPages = Math.max(Number(totalPages) || 0, 0);

  const safePage =
    safeTotalPages > 0
      ? Math.min(Math.max(Number(page) || 1, 1), safeTotalPages)
      : 1;

  const safeLimit = Math.max(Number(limit) || 10, 1);

  const hasPrevious = safePage > 1;
  const hasNext = safePage < safeTotalPages;

  const startItem = total > 0 ? (safePage - 1) * safeLimit + 1 : 0;

  const endItem = Math.min(safePage * safeLimit, total);

  const pageItems = getPageItems(safePage, safeTotalPages);

  const goToPage = (nextPage) => {
    if (!onPageChange) return;

    const normalizedPage = Math.min(
      Math.max(nextPage, 1),
      Math.max(safeTotalPages, 1),
    );

    if (normalizedPage === safePage) {
      return;
    }

    onPageChange(normalizedPage);
  };

  const handleLimitChange = (event) => {
    onLimitChange?.(Number(event.target.value));
  };

  /*
   * لا يوجد شيء مفيد لعرضه:
   * لا نتائج، ولا تغيير limit.
   */
  if (total === 0 && safeTotalPages === 0 && !onLimitChange) {
    return null;
  }

  const FirstIcon = isArabic ? ChevronsRight : ChevronsLeft;

  const PreviousIcon = isArabic ? ChevronRight : ChevronLeft;

  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  const LastIcon = isArabic ? ChevronsLeft : ChevronsRight;

  const navigationButtonClass = `
    inline-flex h-9 w-9
    shrink-0
    items-center justify-center
    rounded-full
    border border-slate-200
    bg-white
    text-slate-600
    transition
    hover:border-primary
    hover:bg-primary-soft
    hover:text-primary
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-primary
    focus-visible:ring-offset-2
    disabled:cursor-not-allowed
    disabled:opacity-40
    disabled:hover:border-slate-200
    disabled:hover:bg-white
    disabled:hover:text-slate-600
  `;

  return (
    <div className={["mt-4 mb-3", className].filter(Boolean).join(" ")}>
      <div
        className="
          flex flex-col
          items-center
          justify-between
          gap-3
          lg:flex-row
        "
      >
        {/* معلومات النتائج */}
        {showInfo && (
          <div
            className="
              w-full
              text-center
              text-sm
              text-slate-500
              lg:w-auto
              lg:text-start
            "
          >
            {isArabic
              ? `${startItem} - ${endItem} من ${total} نتيجة`
              : `${startItem} - ${endItem} of ${total} results`}
          </div>
        )}

        {/* التنقل بين الصفحات */}
        {safeTotalPages > 1 && (
          <nav
            aria-label={isArabic ? "التنقل بين الصفحات" : "Pagination"}
            className="
              flex max-w-full
              items-center
              justify-center
              gap-1
              overflow-x-auto
              py-1
            "
          >
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={!hasPrevious}
              aria-label={isArabic ? "الصفحة الأولى" : "First page"}
              title={isArabic ? "الصفحة الأولى" : "First page"}
              className={navigationButtonClass}
            >
              <FirstIcon size={17} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={!hasPrevious}
              aria-label={isArabic ? "الصفحة السابقة" : "Previous page"}
              title={isArabic ? "الصفحة السابقة" : "Previous page"}
              className={navigationButtonClass}
            >
              <PreviousIcon size={17} aria-hidden="true" />
            </button>

            {pageItems.map((item) => {
              if (typeof item === "string") {
                return (
                  <span
                    key={item}
                    aria-hidden="true"
                    className="
                      inline-flex h-9 min-w-7
                      items-center justify-center
                      text-sm
                      text-slate-400
                    "
                  >
                    …
                  </span>
                );
              }

              const isActive = item === safePage;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  aria-label={isArabic ? `الصفحة ${item}` : `Page ${item}`}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex h-9 min-w-9",
                    "shrink-0",
                    "items-center justify-center",
                    "rounded-full",
                    "border",
                    "px-2",
                    "text-sm font-medium",
                    "transition",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-primary",
                    "focus-visible:ring-offset-2",

                    isActive
                      ? ["border-primary", "bg-primary", "text-white"].join(" ")
                      : [
                          "border-slate-200",
                          "bg-white",
                          "text-slate-700",
                          "hover:border-primary",
                          "hover:bg-primary-soft",
                          "hover:text-primary",
                        ].join(" "),
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={!hasNext}
              aria-label={isArabic ? "الصفحة التالية" : "Next page"}
              title={isArabic ? "الصفحة التالية" : "Next page"}
              className={navigationButtonClass}
            >
              <NextIcon size={17} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goToPage(safeTotalPages)}
              disabled={!hasNext}
              aria-label={isArabic ? "الصفحة الأخيرة" : "Last page"}
              title={isArabic ? "الصفحة الأخيرة" : "Last page"}
              className={navigationButtonClass}
            >
              <LastIcon size={17} aria-hidden="true" />
            </button>
          </nav>
        )}

        {/* عدد النتائج لكل صفحة */}
        {showLimit && onLimitChange && (
          <div
            className="
                flex w-full
                items-center
                justify-center
                gap-2
                text-sm
                text-slate-500
                lg:w-auto
                lg:justify-end
              "
          >
            <label htmlFor="pagination-limit" className="whitespace-nowrap">
              {isArabic ? "عرض" : "Show"}
            </label>

            <select
              id="pagination-limit"
              value={safeLimit}
              onChange={handleLimitChange}
              aria-label={
                isArabic ? "عدد النتائج لكل صفحة" : "Results per page"
              }
              className="
                  h-9
                  min-w-[72px]
                  rounded-lg
                  border border-slate-200
                  bg-white
                  px-2
                  text-center
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/15
                "
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <span className="whitespace-nowrap">
              {isArabic ? "لكل صفحة" : "per page"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
