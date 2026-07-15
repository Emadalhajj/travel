/*
إدارة المودال -- ج
عبارة عن ازار او غلاف للفورم العام 
Wrapper 
الاستخدام يكون 
<UniversalFormModal

  show={showModal}

  onHide={() =>
    setShowModal(false)
  }

  onSave={handleSave}

  config={hotelConfig}

  initialData={hotel}

  errors={errors}

  loading={loading}

/>

/*
=========================================================
UniversalFormModal.jsx
=========================================================

Wrapper خاص بعرض الفورم داخل Modal

المسؤوليات:
---------------------------------------------------------
1- عرض Modal فقط
2- تمرير البيانات إلى UniversalForm
3- تخصيص الأزرار الخاصة بالمودال
4- التحكم بالإغلاق
5- الحفاظ على فصل المنطق عن الشكل

مهم:
---------------------------------------------------------
لا يحتوي أي منطق خاص بالفورم.
كل المنطق داخل UniversalForm.

=========================================================
*/

import React, { useRef } from "react";

import { Modal, Button } from "react-bootstrap";

import { useTranslation } from "react-i18next";

/*
=========================================================
Universal Form
=========================================================
*/

import UniversalForm from "./UniversalForm";

/*
=========================================================
Component
=========================================================
*/
export default function UniversalFormModal({
  /*
  =========================================================
  Modal Control
  =========================================================
  */
  show,
  onHide,
  /*
  =========================================================
  Form
  =========================================================
  */

  onSave,
  config,
  initialData,
  errors,
  loading,

  /*
  =========================================================
  Titles
  =========================================================
  */

  titleAr = "إضافة",

  titleEn = "Create",
}) {
  //======= hooks ===========
  const formRef = useRef();
  /*
  =========================================================
  Language
  =========================================================
  */

  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  /*
  =========================================================
  Render
  =========================================================
  */

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      scrollable
      fullscreen="sm-down"
      backdrop="static"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* =================================================
          Header
      ================================================= */}

      <Modal.Header closeButton className="bg-light border-bottom py-3">
        <Modal.Title className="fw-bold fs-5">
          {isArabic ? titleAr : titleEn}
        </Modal.Title>
        <style jsx>{`
          .modal-header .btn-close {
            background-color: #dc3545 !important;
            opacity: 1;
            filter: none;
          }
        `}</style>
      </Modal.Header>

      {/* =================================================
          Body
      ================================================= */}

      <Modal.Body>
        <UniversalForm
        ref={formRef}
          /*
          form config
          */
          config={config}
          /*
          edit/create data
          */
          initialData={initialData}
          /*
          save action
          */
          onSave={onSave}
          /*
          backend validation
          */
          errors={errors}
          /*
          loading
          */
          loading={loading}
        />

      </Modal.Body>
      {/* footer */}
      <Modal.Footer className="bg-light border-top py-3 px-4">
        {" "}
        <div className="d-flex gap-3">
          {" "}
          <Button variant="danger" onClick={onHide}>
            {" "}
            {isArabic ? "إلغاء" : "Cancel"}{" "}
          </Button>{" "}
          <Button
            variant="primary"
            disabled={loading}
            onClick={() => formRef.current?.submit()}
          >
            {" "}
            {loading
              ? isArabic
                ? "جارٍ الحفظ..."
                : "Saving..."
              : isArabic
                ? "حفظ"
                : "Save"}{" "}
          </Button>{" "}
        </div>{" "}
      </Modal.Footer>
    </Modal>
  );
}

// import React, { useState, useMemo } from "react";

// import { Modal, Button, Tabs, Tab, Row, Col } from "react-bootstrap";

// import { useTranslation } from "react-i18next";

// import FieldRenderer from "./fieldRenderer/FieldRenderer";

// import useFormInitializer from "./hooks/useFormInitializer";

// import useComputedFields from "./hooks/useComputedFields";

// import useFieldHelpers from "./hooks/useFieldHelpers";
// import { useLocationSelect } from "../../hooks/useLocationSelect";

// export default function UniversalFormModal({
//   show,
//   onHide,
//   onSave,
//   config = {},
//   initialData = {},
//   titleAr = "إضافة",
//   titleEn = "Create",
//   errors = {},
//   loading = false,
// }) {
//   const { i18n } = useTranslation();

//   const lang = i18n.language || "ar";

//   const isArabic = lang === "ar";

//   const [formState, setFormState] = useState({});

//   const [fieldErrors, setFieldErrors] = useState({});

//   const [imageState, setImageState] = useState({});

//   const [activeTab, setActiveTab] = useState("basic");

//   const {
//     loadingCities,
//     handleLocationSelectChange,
//     getLocationOptions,
//     getSelectedLocationOption,
//   } = useLocationSelect(formState, setFormState, isArabic);
//   // تهيئة البيانات
//   useFormInitializer({
//     show,
//     config,
//     initialData,
//     setFormState,
//     setImageState,
//   });

//   // تحديد الحقول النشطة
//   const conditionKey = config.conditionKey;

//   const conditionValue = conditionKey ? (formState?.[conditionKey] ?? "") : "";

//   const activeFields = useMemo(() => {
//     return [
//       ...(config.commonFields || []),

//       ...(conditionKey && conditionValue
//         ? config.conditionalFields?.[conditionValue] || []
//         : []),
//     ]

//       .filter(Boolean)

//       .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
//   }, [config, conditionKey, conditionValue]);

//   // computed values
//   const computedValues = useComputedFields(formState, activeFields);

//   // helpers
//   const helpers = useFieldHelpers(formState, setFieldErrors);

//   // استقبال أخطاء backend
//   React.useEffect(() => {
//     setFieldErrors(errors || {});
//   }, [errors]);

//   const handleSubmit = () => {
//     const finalData = {
//       ...formState,
//       ...computedValues,
//     };

//     const hasImages = Object.values(imageState || {}).some(
//       (img) => img?.newImages?.length || img?.deletedOldImages?.length,
//     );

//     if (hasImages) {
//       onSave({
//         formState: finalData,
//         imageState,
//       });
//     } else {
//       onSave(finalData);
//     }
//   };

//   return (
//     <Modal
//       show={show}
//       onHide={onHide}
//       size="xl"
//       centered
//       scrollable
//       dir={isArabic ? "rtl" : "ltr"}
//     >
//       <Modal.Header closeButton>
//         <Modal.Title>{isArabic ? titleAr : titleEn}</Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
//           <Tab eventKey="basic" title={isArabic ? "البيانات" : "Basic"}>
//             <Row className="g-4 px-2">
//               {activeFields
//                 .filter((field) => field.type !== "hidden")
//                 .map((field) => (
//                   <Col xs={12} md={field.col || 6} key={field.name}>
//                     <FieldRenderer
//                       field={field}
//                       formState={formState}
//                       setFormState={setFormState}
//                       initialData={initialData}
//                       imageState={imageState}
//                       setImageState={setImageState}
//                       computedValues={computedValues}
//                       fieldErrors={fieldErrors}
//                       isArabic={isArabic}
//                       helpers={helpers}
//                       loadingCities={loadingCities}
//                       getLocationOptions={getLocationOptions}
//                       getSelectedLocationOption={getSelectedLocationOption}
//                       handleLocationSelectChange={handleLocationSelectChange}
//                     />
//                   </Col>
//                 ))}
//             </Row>
//           </Tab>
//         </Tabs>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="danger" onClick={onHide}>
//           {isArabic ? "إلغاء" : "Cancel"}
//         </Button>

//         <Button variant="primary" onClick={handleSubmit} disabled={loading}>
//           {loading
//             ? isArabic
//               ? "جارٍ الحفظ..."
//               : "Saving..."
//             : isArabic
//               ? "حفظ"
//               : "Save"}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }
