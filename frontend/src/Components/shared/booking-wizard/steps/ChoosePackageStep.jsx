/*
وظيفته اختيار برنامج العمرة فقط. لا يحفظ Draft ولا يتعامل مع العميل.
*/
import Loader from "../../../common/Loader";
import ErrorOverlay from "../../../common/feedback/ErrorOverlay";
import ProductTabs from "../../products/ProductTabs";
import PackageSummaryPanel from "../../products/PackageSummaryPanel";

export default function ChoosePackageStep({
  packages = [],
  loading = false,
  error = null,
  selectedPackage = null,
  onSelectPackage,
}) {
  if (loading) {
    return <Loader message="جاري تحميل البرامج..." />;
  }

  if (error) {
    return <ErrorOverlay message={error} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ProductTabs
          products={{
            packages,
          }}
          activeCategory="packages"
          onAdd={onSelectPackage}
        />
      </div>

      <div>
        <PackageSummaryPanel
          title="البرنامج المختار"
          selectedPackage={selectedPackage}
        />
      </div>
    </div>
  );
}
