import ProductTabs from "../../products/ProductTabs";
import PackageSummaryPanel from "../../products/PackageSummaryPanel";

export default function ServicesStep({
  products = {},
  selectedProducts = [],
  onAddProduct,
  onRemoveProduct,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ProductTabs
          products={products}
          onAdd={onAddProduct}
        />
      </div>

      <div>
        <PackageSummaryPanel
          title="الخدمات المختارة"
          selectedProducts={selectedProducts}
          onRemove={onRemoveProduct}
        />
      </div>
    </div>
  );
}
