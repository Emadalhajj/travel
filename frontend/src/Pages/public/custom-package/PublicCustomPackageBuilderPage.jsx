import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  createPublicDraftBooking,
  updatePublicDraftBooking,
  resetPublicBooking,
  selectPublicBookingSubmitError,
  selectPublicBookingSubmitLoading,
} from "../../../redux/public/bookingSlice";
import useAvailableProducts from "../../../hooks/products/useAvailableProducts";
import useCustomPackageBuilder from "../../../hooks/public-booking/useCustomPackageBuilder";
import { customPackageFormConfig } from "../../../config/public-booking/customPackageFormConfig";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PageHeader from "../../../Components/layout/PageHeader";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PublicButton from "../../../Components/shared/buttons/PublicButton";
import ConfigFieldsRenderer from "../../../Components/shared/forms/ConfigFieldsRenderer";
import ProductTabs from "../../../Components/shared/products/ProductTabs";
import PackageSummaryPanel from "../../../Components/shared/products/PackageSummaryPanel";
import BookingProgressTimeline, {
  customPackageSteps,
} from "../../../Components/shared/booking/BookingProgressTimeline";
import { getProductSelectionId } from "../../../Utils/products/productSelection";

export default function PublicCustomPackageBuilderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const submitLoading = useSelector(selectPublicBookingSubmitLoading);
  const error = useSelector(selectPublicBookingSubmitError);
  const [validationError, setValidationError] = useState("");

  const {
    formData,
    selectedProductsList,
    pricing,
    handleFormChange,
    addProduct,
    removeProduct,
    buildDraftCreatePayload,
    buildDraftUpdatePayload,
    hasValidTravelSelection,
    resetBuilder,
  } = useCustomPackageBuilder();

  const {
    availableProducts,
    loadingProducts: productsLoading,
    productsError,
    fetchProductsByDate,
  } = useAvailableProducts();

  const config = useMemo(() => customPackageFormConfig(), []);

  useEffect(() => {
    dispatch(resetPublicBooking());
    return () => resetBuilder();
  }, [dispatch, resetBuilder]);

  useEffect(() => {
    if (!formData.startDate || !formData.endDate) return;

    fetchProductsByDate({
      startDate: formData.startDate,
      endDate: formData.endDate,
      pilgrimsCount: Number(formData.travelersCount || 1),
    });
  }, [
    formData.startDate,
    formData.endDate,
    formData.travelersCount,
    fetchProductsByDate,
  ]);

  const handleFieldChange = (name, value) => {
    setValidationError("");
    handleFormChange(name, value);
  };

  const handleAddItem = (item) => {
    setValidationError("");
    addProduct(item.category || item.type || "extraServices", item);
  };

  const handleRemoveItem = (item) => {
    const category = item.category || item.type || "extraServices";
    const itemId = getProductSelectionId(item);
    if (itemId) removeProduct(category, itemId);
  };

  const summaryTotals = {
    totalBeforeDiscount: Number(pricing?.subtotal || 0),
    discountValue: Number(pricing?.discount || 0),
    finalPrice: Number(pricing?.total || 0),
    currency: pricing?.currency || "SAR",
  };

  const hasValidDates = Boolean(
    formData.startDate &&
    formData.endDate &&
    new Date(formData.endDate) > new Date(formData.startDate),
  );
  const travelersCount = Number(formData.travelersCount || 0);
  const hasValidTravelersCount = travelersCount > 0;
  const hasSelectedProducts = selectedProductsList.length > 0;
  const canShowProducts = hasValidDates;
  const currentTimelineStep = canShowProducts ? "services" : "dates";

  const validateBuilder = () => {
    if (!formData.startDate) {
      setValidationError(
        t("startDateRequired", "يجب اختيار تاريخ بداية البرنامج."),
      );
      return false;
    }
    if (!formData.endDate) {
      setValidationError(
        t("endDateRequired", "يجب اختيار تاريخ نهاية البرنامج."),
      );
      return false;
    }
    if (!hasValidDates) {
      setValidationError(
        t(
          "invalidProgramDates",
          "يجب أن يكون تاريخ نهاية البرنامج بعد تاريخ البداية.",
        ),
      );
      return false;
    }
    if (!hasValidTravelersCount) {
      setValidationError(
        t("travelersCountRequired", "يجب أن يكون عدد المعتمرين أكبر من صفر."),
      );
      return false;
    }
    if (!hasSelectedProducts) {
      setValidationError(
        t(
          "selectAtLeastOneService",
          "يجب اختيار خدمة واحدة على الأقل قبل المتابعة.",
        ),
      );
      return false;
    }
    if (!hasValidTravelSelection()) {
      setValidationError(
        t("invalidTravelSelection", "بيانات موعد الرحلة المختارة غير مكتملة، يرجى إعادة اختيارها."),
      );
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBuilder()) return;

    try {
      const createResult = await dispatch(
        createPublicDraftBooking(buildDraftCreatePayload()),
      ).unwrap();
      const draftId = createResult?.data?._id || createResult?._id;

      if (!draftId) {
        throw new Error(
          t("draftIdNotReturned", "لم يتم استلام رقم مسودة الحجز."),
        );
      }

      const updateResult = await dispatch(
        updatePublicDraftBooking({ draftId, data: buildDraftUpdatePayload() }),
      ).unwrap();
      const updatedDraftId =
        updateResult?.data?._id || updateResult?._id || draftId;
      navigate(`/booking/draft/${updatedDraftId}/details`);
    } catch (submitError) {
      setValidationError(
        submitError?.message ||
          submitError ||
          t("customPackageCreateFailed", "تعذر إنشاء مسودة البرنامج المخصص."),
      );
    }
  };

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="برنامج مخصص"
        eyebrowEn="Custom Package"
        titleAr="بناء برنامج عمرة مخصص"
        titleEn="Build Custom Umrah Package"
        subtitleAr="حدد التواريخ وعدد المعتمرين ثم اختر الخدمات المناسبة."
        subtitleEn="Select dates, travelers count, and build your custom package."
        actions={
          <PublicButton
            variant="secondary"
            onClick={() => navigate("/programs")}
          >
            {t("backToPrograms", "العودة للبرامج")}
          </PublicButton>
        }
      />

      <BookingProgressTimeline
        currentStep={currentTimelineStep}
        isArabic={isArabic}
        steps={customPackageSteps}
      />

      <ErrorOverlay show={Boolean(error)} message={error} />
      <ErrorOverlay show={Boolean(productsError)} message={productsError} />
      <ErrorOverlay show={Boolean(validationError)} message={validationError} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <PublicSectionCard title={t("packageBasicInfo", "بيانات البرنامج")}>
            <ConfigFieldsRenderer
              fields={config.commonFields}
              values={formData}
              errors={{}}
              isArabic={isArabic}
              onChange={handleFieldChange}
            />
          </PublicSectionCard>

          {!canShowProducts && (
            <Alert variant="warning" className="rounded-4 mb-0">
              {t(
                "selectDatesToShowProducts",
                "اختر تاريخ البداية والنهاية لعرض المنتجات والخدمات المتاحة.",
              )}
            </Alert>
          )}

          {canShowProducts && productsLoading && <Loader />}
          {canShowProducts && !productsLoading && !productsError && (
            <ProductTabs
              startDate={formData.startDate}
              endDate={formData.endDate}
              travelersCount={travelersCount}
              availableProducts={availableProducts}
              selectedItems={selectedProductsList}
              loading={productsLoading}
              error={productsError}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              mode="custom"
            />
          )}
        </main>

        <aside className="space-y-6">
          <PackageSummaryPanel
            selectedItems={selectedProductsList}
            maxCapacity={travelersCount}
            totals={summaryTotals}
            loading={submitLoading}
            onRemoveItem={handleRemoveItem}
            onAction={handleSubmit}
            actionDisabled={
              submitLoading ||
              !hasValidDates ||
              !hasValidTravelersCount ||
              !hasSelectedProducts
            }
            mode="custom"
          />
        </aside>
      </div>
    </PublicPageLayout>
  );
}
