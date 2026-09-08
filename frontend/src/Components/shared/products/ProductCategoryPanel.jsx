import { Row, Col, Alert, Spinner } from "react-bootstrap";
import ProductCard from "./ProductCard";
import { getProductSelectionId } from "../../../Utils/products/productSelection";

export default function ProductCategoryPanel({
  category,
  products = [],
  selectedItems = [],
  loading,
  error,
  onAddItem,
  onRemoveItem,
  lang = "ar",
  mode = "admin",
  travelersCount = 1,
}) {
  const isSelected = (productId) => {
    return selectedItems.some((item) => {
      const itemId = getProductSelectionId(item);

      return (
        String(itemId) === String(productId) &&
        item.category === category.key
      );
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <div className="mt-2">
          {lang === "ar" ? "جاري تحميل المنتجات..." : "Loading products..."}
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!products.length) {
    return (
      <Alert variant="warning">
        {lang === "ar"
          ? "لا توجد منتجات متاحة في هذه الفترة"
          : "No available products for this period"}
      </Alert>
    );
  }

  return (
    <Row className="g-4">
      {products.map((product) => {
        const productId = getProductSelectionId(product);

        const normalizedProduct = {
          ...product,
          productId,
          category: category.key,
          categoryLabel: lang === "ar" ? category.labelAr : category.labelEn,
        };

        return (
          <Col key={`${category.key}-${productId}`} xs={12} md={6} xl={4}>
            <ProductCard
              product={normalizedProduct}
              category={category}
              isSelected={isSelected(productId)}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              lang={lang}
              mode={mode}
              travelersCount={travelersCount}
            />
          </Col>
        );
      })}
    </Row>
  );
}
/*
شرح الملف:
هذا المكون يعرض منتجات قسم واحد فقط.
مثلاً: الغرف أو التأشيرات أو النقل.
تم جعله مشتركًا حتى تستخدمه صفحة الإدارة وصفحات العملاء بنفس طريقة العرض.
ملاحظة:
حاليًا يستورد ProductCard القديم من مسار الإدارة مؤقتًا.
الخطوة التالية الأفضل هي نقل ProductCard نفسه إلى shared/products.
*/
