// import { Modal, Button, Form, Row, Col } from "react-bootstrap";
// import { useEffect, useState } from "react";
// import ImageUploader from "../../ImageUploader"; // مثال

// export default function TransportFormModal({
//   show,
//   onHide,
//   onSave,
//   formModel,
//   currentTransport,
// }) {
//   const [formData, setFormData] = useState({});
//   const [images, setImages] = useState([]);
//   const [errors, setErrors] = useState({});

//   // fill data on update / clone
//   useEffect(() => {
//     if (currentTransport) {
//       setFormData({
//         ...currentTransport,
//         ...(formModel === "clone" && { nameAr: "", nameEn: "" }),
//       });
//       setImages(currentTransport.images || []);
//     } else {
//       resetForm();
//     }
//   }, [currentTransport, formModel]);

//   const resetForm = () => {
//     setFormData({ isActive: true });
//     setImages([]);
//     setErrors({});
//   };

//   // validation
//   const validate = () => {
//     const errs = {};
//     if (!formData.nameAr) errs.nameAr = "الاسم العربي مطلوب";
//     if (!formData.nameEn) errs.nameEn = "الاسم الإنجليزي مطلوب";
//     if (!formData.type) errs.type = "نوع النقل مطلوب";
//     setErrors(errs);
//     return Object.keys(errs).length === 0;
//   };

//   // submit
//   const handleSubmit = () => {
//     if (!validate()) return;

//     const fd = new FormData();
//     fd.append("data", JSON.stringify(formData));

//     images.forEach((img) => {
//       if (img instanceof File) fd.append("images", img);
//     });

//     onSave(fd);
//   };

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           {formModel === "update"
//             ? "تعديل النقل"
//             : formModel === "clone"
//             ? "استنساخ النقل"
//             : "إضافة نقل"}
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form>
//           <Row>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم عربي</Form.Label>
//                 <Form.Control
//                   value={formData.nameAr || ""}
//                   onChange={(e) =>
//                     setFormData({ ...formData, nameAr: e.target.value })
//                   }
//                   isInvalid={!!errors.nameAr}
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم إنجليزي</Form.Label>
//                 <Form.Control
//                   value={formData.nameEn || ""}
//                   onChange={(e) =>
//                     setFormData({ ...formData, nameEn: e.target.value })
//                   }
//                   isInvalid={!!errors.nameEn}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* باقي الحقول */}

//           <ImageUploader images={images} setImages={setImages} />
//         </Form>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>
//           إلغاء
//         </Button>
//         <Button onClick={handleSubmit}>
//           حفظ
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }
