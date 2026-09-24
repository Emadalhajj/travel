// src/components/common/EntityFilter.jsx

import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import CustomSelect from "../ui/CustomSelecte";
import CalendarField from "./CalendarField";
import ActionButton from "./buttons/ActionButton";

const FILTER_NAMES = {
  ar: {
    bedType: "نوع السرير",
    configurationType: "نوع الإعداد",
    country: "الدولة",
    city: "المدينة",
    currency: "العملة",
    environment: "البيئة",
    hotelType: "نوع الفندق",
    inventoryType: "نوع المخزون",
    isActive: "الحالة",
    isPublic: "الظهور",
    paymentMethodCode: "طريقة الدفع",
    provider: "المزود",
    scope: "النطاق",
    sectionCode: "القسم",
    sort: "الترتيب",
    source: "المصدر",
    status: "الحالة",
    subtype: "النوع الفرعي",
    type: "النوع",
  },

  en: {
    bedType: "Bed Type",
    configurationType: "Configuration Type",
    country: "Country",
    city: "City",
    currency: "Currency",
    environment: "Environment",
    hotelType: "Hotel Type",
    inventoryType: "Inventory Type",
    isActive: "Status",
    isPublic: "Visibility",
    paymentMethodCode: "Payment Method",
    provider: "Provider",
    scope: "Scope",
    sectionCode: "Section",
    sort: "Sort",
    source: "Source",
    status: "Status",
    subtype: "Subtype",
    type: "Type",
  },
};

export const resolveFilterPlaceholder = ({ key, field, lang }) =>
  field.placeholder ||
  FILTER_NAMES[lang === "ar" ? "ar" : "en"]?.[key] ||
  (lang === "ar" ? "اختر..." : "Select...");

export default function EntityFilter({
  filters = {},
  setFilters,
  config = {},

  // الحالة الأصلية للفلاتر عند Reset
  initialFilters,

  // اختياري: عند وجود زر Apply
  onSearch,

  // اختياري: تنفيذ إضافي بعد Reset
  onReset,

  // إظهار زر "تطبيق الفلاتر"
  showSearchButton = false,

  className = "",
}) {
  const { i18n } = useTranslation();

  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  /* =========================
   * UPDATE FILTER
   * ========================= */

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /* =========================
   * RESET FILTERS
   * ========================= */

  const handleReset = () => {
    if (initialFilters) {
      setFilters(initialFilters);
    } else {
      /*
       * Fallback للصفحات القديمة التي لا ترسل initialFilters.
       *
       * نحافظ على أي state غير موجود في config
       * بدل حذفه بالكامل.
       */
      setFilters((current) => {
        const resetState = {
          ...current,
        };

        Object.keys(config).forEach((key) => {
          resetState[key] = "";
        });

        return resetState;
      });
    }

    onReset?.();
  };

  /* =========================
   * APPLY FILTERS
   * ========================= */

  const handleSearch = () => {
    onSearch?.(filters);
  };

  /* =========================
   * RENDER
   * ========================= */

  return (
    <div
      className={["mb-4 p-3 bg-light rounded shadow-sm", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Row className="g-3 align-items-end">
        {/* =========================
            GENERAL SEARCH
           ========================= */}

        {config.search?.type !== "label" && (
          <Col xs={12} md={config.search?.col || 2}>
            <Form.Control
              type="search"
              className="entity-filter-control"
              placeholder={
                config.search?.placeholder ||
                (isArabic ? "ابحث..." : "Search...")
              }
              value={filters.search ?? ""}
              onChange={(event) => updateFilter("search", event.target.value)}
              aria-label={
                config.search?.placeholder || (isArabic ? "بحث" : "Search")
              }
            />
          </Col>
        )}

        {/* =========================
            SEARCH LABEL
           ========================= */}

        {config.search?.type === "label" && (
          <Col xs={12} md={config.search?.col || 3}>
            <Form.Label className="mb-0">
              <strong>{config.search.label}</strong>
            </Form.Label>
          </Col>
        )}

        {/* =========================
            DYNAMIC FILTERS
           ========================= */}

        {Object.entries(config).map(([key, field]) => {
          // Search تم عرضه بالأعلى
          if (key === "search") {
            return null;
          }

          const fieldPlaceholder = resolveFilterPlaceholder({
            key,
            field,
            lang,
          });

          return (
            <Col xs={12} md={field.col || 2} key={key}>
              {/* DATE */}
              {field.type === "date" ? (
                <CalendarField
                  id={key}
                  value={filters[key] ?? ""}
                  onChange={(value) => updateFilter(key, value)}
                  min={field.min}
                  max={field.max}
                  isArabic={isArabic}
                  showMessage={false}
                  className="entity-filter-control"
                />
              ) : field.type === "select" ? (
                /* SELECT */
                <CustomSelect
                  id={`filter-${key}`}
                  ariaLabel={fieldPlaceholder}
                  value={filters[key] ?? ""}
                  onChange={(newValue) => {
                    if (field.customOnChange) {
                      field.customOnChange(newValue, setFilters, filters);

                      return;
                    }

                    updateFilter(key, newValue);
                  }}
                  options={field.options || []}
                  placeholder={fieldPlaceholder}
                  showAllOption={field.showAllOption !== false}
                  className="entity-filter-control"
                />
              ) : (
                /* TEXT / NUMBER / OTHER */
                <Form.Control
                  type={field.type || "text"}
                  className="entity-filter-control"
                  placeholder={field.placeholder || ""}
                  value={filters[key] ?? ""}
                  onChange={(event) => updateFilter(key, event.target.value)}
                  aria-label={fieldPlaceholder}
                />
              )}
            </Col>
          );
        })}

        {/* =========================
            ACTIONS
           ========================= */}

        <Col
          xs={12}
          md="auto"
          className="d-flex flex-wrap align-items-end gap-2"
        >
          {showSearchButton && (
            <ActionButton action="apply" onClick={handleSearch} showLabel />
          )}

          <ActionButton action="reset" onClick={handleReset} showLabel />
        </Col>
      </Row>
    </div>
  );
}
