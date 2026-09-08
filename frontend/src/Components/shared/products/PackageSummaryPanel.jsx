/*
شرح الملف

هذا الملف مسؤول عن عرض ملخص البرنامج في نهاية أو جانب الصفحة.

يقوم بعرض:
الخدمات المختارة
كمية كل خدمة
سعر كل خدمة
الإجمالي قبل الخصم
قيمة الخصم
السعر النهائي
زر حفظ البرنامج

ويعتمد على البيانات القادمة من usePackageForm.
*/
import React from "react";
import { Card, Badge } from "react-bootstrap";
import { Save, ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import ActionButton from "../../common/buttons/ActionButton";
import PublicButton from "../buttons/PublicButton";
import { formatPrice } from "../../../Utils/roundPrice";
import {
  formatTravelRoute,
  getProductSelectionId,
  isTravelCategory,
} from "../../../Utils/products/productSelection";

export default function SelectedProductsSummary({
  selectedItems = [],
  maxCapacity = 1,
  totals = {},
  loading = false,
  actionDisabled = false,
  onRemoveItem,
  onAction,
  mode = "admin", // admin | booking | custom
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  const getLocalizedText = (value) => {
    if (!value) return "";

    if (typeof value === "string" || typeof value === "number") {
      return value;
    }

    if (typeof value === "object") {
      return (
        (isArabic ? value.ar : value.en) ||
        value.ar ||
        value.en ||
        value.nameAr ||
        value.nameEn ||
        value.titleAr ||
        value.titleEn ||
        ""
      );
    }

    return "";
  };

  const getItemName = (item) =>
    getLocalizedText(item.name) ||
    getLocalizedText(item.nameAr) ||
    getLocalizedText(item.nameEn) ||
    getLocalizedText(item.title) ||
    getLocalizedText(item.titleAr) ||
    getLocalizedText(item.titleEn) ||
    "-";

  const getItemQuantity = (item) =>
    isTravelCategory(item.category) ? maxCapacity : item.quantity || maxCapacity;

  const actionLabel = () => {
    if (mode === "admin") {
      return loading
        ? isArabic ? "جارٍ الحفظ..." : "Saving..."
        : isArabic ? "حفظ البرنامج" : "Save Package";
    }

    if (mode === "custom") {
      return loading
        ? isArabic ? "جارٍ المتابعة..." : "Continuing..."
        : isArabic ? "متابعة إلى المراجعة" : "Continue to Review";
    }

    return loading
      ? isArabic ? "جارٍ المتابعة..." : "Continuing..."
      : isArabic ? "تأكيد الاختيارات" : "Confirm Selection";
  };

  const ActionIcon = mode === "admin" ? Save : mode === "custom" ? ArrowLeft : CheckCircle;

  return (
    <Card className="shadow-sm border-0 rounded-4 sticky-top">
      <Card.Header className="bg-white border-bottom py-3">
        <h5 className="fw-bold mb-0">
          {mode === "admin"
            ? isArabic ? "ملخص البرنامج" : "Package Summary"
            : isArabic ? "ملخص اختياراتك" : "Your Selection Summary"}
        </h5>
      </Card.Header>

      <Card.Body>
        {selectedItems.length === 0 ? (
          <div className="text-center text-muted py-4">
            {isArabic ? "لم يتم اختيار أي خدمات بعد" : "No services selected yet"}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {selectedItems.map((item) => (
              <div
                key={`${item.category}-${getProductSelectionId(item)}`}
                className="border rounded-3 p-3 bg-light"
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <Badge bg={mode === "admin" ? "primary" : "success"} className="mb-2">
                      {item.categoryLabel || item.category}
                    </Badge>

                    <h6 className="fw-bold mb-1">{getItemName(item)}</h6>

                    {isTravelCategory(item.category) && (
                      <div className="small text-muted mb-1 d-flex flex-column">
                        <span>{item.tripType || item.subtype || "-"} — {formatTravelRoute(item)}</span>
                        {item.departureAt && <span>{isArabic ? "المغادرة" : "Departure"}: {new Date(item.departureAt).toLocaleString(isArabic ? "ar-SA" : "en-GB")}</span>}
                      </div>
                    )}

                    <div className="small text-muted">
                      {isArabic ? "الكمية" : "Quantity"}:{" "}
                      <strong>{getItemQuantity(item)}</strong>
                    </div>

                    <div className="small text-muted">
                      {isArabic ? "السعر" : "Price"}:{" "}
                      <strong>
                        {formatPrice(item.priceAtTime, item.currency)}
                      </strong>
                    </div>

                    {isTravelCategory(item.category) && (
                      <div className="small text-muted">
                        {isArabic ? "الإجمالي" : "Total"}: {" "}
                        <strong>
                          {formatPrice(
                            Number(item.priceAtTime || 0) *
                              Number(getItemQuantity(item) || 1),
                            item.currency,
                          )}
                        </strong>
                      </div>
                    )}
                  </div>

                  <ActionButton
                    action="delete"
                    onClick={() => onRemoveItem?.(item)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <hr />

        <div className="d-flex justify-content-between mb-2">
          <span>{isArabic ? "الإجمالي قبل الخصم" : "Subtotal"}</span>
          <strong>{formatPrice(totals.totalBeforeDiscount, totals.currency)}</strong>
        </div>

        <div className="d-flex justify-content-between mb-2 text-danger">
          <span>{isArabic ? "قيمة الخصم" : "Discount"}</span>
          <strong>- {formatPrice(totals.discountValue, totals.currency)}</strong>
        </div>

        <div className="d-flex justify-content-between fs-5 fw-bold text-success">
          <span>{isArabic ? "السعر النهائي" : "Final Price"}</span>
          <span>{formatPrice(totals.finalPrice, totals.currency)}</span>
        </div>
      </Card.Body>

      <Card.Footer className="bg-white border-top">
        <PublicButton
          fullWidth
          loading={loading}
          icon={ActionIcon}
          disabled={actionDisabled || selectedItems.length === 0}
          onClick={onAction}
        >
          {actionLabel()}
        </PublicButton>
      </Card.Footer>
    </Card>
  );
}

/*
شرح الملف:
هذا المكون هو النسخة المشتركة من PackageSummaryPanel.
يستخدم لعرض ملخص الخدمات المختارة والسعر النهائي.
في الإدارة يستخدم لحفظ البرنامج.
في العميل يستخدم للمتابعة إلى المراجعة أو تأكيد الحجز.
*/
