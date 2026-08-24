import { Card, Button, Badge } from "react-bootstrap";
import { Check, Plus, Trash2 } from "lucide-react";

export default function ProductCard({
  product,
  category,
  isSelected = false,
  onAddItem,
  onRemoveItem,
  lang = "ar",
  mode = "admin",
}) {
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

  const productId =
    product.productId ||
    product._id ||
    product.id ||
    product.refId ||
    product.itemId;

  const name =
    getLocalizedText(product.name) ||
    getLocalizedText(product.nameAr) ||
    getLocalizedText(product.nameEn) ||
    getLocalizedText(product.title) ||
    getLocalizedText(product.titleAr) ||
    getLocalizedText(product.titleEn) ||
    "-";

  const description =
    getLocalizedText(product.description) ||
    getLocalizedText(product.descriptionAr) ||
    getLocalizedText(product.descriptionEn) ||
    getLocalizedText(product.shortDescriptionAr) ||
    getLocalizedText(product.shortDescriptionEn) ||
    "";

  const price =
    product.price ||
    product.basePrice ||
    product.priceAtTime ||
    product.pricing?.basePrice ||
    product.pricing?.totalPrice ||
    product.pricing?.price ||
    0;

  const currency =
    product.currency ||
    product.pricing?.currency ||
    "SAR";

  const normalizedItem = {
    ...product,

    category: category.key,
    categoryLabel: isArabic ? category.labelAr : category.labelEn,

    productId,
    refId: productId,

    name,
    nameAr: product.nameAr || product.name?.ar || name,
    nameEn: product.nameEn || product.name?.en || name,

    priceAtTime: Number(price || 0),
    currency,
    quantity: 1,

    raw: product,
  };

  const handleAdd = () => {
    onAddItem?.(normalizedItem);
  };

  const handleRemove = () => {
    onRemoveItem?.(normalizedItem);
  };

  return (
    <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Badge bg={mode === "admin" ? "primary" : "success"}>
            {isArabic ? category.labelAr : category.labelEn}
          </Badge>

          {isSelected && (
            <Badge bg="success" className="d-flex align-items-center gap-1">
              <Check size={14} />
              {isArabic ? "مختار" : "Selected"}
            </Badge>
          )}
        </div>

        <h6 className="fw-bold mb-2">{name}</h6>

        {description && (
          <p className="text-muted small mb-3">
            {description.length > 120
              ? `${description.slice(0, 120)}...`
              : description}
          </p>
        )}

        <div className="mt-auto">
          <div className="fw-bold text-success mb-3">
            {Number(price || 0).toLocaleString(
              isArabic ? "en-US" : "en-US",
            )}{" "}
            {currency}
          </div>

          {isSelected ? (
            <Button
              variant="outline-danger"
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleRemove}
            >
              <Trash2 size={16} />
              {isArabic ? "إزالة" : "Remove"}
            </Button>
          ) : (
            <Button
              variant="success"
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleAdd}
            >
              <Plus size={16} />
              {isArabic ? "إضافة" : "Add"}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

/*
شرح الملف:
هذا المكون يعرض بطاقة منتج واحدة داخل ProductTabs.
أصبح مشتركًا بين الإدارة وصفحات العملاء.
يعرض اسم المنتج، وصفه، سعره، وزر الإضافة أو الإزالة.
يرسل للـ parent عنصرًا موحدًا يحتوي category و productId و priceAtTime و currency.
*/
