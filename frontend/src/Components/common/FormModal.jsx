// // src/components/common/FormModal.jsx
// import React from "react";
// import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
// import ImageUploader from "./ImageUploader";
// import TruncatedText from "./TruncatedText";
// import { useTranslation } from "react-i18next";

// const FormModal = ({
//   show,
//   onHide,
//   title = "إضافة عنصر جديد",
//   fields = [],              // مصفوفة تحدد كل الحقول
//   initialData = {},         // البيانات عند التعديل
//   onSubmit,                 // دالة الحفظ
//   isLoading = false,
//   submitText = "حفظ",
//   lang = "ar",
// }) => {
//   const { t } = useTranslation();
//   const [formData, setFormData] = React.useState(initialData);
//   const [uploadedImages, setUploadedImages] = React.useState({
//     newImages: [],
//     deletedOldImages: [],
//   });

//   // تحديث النموذج عند فتح المودال أو تغيير initialData
//   React.useEffect(() => {
//     setFormData(initialData);
//     setUploadedImages({ newImages: [], deletedOldImages: [] });
//   }, [initialData, show]);

//   const handleChange = (key, value) => {
//     if (key.includes(".")) {
//       const [parent, child] = key.split(".");
//       setFormData(prev => ({
//         ...prev,
//         [parent]: { ...prev[parent], [child]: value }
//       }));
//     } else {
//       setFormData(prev => ({ ...prev, [key]: value }));
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSubmit(formData, uploadedImages);
//   };

//   return (
//     <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
//       <Form onSubmit={handleSubmit}>
//         <Modal.Header closeButton>
//           <Modal.Title>{title}</Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Row className="g-3">
//             {fields.map((field) => {
//               const { key, type = "text", label, options, required = true, col = 6 } = field;

//               // حقل النصوص العادية
//               if (type === "text" || type === "number" || type === "textarea") {
//                 return (
//                   <Col md={col} key={key}>
//                     <Form.Group>
//                       <Form.Label>{label}</Form.Label>
//                       {type === "textarea" ? (
//                         <Form.Control
//                           as="textarea"
//                           rows={3}
//                           value={formData[key] || ""}
//                           onChange={(e) => handleChange(key, e.target.value)}
//                           required={required}
//                         />
//                       ) : (
//                         <Form.Control
//                           type={type}
//                           value={formData[key] || ""}
//                           onChange={(e) => handleChange(key, e.target.value)}
//                           required={required}
//                         />
//                       )}
//                     </Form.Group>
//                   </Col>
//                 );
//               }

//               // حقل متعدد اللغات (مثل name.ar, description.en)
//               if (type === "i18n") {
//                 return (
//                   <Col md={12} key={key}>
//                     <Row className="g-3">
//                       <Col md={6}>
//                         <Form.Group>
//                           <Form.Label>{label} (عربي)</Form.Label>
//                           <Form.Control
//                             value={formData[key]?.ar || ""}
//                             onChange={(e) => handleChange(`${key}.ar`, e.target.value)}
//                             required={required}
//                           />
//                         </Form.Group>
//                       </Col>
//                       <Col md={6}>
//                         <Form.Group>
//                           <Form.Label>{label} (English)</Form.Label>
//                           <Form.Control
//                             value={formData[key]?.en || ""}
//                             onChange={(e) => handleChange(`${key}.en`, e.target.value)}
//                             required={required}
//                           />
//                         </Form.Group>
//                       </Col>
//                     </Row>
//                   </Col>
//                 );
//               }

//               // حقل Select
//               if (type === "select") {
//                 return (
//                   <Col md={col} key={key}>
//                     <Form.Group>
//                       <Form.Label>{label}</Form.Label>
//                       <Form.Select
//                         value={formData[key] || ""}
//                         onChange={(e) => handleChange(key, e.target.value)}
//                         required={required}
//                       >
//                         <option value="">اختر...</option>
//                         {options.map(opt => (
//                           <option key={opt.value} value={opt.value}>
//                             {lang === "ar" ? opt.labelAr : opt.labelEn}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>
//                 );
//               }

//               // حقل الصور (متعددة)
//               if (type === "images") {
//                 return (
//                   <Col md={12} key={key}>
//                     <ImageUploader
//                       initialImages={initialData.images || []}
//                       onChange={setUploadedImages}
//                       maxImages={field.maxImages || 10}
//                       label={label}
//                     />
//                   </Col>
//                 );
//               }

//               // حقل Switch
//               if (type === "switch") {
//                 return (
//                   <Col md={col} key={key} className="d-flex align-items-center">
//                     <Form.Check
//                       type="switch"
//                       label={label}
//                       checked={formData[key] || false}
//                       onChange={(e) => handleChange(key, e.target.checked)}
//                     />
//                   </Col>
//                 );
//               }

//               return null;
//             })}
//           </Row>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="secondary" onClick={onHide} disabled={isLoading}>
//             إلغاء
//           </Button>
//           <Button variant="primary" type="submit" disabled={isLoading}>
//             {isLoading ? (
//               <>
//                 <Spinner size="sm" className="me-2" />
//                 جاري الحفظ...
//               </>
//             ) : (
//               submitText
//             )}
//           </Button>
//         </Modal.Footer>
//       </Form>
//     </Modal>
//   );
// };

// export default FormModal;
