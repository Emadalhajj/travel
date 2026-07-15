//     //  ├── FormModal.jsx  Reusable      ✅ المودال العام

// import { Modal, Button, Form } from "react-bootstrap";
// import FormField from "./FormField";
// import ImageUploader from "../ImageUploader";


// export default function FormModal({
//   show,
//   onClose,
//   onSubmit,
//   title,
//   fields,
//   formData,
//   setFormData,
//   lang,
//   images,
//   setImages,
// }) {
//   const handleChange = (name, value) => {
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   return (
//     <Modal show={show} onHide={onClose} size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>{title}</Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form>
//           {fields.map((field) => (
//             <FormField
//               key={field.name}
//               field={field}
//               value={formData[field.name]}
//               onChange={handleChange}
//               lang={lang}
//             />
//           ))}

//           <ImageUploader
//             initialImages={images}
//             onChange={setImages}
//           />

//           <Form.Check
//             type="switch"
//             label={lang === "ar" ? "نشط" : "Active"}
//             checked={formData.isActive ?? true}
//             onChange={(e) =>
//               handleChange("isActive", e.target.checked)
//             }
//           />
//         </Form>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onClose}>
//           {lang === "ar" ? "إلغاء" : "Cancel"}
//         </Button>
//         <Button variant="primary" onClick={onSubmit}>
//           {lang === "ar" ? "حفظ" : "Save"}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }
