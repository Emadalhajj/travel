// import UniversalFormPage from "../../../Components/forms/UniversalFormPage";

import { forwardRef, useMemo } from "react";
import UniversalFormPage from "../../../../Components/forms/UniversalFormPage";

/*
=========================================================
PackageBasicInfoForm
=========================================================

هذا الملف مسؤول عن عرض نموذج البيانات الأساسية للبرنامج.

يستخدم UniversalFormPage الموجود في المشروع.

الحقول:
- اسم البرنامج
- الوصف
- الصور
- تاريخ البداية
- تاريخ النهاية
- السعة
- درجة الخدمة
- الحالة

=========================================================
*/

const PackageBasicInfoForm = forwardRef(function PackageBasicInfoForm({
  initialData,
  onSave,
  errors,
  loading,
}, ref) {

  const config = useMemo(() => ({
    commonFields: [
      {
        name: "nameAr",
        labelAr: "اسم البرنامج بالعربية",
        labelEn: "Program Name Arabic",
        type: "text",
        col: 6,
        required: true,
        order: 1,
      },
      {
        name: "nameEn",
        labelAr: "اسم البرنامج بالإنجليزية",
        labelEn: "Program Name English",
        type: "text",
        col: 6,
        required: true,
        order: 1,
      },
      {
        name: "shortDescriptionAr",
        labelAr: "وصف مختصر بالعربية",
        labelEn: "Short Description Arabic",
        type: "textarea",
        rows: 2,
        col: 6,
        order: 2,
      },
      {
        name: "shortDescriptionEn",
        labelAr: "وصف مختصر بالإنجليزية",
        labelEn: "Short Description English",
        type: "textarea",
        rows: 2,
        col: 6,
        order: 2,
      },
      {
        name: "descriptionAr",
        labelAr: "الوصف التفصيلي بالعربية",
        labelEn: "Detailed Description Arabic",
        type: "textarea",
        rows: 4,
        col: 6,
        order: 3,
      },
      {
        name: "descriptionEn",
        labelAr: "الوصف التفصيلي بالإنجليزية",
        labelEn: "Detailed Description English",
        type: "textarea",
        rows: 4,
        col: 6,
        order: 3,
      },
      {
        name: "startDate",
        labelAr: "تاريخ بداية البرنامج",
        labelEn: "Program Start Date",
        type: "date",
        col: 6,
        required: true,
        order: 4,
      },
      {
        name: "endDate",
        labelAr: "تاريخ نهاية البرنامج",
        labelEn: "Program End Date",
        type: "date",
        col: 6,
        required: true,
        order: 4,
      },
      {
        name: "maxCapacity",
        labelAr: "العدد الأقصى للأشخاص",
        labelEn: "Max Capacity",
        type: "number",
        col: 4,
        required: true,
        min: 1,
        defaultValue: 1,
        order: 5,
      },
      {
        name: "serviceLevel",
        labelAr: "درجة الخدمة",
        labelEn: "Service Level",
        type: "select",
        col: 4,
        defaultValue: "economy",
        required: true,
        order: 5,
        options: [
          { value: "economy", labelAr: "اقتصادي", labelEn: "Economy" },
          { value: "deluxe", labelAr: "ديلوكس", labelEn: "Deluxe" },
          { value: "premium", labelAr: "بريميوم", labelEn: "Premium" },
          { value: "vip", labelAr: "VIP", labelEn: "VIP" },
        ],
      },
      {
        name: "status",
        labelAr: "حالة البرنامج",
        labelEn: "Program Status",
        type: "select",
        col: 4,
        defaultValue: "draft",
        required: true,
        order: 5,
        options: [
          { value: "draft", labelAr: "مسودة", labelEn: "Draft" },
          { value: "active", labelAr: "نشط", labelEn: "Active" },
          { value: "inactive", labelAr: "غير نشط", labelEn: "Inactive" },
          { value: "sold_out", labelAr: "مكتمل العدد", labelEn: "Sold Out" },
        ],
      },
      {
        name: "images",
        labelAr: "صور البرنامج",
        labelEn: "Program Images",
        type: "file",
        col: 12,
        multiple: true,
        order: 6,
      },
    ],
  }), []);

  return (
    <UniversalFormPage
      ref={ref}
      titleAr="معلومات برنامج العمرة"
    titleEn="Umrah Package Basic Information"
    config={config}
    initialData={initialData}
    onSave={onSave}
    errors={errors}
    loading={loading}
    />
  );
});

export default PackageBasicInfoForm;
