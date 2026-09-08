/*
شرح الملف

هذا الملف مسؤول عن عرض الأقسام على شكل Tabs:
التأشيرات
الفنادق
الرحلات
النقل
الزيارات
الخدمات

ويقوم بتمرير منتجات كل قسم إلى:
ProductCategoryPanel.jsx
كما يتحقق من وجود:
startDate
endDate
لأن عرض المنتجات يعتمد على الفترة الزمنية.
*/
import React, { useState } from "react";
import { Tabs, Tab, Alert, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import ProductCategoryPanel from "./ProductCategoryPanel";

const PRODUCT_CATEGORIES = [
  { key: "visas", labelAr: "التأشيرات", labelEn: "Visas" },
  {
    key: "roomTypes",
    labelAr: "الفنادق والإقامة",
    labelEn: "Hotels & Accommodation",
  },
  { key: "flights", labelAr: "الرحلات الجوية", labelEn: "Flights" },
  {
    key: "transports",
    labelAr: "النقل الداخلي",
    labelEn: "Internal Transport",
  },
  { key: "trips", labelAr: "الرحلات", labelEn: "Trips" },
  {
    key: "ziyarats",
    labelAr: "الزيارات الدينية والمشاعر",
    labelEn: "Religious Visits",
  },
  {
    key: "extraServices",
    labelAr: "الخدمات التكميلية",
    labelEn: "Extra Services",
  },
  { key: "vehicleRentals", labelAr: "تأجير النقل", labelEn: "Vehicle Rental" },
];

export default function ProductTabs({
  startDate,
  endDate,
  availableProducts = {},
  selectedItems = [],
  loading = false,
  error = null,
  onAddItem,
  onRemoveItem,
  mode = "admin", // admin | public | booking
  travelersCount = 1,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  const [activeTab, setActiveTab] = useState("visas");

  if (!startDate || !endDate) {
    return (
      <Alert variant="warning" className="rounded-4">
        {isArabic
          ? "يرجى تحديد تاريخ البداية والنهاية أولاً لعرض الخدمات المتاحة."
          : "Please select start and end dates first."}
      </Alert>
    );
  }

  return (
    <div
      className={
        mode === "public" || mode === "booking" || mode === "custom"
          ? "bg-white rounded-4 shadow border border-emerald-100 p-3"
          : "bg-white rounded-4 shadow-sm border p-3"
      }
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">
          {mode === "admin"
            ? isArabic
              ? "اختيار الخدمات المتاحة"
              : "Select Available Services"
            : isArabic
              ? "اختر الخدمات المناسبة لك"
              : "Choose Your Services"}
        </h5>

        {loading && (
          <div className="d-flex align-items-center gap-2 text-muted small">
            <Spinner size="sm" />
            {isArabic ? "جاري تحميل الخدمات..." : "Loading services..."}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="danger">
          {typeof error === "object" ? error.message || "حدث خطأ" : error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-4"
      >
        {PRODUCT_CATEGORIES.map((category) => (
          <Tab
            key={category.key}
            eventKey={category.key}
            title={isArabic ? category.labelAr : category.labelEn}
          >
            <ProductCategoryPanel
              category={category}
              products={availableProducts?.[category.key] || []}
              selectedItems={selectedItems}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              lang={lang}
              mode={mode}
              travelersCount={travelersCount}
            />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

/*
شرح الملف:
هذا المكون يعرض المنتجات المتاحة داخل Tabs.
أصبح مشتركًا بدل أن يكون خاصًا بإنشاء برنامج من الإدارة.
الفرق بين الإدارة والعميل يتم التحكم به عبر mode:
admin للحفظ داخل البرنامج.
public أو booking لاستخدامه في صفحات العميل.
*/
