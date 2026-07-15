// import React from "react";
// import { Modal, Button, Form } from "react-bootstrap";
// import Select from "react-select";
// import ImageUploader from "../../common/ImageUploader";

// // Helper: get deep value (for nested fields like location.city.ar)
// const getValue = (obj, path) => {
//   if (!path) return "";
//   return path.split(".").reduce((acc, key) => (acc ? acc[key] : ""), obj);
// };

// export default function ReusableModalForm({
//   show,
//   onClose,
//   onSubmit,
//   title = "",
//   values = {},
//   onChange,
//   sections = [],
//   loading = false,
// }) {
//   return (
//     <Modal show={show} onHide={onClose} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>{title}</Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         {sections.map((section) => (
//           <div key={section.title} className="mb-4">
//             <h5 className="fw-bold mb-3">{section.title}</h5>

//             {/** ======================= FIELDS ======================= */}
//             {section.type === "fields" &&
//               section.fields?.map((field) => (
//                 <Form.Group key={field.name} className="mb-3">
//                   <Form.Label>{field.label}</Form.Label>

//                   <Form.Control
//                     as={field.as || "input"}
//                     type={field.type || "text"}
//                     value={getValue(values, field.name)}
//                     onChange={(e) => onChange(field.name, e.target.value)}
//                     placeholder={field.placeholder || ""}
//                   />
//                 </Form.Group>
//               ))}

//             {/** ======================= IMAGE UPLOADER ======================= */}
//             {section.type === "component" && section.component === "images" && (
//               <ImageUploader
//                 initialImages={values.images || []}
//                 onChange={(data) => onChange("images", data)}
//                 multiple
//                 maxImages={20}
//               />
//             )}

//             {/** ======================= MULTI SELECT ======================= */}
//             {section.type === "multi-select" && (
//               <div className="mb-3">
//                 <Form.Label>{section.label}</Form.Label>
//                 <Select
//                   isMulti
//                   value={values[section.name] || []}
//                   onChange={(val) => onChange(section.name, val)}
//                   options={section.options || []}
//                   placeholder={section.placeholder || "اختر..."}
//                 />
//               </div>
//             )}
//           </div>
//         ))}
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onClose}>
//           إغلاق
//         </Button>
//         <Button variant="primary" onClick={onSubmit} disabled={loading}>
//           {loading ? "جاري الحفظ..." : "حفظ"}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }
