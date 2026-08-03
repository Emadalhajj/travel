/*
=============================================================================
UniversalForm.jsx
=============================================================================

فورم عام ديناميكي قابل لإعادة الاستخدام بالكامل.

هذا الفورم مسؤول عن:

✓ إدارة حالة الفورم
✓ عرض الحقول الديناميكية
✓ إدارة الأخطاء
✓ الحقول الشرطية
✓ الحقول المحسوبة
✓ الصور والمرفقات
✓ التبويبات Tabs
✓ إرسال البيانات

يمكن استخدامه داخل:

- Modal
- Page
- Drawer
- Wizard
- Stepper

=============================================================================
*/

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

import { Tabs, Tab, Row, Col, Alert } from "react-bootstrap";

import { useTranslation } from "react-i18next";

/*
=============================================================================
Field Renderer
=============================================================================

المسؤول عن اختيار نوع الحقل المناسب وعرضه.

*/

import FieldRenderer from "./fieldRenderer/FieldRenderer";

/*
=============================================================================
Hooks
=============================================================================
*/

import useFormInitializer from "./hooks/useFormInitializer";

import useComputedFields from "./hooks/useComputedFields";

import useFieldHelpers from "./hooks/useFieldHelpers";

import { useLocationSelect } from "../../hooks/useLocationSelect";

import {
  get,
  set,
} from "./utils/objectPath";

/*
=============================================================================
UniversalForm Component
=============================================================================
*/

const UniversalForm = forwardRef(
  (
    {
      /*
      =========================================================================
      Props
      =========================================================================
      */

      /*
      config

      يحتوي:
      - commonFields
      - conditionalFields
      - validation
      - tabs
      */

      config = {},

      /*
      بيانات التعديل

      تستخدم عند edit mode
      */

      initialData = {},

      /*
      callback عند الحفظ
      */

      onSave,

      /*
      أخطاء الـ backend
      */

      errors = {},

      /*
      loading state
      */

      loading = false,

      /*
      renderActions

      يسمح بتخصيص الأزرار من الخارج.

      مثال:
      - Modal Footer
      - Page Actions
      - Drawer Actions

      */

      renderActions,
    },
    ref,
  ) => {
    /*
    =========================================================================
    Language
    =========================================================================
    */

    const { i18n } = useTranslation();

    const lang = i18n.language || "ar";

    const isArabic = lang === "ar";

    /*
    =========================================================================
    States
    =========================================================================
    */

    /*
    formState

    يحتوي جميع قيم الحقول
    */

    const [formState, setFormState] = useState({});

    /*
    fieldErrors

    يحتوي أخطاء الحقول
    */

    const [fieldErrors, setFieldErrors] = useState({});

    /*
    imageState

    مسؤول عن:
    - الصور الجديدة
    - الصور المحذوفة
    - المرفقات

    */

    const [imageState, setImageState] = useState({});

    /*
    activeTab

    التبويب الحالي
    */

    const [activeTab, setActiveTab] = useState("basic");

    /*
    =========================================================================
    Initialize Form
    =========================================================================

    تجهيز بيانات الفورم عند:

    - الإنشاء
    - التعديل

    */

    useFormInitializer({
      show: true,

      config,

      initialData,

      setFormState,

      setImageState,
    });

    /*
    =========================================================================
    Location Select
    =========================================================================

    إدارة:
    - الدول
    - المدن
    - searchable select

    */

    const {
      loadingCities,

      handleLocationSelectChange,

      getLocationOptions,

      getSelectedLocationOption,
    } = useLocationSelect(formState, setFormState, isArabic);

    /*
    =========================================================================
    Conditional Fields
    =========================================================================

    الحقول الشرطية.

    مثال:

    إذا كان:
    type = hotel

    يتم عرض:
    hotel fields

    */

    const conditionKey = config.conditionKey;

    const conditionValue = conditionKey
      ? (formState?.[conditionKey] ?? "")
      : "";

    /*
    =========================================================================
    Active Fields
    =========================================================================

    الحقول النشطة التي سيتم عرضها.

    يتم دمج:
    - commonFields
    - conditionalFields

    ثم ترتيبها حسب order

    */

    const previousConditionValueRef =
      useRef();

    const activeFields = useMemo(() => {
      return (
        [
          /*
          الحقول العامة
          */

          ...(config.commonFields || []),

          /*
          الحقول الشرطية
          */

          ...(conditionKey && conditionValue
            ? config?.conditionalFields?.[conditionValue] || []
            : []),
        ]

          /*
          حذف القيم الفارغة
          */

          .filter(Boolean)

          /*
          ترتيب الحقول
          */

          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      );
    }, [config, conditionKey, conditionValue]);

    /*
    =========================================================================
    Reset Conditional Fields On Condition Change
    =========================================================================

    يمنع بقاء قيم الفرع السابق عند تغيير الحقل
    المتحكم، ويطبق القيم الافتراضية للفرع الجديد.
    */

    useEffect(() => {
      if (!config?.conditionKey) {
        return;
      }

      const allConditionalFields =
        Object.values(
          config.conditionalFields || {},
        ).flat();

      const activeConditionalFields =
        config.conditionalFields?.[
          conditionValue
        ] || [];

      const activeNames =
        new Set(
          activeConditionalFields.map(
            (field) => field.name,
          ),
        );

      const conditionChanged =
        previousConditionValueRef.current !==
          undefined &&
        previousConditionValueRef.current !==
          conditionValue;

      setFormState((previous) => {
        let next = {
          ...previous,
        };

        allConditionalFields.forEach(
          (field) => {
            if (
              !activeNames.has(
                field.name,
              )
            ) {
              delete next[
                field.name
              ];
            }
          },
        );

        activeConditionalFields.forEach(
          (field) => {
            if (
              field.defaultValue !==
                undefined &&
              (conditionChanged ||
                get(
                  next,
                  field.name,
                ) === undefined)
            ) {
              next = set(
                next,
                field.name,
                field.defaultValue,
              );
            }
          },
        );

        return next;
      });

      previousConditionValueRef.current =
        conditionValue;
    }, [
      config,
      conditionValue,
    ]);

    /*
    =========================================================================
    Computed Fields
    =========================================================================

    الحقول المحسوبة تلقائياً.

    مثال:
    - total price
    - taxes
    - discounts

    */

    const computedValues = useComputedFields(formState, activeFields);

    /*
    =========================================================================
    Helpers
    =========================================================================

    يحتوي helper functions مثل:

    - getFieldValue
    - getFieldStatePath
    - clearFieldError

    */

    const helpers = useFieldHelpers(formState, setFieldErrors);

    /*
    =========================================================================
    Backend Errors
    =========================================================================

    استقبال أخطاء الـ API
    وعرضها داخل الحقول.

    */

    useEffect(() => {
      setFieldErrors(errors || {});
    }, [errors]);

    /*
    =========================================================================
    Submit
    =========================================================================

    إرسال بيانات الفورم.

    */

    const handleSubmit = () => {
      /*
      دمج الحقول المحسوبة
      */

      const finalData = {
        ...formState,

        ...computedValues,
      };

      /*
      هل يوجد صور جديدة أو صور محذوفة؟
      */

      const hasImages = Object.values(imageState || {}).some(
        (img) => img?.newImages?.length || img?.deletedOldImages?.length,
      );

      /*
      إرسال البيانات
      */

      if (hasImages) {
        onSave?.({
          formState: finalData,

          imageState,
        });
      } else {
        onSave?.(finalData);
      }
    };

    /*
    =========================================================================
    Expose Methods
    =========================================================================

    السماح بالتحكم بالفورم من الخارج.

    */

    useImperativeHandle(ref, () => ({
      /*
      submit()

      تنفيذ submit من الخارج.
      */

      submit: handleSubmit,

      /*
      getValues()

      إرجاع قيم الفورم.
      */

      getValues: () => ({
        ...formState,

        ...computedValues,
      }),

      /*
      getPayload()

      إرجاع قيم الفورم مع حالة الصور حتى تستطيع الصفحات التي
      تحفظ من زر خارجي إرسال FormData كامل.
      */

      getPayload: () => ({
        formState: {
          ...formState,

          ...computedValues,
        },

        imageState,
      }),

      /*
      reset()

      إعادة تعيين الفورم.
      */

      reset: () => {
        setFormState({});

        setImageState({});

        setFieldErrors({});
      },
    }));

    /*
    =========================================================================
    Render
    =========================================================================
    */

    const formLevelError = fieldErrors?._form || fieldErrors?.form;

    return (
      <>
        {formLevelError && (
          <Alert variant="danger" className="mb-3">
            {formLevelError}
          </Alert>
        )}

        {/* ===============================================================
            Tabs
        =============================================================== */}

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Tab eventKey="basic" title={isArabic ? "البيانات" : "Basic"}>
            <Row className="g-4 px-2">
              {activeFields
                .filter((field) => field.type !== "hidden")
                .map((field) => (
                  <Col xs={12} md={field.col || 6} key={field.name}>
                    <FieldRenderer
                      field={field}
                      formState={formState}
                      setFormState={setFormState}
                      initialData={initialData}
                      imageState={imageState}
                      setImageState={setImageState}
                      computedValues={computedValues}
                      fieldErrors={fieldErrors}
                      isArabic={isArabic}
                      helpers={helpers}
                      loadingCities={loadingCities}
                      getLocationOptions={getLocationOptions}
                      getSelectedLocationOption={getSelectedLocationOption}
                      handleLocationSelectChange={handleLocationSelectChange}
                    />
                  </Col>
                ))}
            </Row>
          </Tab>
        </Tabs>
      </>
    );
  },
);

export default UniversalForm;

// /*
// =========================================================
// UniversalForm.jsx
// =========================================================

// فورم ديناميكي قابل لإعادة الاستخدام بالكامل

// المسؤوليات:
// ---------------------------------------------------------
// 1- إدارة form state
// 2- إدارة computed fields
// 3- إدارة الأخطاء
// 4- إدارة الصور والمرفقات
// 5- تحديد الحقول النشطة
// 6- تنفيذ submit
// 7- render الحقول

// يمكن استخدامه داخل:
// ---------------------------------------------------------
// - Modal
// - Page
// - Drawer
// - Wizard
// - Tabs
// - Stepper

// =========================================================
// */

// import React, { useState, useMemo, useEffect , forwardRef } from "react";

// import { Button, Tabs, Tab, Row, Col } from "react-bootstrap";

// import { useTranslation } from "react-i18next";

// /*
// =========================================================
// Field Renderer
// =========================================================
// */

// import FieldRenderer from "./fieldRenderer/FieldRenderer";

// /*
// =========================================================
// Hooks
// =========================================================
// */

// import useFormInitializer from "./hooks/useFormInitializer";

// import useComputedFields from "./hooks/useComputedFields";

// import useFieldHelpers from "./hooks/useFieldHelpers";

// import { useLocationSelect } from "../../hooks/useLocationSelect";

// /*
// =========================================================
// Component
// =========================================================
// */

// export default function UniversalForm({
//   /*
//   =========================================================
//   Props
//   =========================================================
//   */

//   config = {},

//   initialData = {},

//   onSave,

//   errors = {},

//   loading = false,

//   /*
//   renderActions
//   يسمح بتخصيص الأزرار خارج الفورم
//   */

//   renderActions,
// }) {
//   /*
//   =========================================================
//   Language
//   =========================================================
//   */

//   const { i18n } = useTranslation();

//   const lang = i18n.language || "ar";

//   const isArabic = lang === "ar";

//   /*
//   =========================================================
//   States
//   =========================================================
//   */

//   /*
//   بيانات الفورم
//   */

//   const [formState, setFormState] = useState({});

//   /*
//   أخطاء الحقول
//   */

//   const [fieldErrors, setFieldErrors] = useState({});

//   /*
//   إدارة الصور والمرفقات
//   */

//   const [imageState, setImageState] = useState({});

//   /*
//   التبويب الحالي
//   */

//   const [activeTab, setActiveTab] = useState("basic");

//   /*
//   =========================================================
//   Location Select
//   =========================================================

//   إدارة:
//   - الدول
//   - المدن
//   - searchable select

//   */

//   const {
//     loadingCities,

//     handleLocationSelectChange,

//     getLocationOptions,

//     getSelectedLocationOption,
//   } = useLocationSelect(formState, setFormState, isArabic);

//   /*
//   =========================================================
//   Initialize Form
//   =========================================================

//   تجهيز البيانات عند:
//   - الإنشاء
//   - التعديل

//   */

//   useFormInitializer({
//     show: true,

//     config,

//     initialData,

//     setFormState,

//     setImageState,
//   });

//   /*
//   =========================================================
//   Active Fields
//   =========================================================

//   الحقول النشطة حسب:
//   - commonFields
//   - conditionalFields

//   */

//   const conditionKey = config.conditionKey;

//   const conditionValue = conditionKey ? (formState?.[conditionKey] ?? "") : "";

//   const activeFields = useMemo(() => {
//     return (
//       [
//         /*
//         الحقول العامة
//         */

//         ...(config.commonFields || []),

//         /*
//         الحقول الشرطية
//         */

//         ...(conditionKey && conditionValue
//           ? config?.conditionalFields?.[conditionValue] || []
//           : []),
//       ]

//         /*
//         حذف القيم الفارغة
//         */

//         .filter(Boolean)

//         /*
//         ترتيب الحقول
//         */

//         .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
//     );
//   }, [config, conditionKey, conditionValue]);

//   /*
//   =========================================================
//   Computed Fields
//   =========================================================

//   الحقول المحسوبة تلقائياً

//   */

//   const computedValues = useComputedFields(formState, activeFields);

//   /*
//   =========================================================
//   Helpers
//   =========================================================

//   مسؤول عن:
//   - getFieldValue
//   - getFieldStatePath
//   - clearFieldError

//   */

//   const helpers = useFieldHelpers(formState, setFieldErrors);

//   /*
//   =========================================================
//   Backend Errors
//   =========================================================

//   استقبال أخطاء الـ API

//   */

//   useEffect(() => {
//     setFieldErrors(errors || {});
//   }, [errors]);

//   /*
//   =========================================================
//   Submit
//   =========================================================
//   */

//   const handleSubmit = () => {
//     /*
//     دمج القيم المحسوبة
//     */

//     const finalData = {
//       ...formState,

//       ...computedValues,
//     };

//     onSave?.({
//       formState: finalData,
//       imageState,
//     });
//   };

//   /*
//   =========================================================
//   Render
//   =========================================================
//   */

//   return (
//     <>
//       {/* =====================================================
//           Tabs
//       ===================================================== */}

//       <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
//         {/* =================================================
//             Basic Tab
//         ================================================= */}

//         <Tab eventKey="basic" title={isArabic ? "البيانات" : "Basic"}>
//           {/* =============================================
//               Fields
//           ============================================= */}

//           <Row className="g-4 px-2">
//             {activeFields

//               /*
//               إخفاء hidden fields
//               */

//               .filter((field) => field.type !== "hidden")

//               .map((field) => (
//                 <Col xs={12} md={field.col || 6} key={field.name}>
//                   <FieldRenderer
//                     /*
//                     field
//                     */

//                     field={field}
//                     /*
//                     form state
//                     */

//                     formState={formState}
//                     setFormState={setFormState}
//                     /*
//                     initial data
//                     */

//                     initialData={initialData}
//                     /*
//                     image state
//                     */

//                     imageState={imageState}
//                     setImageState={setImageState}
//                     /*
//                     computed values
//                     */

//                     computedValues={computedValues}
//                     /*
//                     errors
//                     */

//                     fieldErrors={fieldErrors}
//                     /*
//                     language
//                     */

//                     isArabic={isArabic}
//                     /*
//                     helpers
//                     */

//                     helpers={helpers}
//                     /*
//                     location select
//                     */

//                     loadingCities={loadingCities}
//                     getLocationOptions={getLocationOptions}
//                     getSelectedLocationOption={getSelectedLocationOption}
//                     handleLocationSelectChange={handleLocationSelectChange}
//                   />
//                 </Col>
//               ))}
//           </Row>
//         </Tab>
//       </Tabs>

//       {/* =====================================================
//           Actions
//       ===================================================== */}

//       {renderActions ? (
//         /*
//         إذا تم تمرير actions من الخارج
//         */

//         renderActions({
//           handleSubmit,

//           loading,

//           isArabic,

//           formState,

//           computedValues,
//         })
//       ) : (
//         /*
//         الشكل الافتراضي
//         */

//         <div className="d-flex gap-3 mt-4">
//           <Button variant="primary" onClick={handleSubmit} disabled={loading}>
//             {loading
//               ? isArabic
//                 ? "جارٍ الحفظ..."
//                 : "Saving..."
//               : isArabic
//                 ? "حفظ"
//                 : "Save"}
//           </Button>
//         </div>
//       )}
//     </>
//   );
// }
