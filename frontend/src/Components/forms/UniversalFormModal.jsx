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

import UniversalForm from "./UniversalForm";

export default function UniversalFormModal({
  show,
  onHide,

  onSave,
  config,
  initialData,
  errors,
  loading = false,
  onFormStateChange,
  afterFormContent,
  hideSaveAction = false,

  titleAr = "إضافة",
  titleEn = "Create",
}) {
  const formRef = useRef();
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const handleSubmit = () => {
    formRef.current?.submit();
  };

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
      <Modal.Header closeButton className="bg-light border-bottom py-3">
        <Modal.Title className="fw-bold fs-5">
          {isArabic ? titleAr : titleEn}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <UniversalForm
          ref={formRef}
          show={show}
          config={config}
          initialData={initialData}
          onSave={onSave}
          errors={errors}
          loading={loading}
          onFormStateChange={onFormStateChange}
        />

        {afterFormContent}
      </Modal.Body>

      <Modal.Footer className="bg-light border-top py-3 px-4">
        <div className="d-flex gap-3">
          <Button
            variant="outline-secondary"
            onClick={onHide}
            disabled={loading}
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </Button>

          {!hideSaveAction && (
            <Button variant="primary" disabled={loading} onClick={handleSubmit}>
              {loading
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "حفظ"
                  : "Save"}
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}

// import React, { useRef } from "react";

// import { Modal, Button } from "react-bootstrap";

// import { useTranslation } from "react-i18next";

// /*
// =========================================================
// Universal Form
// =========================================================
// */

// import UniversalForm from "./UniversalForm";

// /*
// =========================================================
// Component
// =========================================================
// */
// export default function UniversalFormModal({
//   /*
//   =========================================================
//   Modal Control
//   =========================================================
//   */
//   show,
//   onHide,
//   /*
//   =========================================================
//   Form
//   =========================================================
//   */

//   onSave,
//   config,
//   initialData,
//   errors,
//   loading,
//   onFormStateChange,
//   afterFormContent,
//   hideSaveAction = false,

//   /*
//   =========================================================
//   Titles
//   =========================================================
//   */

//   titleAr = "إضافة",

//   titleEn = "Create",
// }) {
//   //======= hooks ===========
//   const formRef = useRef();
//   /*
//   =========================================================
//   Language
//   =========================================================
//   */

//   const { i18n } = useTranslation();

//   const isArabic = i18n.language === "ar";

//   /*
//   =========================================================
//   Render
//   =========================================================
//   */

//   return (
//     <Modal
//       show={show}
//       onHide={onHide}
//       size="xl"
//       centered
//       scrollable
//       fullscreen="sm-down"
//       backdrop="static"
//       dir={isArabic ? "rtl" : "ltr"}
//     >
//       {/* =================================================
//           Header
//       ================================================= */}

//       <Modal.Header closeButton className="bg-light border-bottom py-3">
//         <Modal.Title className="fw-bold fs-5">
//           {isArabic ? titleAr : titleEn}
//         </Modal.Title>
//         <style jsx>{`
//           .modal-header .btn-close {
//             background-color: #dc3545 !important;
//             opacity: 1;
//             filter: none;
//           }
//         `}</style>
//       </Modal.Header>

//       {/* =================================================
//           Body
//       ================================================= */}

//       <Modal.Body>
//         <UniversalForm
//         ref={formRef}
//           show={show}
//           /*
//           form config
//           */
//           config={config}
//           /*
//           edit/create data
//           */
//           initialData={initialData}
//           /*
//           save action
//           */
//           onSave={onSave}
//           /*
//           backend validation
//           */
//           errors={errors}
//           /*
//           loading
//           */
//           loading={loading}
//           onFormStateChange={onFormStateChange}
//         />

//         {afterFormContent}

//       </Modal.Body>
//       {/* footer */}
//       <Modal.Footer className="bg-light border-top py-3 px-4">
//         {" "}
//         <div className="d-flex gap-3">
//           {" "}
//           <Button variant="danger" onClick={onHide}>
//             {" "}
//             {isArabic ? "إلغاء" : "Cancel"}{" "}
//           </Button>{" "}
//           {!hideSaveAction && <Button
//             variant="primary"
//             disabled={loading}
//             onClick={() => formRef.current?.submit()}
//           >
//             {" "}
//             {loading
//               ? isArabic
//                 ? "جارٍ الحفظ..."
//                 : "Saving..."
//               : isArabic
//                 ? "حفظ"
//                 : "Save"}{" "}
//           </Button>}{" "}
//         </div>{" "}
//       </Modal.Footer>
//     </Modal>
//   );
// }
