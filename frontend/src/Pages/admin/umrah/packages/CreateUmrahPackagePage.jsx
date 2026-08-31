/*
هذا هو الملف الرئيسي لإنشاء برنامج العمرة.

يقوم بالآتي:
1. يعرض فورم البيانات الأساسية
2. يراقب startDate و endDate
3. عند توفر التاريخين يجلب المنتجات المتاحة
4. يعرض المنتجات داخل ProductTabs
5. يجمع الخدمات المختارة داخل Summary
6. عند الحفظ يرسل payload إلى Redux
7. بعد النجاح يرجع إلى قائمة البرامج

*/
import React, { useEffect, useRef } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// import PackageBasicInfoForm from "./PackageBasicInfoForm";
import ProductTabs from "../../../../Components/shared/products/ProductTabs";
import PackageSummaryPanel from "../../../../Components/shared/products/PackageSummaryPanel";

import usePackageForm from "./hooks/usePackageForm";
import useAvailableProducts from "../../../../hooks/products/useAvailableProducts";

// import {
//   createUmrahProgram,
// } from "../../../redux/umrah/umrahProgramSlice";

import { useDispatch } from "react-redux";
import {
  createUmrahProgram,
  updateUmrahProgram,
  fetchOneUmrahProgram,
} from "../../../../redux/umrah/umrahProgramSlice";
import PackageBasicInfoForm from "./PackageBasicInfoForm";
import DiscountSection from "./DiscountSection";
import PageHeader from "../../../../Components/layout/PageHeader";

export default function CreateUmrahPackagePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basicInfoFormRef = useRef(null);

  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isArabic = lang === "ar";

  const { id } = useParams();
  const location = useLocation();

  // const isEditMode = Boolean(id);
  const isEditMode = location.pathname.includes("/edit/");
  const isCloneMode = location.pathname.includes("/clone/");

  const {
    basicInfo,
    setBasicInfo,
    selectedItems,
    discount,
    setDiscount,
    totals,
    loadingSave,
    setLoadingSave,
    formErrors,
    setFormErrors,
    addItem,
    removeItem,
    buildPayload,
    canLoadProducts,
    loadPackageForEdit,
  } = usePackageForm();

  const {
    availableProducts,
    loadingProducts,
    productsError,
    fetchProductsByDate,
  } = useAvailableProducts();

  useEffect(() => {
    if (!canLoadProducts) return;

    fetchProductsByDate({
      startDate: basicInfo.startDate,
      endDate: basicInfo.endDate,
      pilgrimsCount: basicInfo.maxCapacity || 1,
    });
  }, [
    canLoadProducts,
    basicInfo.startDate,
    basicInfo.endDate,
    basicInfo.maxCapacity,
    fetchProductsByDate,
  ]);

  //useEffect
  useEffect(() => {
    if (!id) return;

    const loadProgram = async () => {
      const data = await dispatch(fetchOneUmrahProgram(id)).unwrap();

      if (isCloneMode) {
        loadPackageForEdit({
          ...data,
          _id: null,
          nameAr: `${data.nameAr} (نسخة)`,
          nameEn: `${data.nameEn} (copy)`,
          status: "draft",
        });
      } else {
        loadPackageForEdit(data);

        //   toast.success(
        //   isArabic
        //     ? isEditMode
        //       ? "تم تعديل برنامج العمرة بنجاح"
        //       : "تم إنشاء برنامج العمرة بنجاح"
        //     : isEditMode
        //       ? "Umrah package updated successfully"
        //       : "Umrah package created successfully",
        // );
      }
    };
    loadProgram();
  }, [dispatch, id, isCloneMode, loadPackageForEdit]);

  const handleSavePackage = async () => {
    try {
      setLoadingSave(true);
      setFormErrors({});

      const formPayload = basicInfoFormRef.current?.getPayload?.() || {};
      const latestBasicInfo = formPayload.formState || {};
      const imageState = formPayload.imageState || {};
      const payload = buildPayload(latestBasicInfo);
      const requestData = new FormData();

      requestData.append("data", JSON.stringify(payload));

      imageState.images?.newImages?.forEach((file) => {
        requestData.append("images", file);
      });

      imageState.images?.deletedOldImages?.forEach((imagePath) => {
        requestData.append("deleteImages[]", imagePath);
      });

      if (isEditMode) {
        await dispatch(updateUmrahProgram({ id, data: requestData })).unwrap();
      } else {
        await dispatch(createUmrahProgram(requestData)).unwrap();
      }

      toast.success(
        isArabic
          ? isEditMode
            ? "تم تعديل برنامج العمرة بنجاح"
            : "تم إنشاء برنامج العمرة بنجاح"
          : isEditMode
            ? "Umrah package updated successfully"
            : "Umrah package created successfully",
      );

      navigate("/admin/umrah-program");
    } catch (error) {
      setFormErrors(error || {});

      toast.error(
        isArabic ? "حدث خطأ أثناء حفظ البرنامج" : "Failed to save package",
      );
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <PageHeader
        titleAr={isEditMode ? "تعديل برنامج العمرة" : "إنشاء برنامج عمرة جديد"}
        titleEn={isEditMode ? "Edit Umrah Package" : "Create New Umrah Package"}
        subtitleAr="قم بإدخال معلومات البرنامج ثم اختر الخدمات المتاحة حسب الفترة المحددة."
        subtitleEn="Enter package information, then select available services by date."
      />

      <Row className="g-4">
        <Col lg={8}>
          <PackageBasicInfoForm
            key={id && basicInfo.nameAr ? id : "new-program"}
            ref={basicInfoFormRef}
            initialData={basicInfo}
            onSave={(data) => {
              setBasicInfo((prev) => ({
                ...prev,
                ...data,
              }));
            }}
            errors={formErrors}
            loading={loadingSave}
          />

          <div className="mt-4">
            {!canLoadProducts && (
              <Alert variant="info" className="rounded-4">
                {isArabic
                  ? "بعد تحديد تاريخ البداية والنهاية سيتم عرض الخدمات المتاحة تلقائياً."
                  : "Available services will appear automatically after selecting start and end dates."}
              </Alert>
            )}

            <ProductTabs
              startDate={basicInfo.startDate}
              endDate={basicInfo.endDate}
              availableProducts={availableProducts}
              selectedItems={selectedItems}
              loading={loadingProducts}
              error={productsError}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              mode="admin"
            />
          </div>
          <div className="mt-4">
            <DiscountSection discount={discount} setDiscount={setDiscount} />
          </div>
        </Col>

        <Col lg={4}>
          <PackageSummaryPanel
            selectedItems={selectedItems}
            maxCapacity={basicInfo.maxCapacity}
            discount={discount}
            totals={totals}
            loading={loadingSave}
            onRemoveItem={removeItem}
            onAction={handleSavePackage}
  mode="admin"
          />
        </Col>
      </Row>
    </div>
  );
}
