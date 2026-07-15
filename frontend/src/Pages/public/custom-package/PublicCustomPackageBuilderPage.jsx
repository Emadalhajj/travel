import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  createPublicDraftBooking,
  updatePublicDraftBooking,
  resetPublicBooking,
} from "../../../redux/public/bookingSlice";

import useAvailableProducts from "../../../hooks/products/useAvailableProducts";
import useCustomPackageBuilder from "../../../hooks/public-booking/useCustomPackageBuilder";

import { customPackageFormConfig } from "../../../config/public-booking/customPackageFormConfig";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

import ConfigFieldsRenderer from "../../../Components/shared/forms/ConfigFieldsRenderer";

import ProductTabs from "../../../Components/shared/products/ProductTabs";
import SelectedProductsSummary from "../../../Components/shared/products/PackageSummaryPanel";

import BookingProgressTimeline, {
  customPackageSteps,
} from "../../../Components/shared/booking/BookingProgressTimeline";

export default function PublicCustomPackageBuilderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { submitLoading, error } = useSelector(
    (state) => state.publicBooking,
  );

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
    resetBuilder,
  } = useCustomPackageBuilder();

  const {
    availableProducts,
    loadingProducts: productsLoading,
    productsError,
    fetchProductsByDate,
  } = useAvailableProducts();

  const config = useMemo(() => customPackageFormConfig(), []);

  /*
  =====================================================
  تنظيف بيانات الحجز السابقة عند فتح الصفحة
  =====================================================
  */

  useEffect(() => {
    dispatch(resetPublicBooking());

    return () => {
      resetBuilder();
    };
  }, [dispatch, resetBuilder]);

  /*
  =====================================================
  جلب المنتجات المتاحة حسب التواريخ وعدد المعتمرين
  =====================================================
  */

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

  /*
  =====================================================
  تغيير قيم النموذج
  =====================================================
  */

  const handleFieldChange = (name, value) => {
    setValidationError("");

    handleFormChange(name, value);
  };

  /*
  =====================================================
  إضافة منتج
  =====================================================
  */

  const handleAddItem = (item) => {
    setValidationError("");

    const category =
      item.category ||
      item.type ||
      "extraServices";

    addProduct(category, item);
  };

  /*
  =====================================================
  حذف منتج
  =====================================================
  */

  const handleRemoveItem = (item) => {
    const category =
      item.category ||
      item.type ||
      "extraServices";

    const itemId =
      item._id ||
      item.id ||
      item.refId ||
      item.itemId ||
      item.productId;

    if (!itemId) return;

    removeProduct(category, itemId);
  };

  /*
  =====================================================
  المجموع الظاهر في الملخص
  =====================================================
  */

  const summaryTotals = {
    totalBeforeDiscount: Number(pricing?.subtotal || 0),
    discountValue: Number(pricing?.discount || 0),
    finalPrice: Number(pricing?.total || 0),
    currency: pricing?.currency || "SAR",
  };

  /*
  =====================================================
  حالة خطوات بناء البرنامج
  =====================================================
  */

  const hasValidDates = Boolean(
    formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) > new Date(formData.startDate),
  );

  const travelersCount = Number(formData.travelersCount || 0);

  const hasValidTravelersCount = travelersCount > 0;

  const hasSelectedProducts = selectedProductsList.length > 0;

  const canShowProducts = hasValidDates;

  const currentTimelineStep = canShowProducts
    ? "services"
    : "dates";

  /*
  =====================================================
  التحقق من البيانات قبل إنشاء المسودة
  =====================================================
  */

  const validateBuilder = () => {
    if (!formData.startDate) {
      setValidationError(
        t(
          "startDateRequired",
          "يجب اختيار تاريخ بداية البرنامج.",
        ),
      );

      return false;
    }

    if (!formData.endDate) {
      setValidationError(
        t(
          "endDateRequired",
          "يجب اختيار تاريخ نهاية البرنامج.",
        ),
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
        t(
          "travelersCountRequired",
          "يجب أن يكون عدد المعتمرين أكبر من صفر.",
        ),
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

    setValidationError("");

    return true;
  };

  /*
  =====================================================
  إنشاء المسودة ثم الانتقال لبيانات العميل
  =====================================================
  */

  const handleSubmit = async () => {
    if (!validateBuilder()) return;

    try {
      const createResult = await dispatch(
        createPublicDraftBooking(
          buildDraftCreatePayload(),
        ),
      ).unwrap();

      const draftId =
        createResult?.data?._id ||
        createResult?._id;

      if (!draftId) {
        throw new Error(
          t(
            "draftIdNotReturned",
            "لم يتم استلام رقم مسودة الحجز.",
          ),
        );
      }

      const updateResult = await dispatch(
        updatePublicDraftBooking({
          draftId,
          data: buildDraftUpdatePayload(),
        }),
      ).unwrap();

      const updatedDraftId =
        updateResult?.data?._id ||
        updateResult?._id ||
        draftId;

      /*
      لا ننتقل مباشرة إلى صفحة مراجعة المسودة.

      الخطوة التالية يجب أن تكون صفحة إدخال:
      1- بيانات العميل
      2- بيانات المعتمرين

      تأكد من إضافة هذا المسار داخل React Router.
      */

      navigate(
        `/booking/custom/${updatedDraftId}/customer`,
      );
    } catch (submitError) {
      setValidationError(
        submitError?.message ||
          submitError ||
          t(
            "customPackageCreateFailed",
            "تعذر إنشاء مسودة البرنامج المخصص.",
          ),
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
          <button
            type="button"
            onClick={() => navigate("/programs")}
            className="
              rounded-xl
              border border-slate-200
              px-5 py-3
              text-sm font-bold
              text-slate-700
              transition
              hover:bg-slate-50
            "
          >
            {t(
              "backToPrograms",
              "العودة للبرامج",
            )}
          </button>
        }
      />

      <BookingProgressTimeline
        currentStep={currentTimelineStep}
        isArabic={isArabic}
        steps={customPackageSteps}
      />

      <ErrorOverlay
        show={Boolean(error)}
        message={error}
      />

      <ErrorOverlay
        show={Boolean(productsError)}
        message={productsError}
      />

      <ErrorOverlay
        show={Boolean(validationError)}
        message={validationError}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <section
            className="
              rounded-2xl
              border border-slate-100
              bg-white
              p-6
              shadow-sm
            "
          >
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {t(
                "packageBasicInfo",
                "بيانات البرنامج",
              )}
            </h2>

            <ConfigFieldsRenderer
              fields={config.commonFields}
              values={formData}
              errors={{}}
              isArabic={isArabic}
              onChange={handleFieldChange}
            />
          </section>

          {!canShowProducts && (
            <div
              className="
                rounded-2xl
                border border-amber-100
                bg-amber-50
                p-5
                text-sm
                leading-7
                text-amber-800
              "
            >
              {t(
                "selectDatesToShowProducts",
                "اختر تاريخ البداية والنهاية لعرض المنتجات والخدمات المتاحة.",
              )}
            </div>
          )}

          {canShowProducts && productsLoading && (
            <Loader />
          )}

          {canShowProducts &&
            !productsLoading &&
            !productsError && (
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
          <SelectedProductsSummary
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


// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// import {
//   createPublicDraftBooking,
//   updatePublicDraftBooking,
//   resetPublicBooking,
// } from "../../../redux/public/bookingSlice";

// import useAvailableProducts from "../../../hooks/products/useAvailableProducts";
// import useCustomPackageBuilder from "../../../hooks/public-booking/useCustomPackageBuilder";

// import { customPackageFormConfig } from "../../../config/public-booking/customPackageFormConfig";

// import PageHeader from "../../../Components/layout/PageHeader";
// import Loader from "../../../Components/common/Loader";
// import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

// import ConfigFieldsRenderer from "../../../Components/shared/forms/ConfigFieldsRenderer";
// // import ProductTabs from "../../../Components/shared/td products/ProductTabs";
// import SelectedProductsSummary from "../../../Components/shared/products/PackageSummaryPanel";
// import BookingProgressTimeline, { customPackageSteps } from "../../../Components/shared/booking/BookingProgressTimeline";
// import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
// import ProductTabs from "../../../Components/shared/products/ProductTabs";

// export default function PublicCustomPackageBuilderPage() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { t, i18n } = useTranslation();
//   const isArabic = i18n.language === "ar";

//   const { submitLoading, error } = useSelector((state) => state.publicBooking);

//   const {
//     formData,
//     selectedProductsList,
//     pricing,

//     handleFormChange,
//     addProduct,
//     removeProduct,

//     buildDraftCreatePayload,
//     buildDraftUpdatePayload,
//     resetBuilder,
//   } = useCustomPackageBuilder();

//   const {
//     availableProducts,
//     loadingProducts: productsLoading,
//     productsError,
//     fetchProductsByDate,
//   } = useAvailableProducts();

//   const config = customPackageFormConfig();

//   useEffect(() => {
//     dispatch(resetPublicBooking());

//     return () => {
//       resetBuilder();
//     };
//   }, [dispatch, resetBuilder]);

//   useEffect(() => {
//     if (formData.startDate && formData.endDate) {
//       fetchProductsByDate({
//         startDate: formData.startDate,
//         endDate: formData.endDate,
//         pilgrimsCount: formData.travelersCount,
//       });
//     }
//   }, [
//     formData.startDate,
//     formData.endDate,
//     formData.travelersCount,
//     fetchProductsByDate,
//   ]);

//   const handleAddItem = (item) => {
//     const category = item.category || item.type || "extraServices";
//     addProduct(category, item);
//   };

//   const handleRemoveItem = (item) => {
//     const category = item.category || item.type || "extraServices";

//     const itemId =
//       item._id || item.id || item.refId || item.itemId || item.productId;

//     removeProduct(category, itemId);
//   };

//   const summaryTotals = {
//     totalBeforeDiscount: pricing.subtotal,
//     discountValue: pricing.discount,
//     finalPrice: pricing.total,
//     currency: pricing.currency,
//   };

//   const handleSubmit = async () => {
//     const createResult = await dispatch(
//       createPublicDraftBooking(buildDraftCreatePayload()),
//     );

//     const draftId =
//       createResult.payload?.data?._id || createResult.payload?._id;

//     if (!draftId) return;

//     const updateResult = await dispatch(
//       updatePublicDraftBooking({
//         draftId,
//         data: buildDraftUpdatePayload(),
//       }),
//     );

//     const updatedDraftId =
//       updateResult.payload?.data?._id || updateResult.payload?._id || draftId;

//     navigate(`/draft-booking/${updatedDraftId}`);
//   };

//   const canShowProducts = formData.startDate && formData.endDate;

//   return (
//     // <div className="min-h-screen bg-slate-50 px-4 py-8">
//     //   <div className="mx-auto max-w-7xl">
//     <PublicPageLayout>
//       <PageHeader
//         eyebrowAr="برنامج مخصص"
//         eyebrowEn="Custom Package"
//         titleAr="بناء برنامج عمرة مخصص"
//         titleEn="Build Custom Umrah Package"
//         subtitleAr="حدد التواريخ وعدد المعتمرين ثم اختر الخدمات المناسبة."
//         subtitleEn="Select dates, travelers count, and build your custom package."
//         actions={
//           <button
//             type="button"
//             onClick={() => navigate("/programs")}
//             className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
//           >
//             {t("backToPrograms", "العودة للبرامج")}
//           </button>
//         }
//       />

// <BookingProgressTimeline
//   currentStep={canShowProducts ? "services" : "dates"}
//   isArabic={isArabic}
//   steps={customPackageSteps}
// />
//       <ErrorOverlay show={Boolean(error)} message={error} />
//       <ErrorOverlay show={Boolean(productsError)} message={productsError} />

//       <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//         <main className="space-y-6 lg:col-span-2">
//           <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
//             <h2 className="mb-5 text-xl font-bold text-slate-900">
//               {t("packageBasicInfo", "بيانات البرنامج")}
//             </h2>

//            <ConfigFieldsRenderer
//   fields={config.commonFields}
//   isArabic={isArabic}
//   getValue={(name) => formData[name]}
//   onChange={handleFormChange}
// />
//           </section>

//           {!canShowProducts && (
//             <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm leading-7 text-amber-800">
//               {t(
//                 "selectDatesToShowProducts",
//                 "اختر تاريخ البداية والنهاية لعرض المنتجات المتاحة.",
//               )}
//             </div>
//           )}

//           {canShowProducts && productsLoading && <Loader />}

//           {canShowProducts && !productsLoading && (
//             <ProductTabs
//               startDate={formData.startDate}
//               endDate={formData.endDate}
//               availableProducts={availableProducts}
//               selectedItems={selectedProductsList}
//               loading={productsLoading}
//               error={productsError}
//               onAddItem={handleAddItem}
//               onRemoveItem={handleRemoveItem}
//               mode="custom"
//             />
//           )}
//         </main>

//         <aside>
//           <SelectedProductsSummary
//             selectedItems={selectedProductsList}
//             maxCapacity={formData.travelersCount}
//             totals={summaryTotals}
//             loading={submitLoading}
//             onRemoveItem={handleRemoveItem}
//             onAction={handleSubmit}
//             mode="custom"
//           />
//         </aside>
//       </div>
//       {/* </div>
//     </div> */}
//     </PublicPageLayout>
//   );
// }
