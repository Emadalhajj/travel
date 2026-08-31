// src/components/common/EntityFilter.jsx
import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import CustomSelect from "../ui/CustomSelecte";
import CalendarField from "./CalendarField";

export default function EntityFilter({
  filters = {},
  setFilters,
  config = {}, // كائن يحتوي على خيارات الفلتر الخاصة بالصفحة
  onSearch, // اختياري: دالة تُنفذ عند الضغط على زر بحث
  onReset, // اختياري: دالة إعادة تعيين مخصصة
  showSearchButton = false, // هل نريد زر بحث منفصل؟
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  // دالة إعادة تعيين افتراضية
  //   const handleReset = () => {
  //     const resetState = Object.keys(config).reduce((acc, key) => {
  //       acc[key] = "";
  //       return acc;
  //     }, {});

  //   };
  const handleReset = () => {
    const resetState = {};
    Object.keys(config).forEach((key) => {
      resetState[key] = "";
    });
    setFilters(resetState);
    if (onReset) onReset();
  };

  // دالة البحث (إذا كان showSearchButton = true)
  const handleSearch = () => {
    if (onSearch) onSearch(filters);
  };

  return (
    <div className="mb-4 p-3 bg-light rounded shadow-sm">
      <Row className="g-3 align-items-end">
        {/* حقل البحث العام - يظهر إلا إذا كان من نوع label في config */}
        {config.search?.type !== "label" && (
          <Col md={config.search?.col || 3}>
            <Form.Control
              placeholder={
                config.search?.placeholder ||
                (lang === "ar" ? "ابحث..." : "Search...")
              }
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </Col>
        )}

        {/* عنوان البحث فقط - للعرض */}
        {config.search?.type === "label" && (
          <Col md={3}>
            <Form.Label className="mb-0">
              <strong>{config.search.label}</strong>
            </Form.Label>
          </Col>
        )}

        {/* الحقول الديناميكية من config */}
        {Object.entries(config).map(([key, field]) => {
          if (key === "search") return null; // تجنب تكرار البحث

          return (
            <Col md={field.col || 2} key={key}>
              {field.type === "date" ? (
                <CalendarField
                  id={key}
                  value={filters[key] || ""}
                  onChange={(value) => setFilters({ ...filters, [key]: value })}
                  min={field.min}
                  max={field.max}
                  isArabic={lang === "ar"}
                />
              ) : field.type === "select" ? (
<CustomSelect
          value={filters[key] || ""}
          onChange={(newValue) => {
            if (field.customOnChange) {
              field.customOnChange(newValue, setFilters, filters);
            } else {
              setFilters({ ...filters, [key]: newValue });
            }
          }}
          options={field.options || []}
          placeholder={field.placeholder || (lang === "ar" ? "اختر..." : "Select...")}
          showAllOption={true}
        />
      ) : (
        <Form.Control
          type={field.type || "text"}
          placeholder={field.placeholder || ""}
          value={filters[key] || ""}
          onChange={(e) =>
            setFilters({ ...filters, [key]: e.target.value })
          }
        />              )}
            </Col>
          );
        })}

        {/* أزرار التحكم */}

        <Col md={showSearchButton ? 2 : 1} className="d-flex gap-2">
          {showSearchButton && (
            <Button
              variant="primary"
              onClick={handleSearch}
              className="flex-grow-1"
            >
              {lang === "ar" ? "بحث" : "Search"}
            </Button>
          )}
          <Button
            variant="outline-secondary"
            onClick={handleReset}
            className="flex-grow-1"
          >
            {lang === "ar" ? "مسح" : "Reset"}
          </Button>
        </Col>
      </Row>
    </div>
  );
}
