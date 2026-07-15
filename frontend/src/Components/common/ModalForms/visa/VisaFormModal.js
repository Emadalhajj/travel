// // src/components/VisaFormModal.jsx
// import React, { useState, useEffect, useCallback } from "react";
// import { Modal, Button, Form, Row, Col } from "react-bootstrap";
// import { useSelector, useDispatch } from "react-redux";
// import { fetchVisaTypes } from "../../../../redux/visas/visaTypeSlice"; // assuming exists
// import ImageUploader from "../../ImageUploader";

// export default function VisaFormModal({
//   show,
//   onHide,
//   onSave, // async function(formData, isEditing, existingId) => Promise
//   initialData = null, // null for add, or visa object for edit
//   isEditing,
// }) {
//   const dispatch = useDispatch();
//   const { visaTypes = [] } = useSelector((s) => s.visaTypes || {});
//   const lang = useSelector((state) => state.language?.lang || "ar");
//   // حالة الصور (جديدة + محذوفة من القديمة)
//   const [uploadedImages, setUploadedImages] = useState({
//     newImages: [],
//     deletedOldImages: [],
//   });
//   const [imagePreview, setImagePreview] = useState(null);
//   // local state structure matches your backend schema
//   const [form, setForm] = useState({
//     name: { ar: "", en: "" },
//     description: { ar: "", en: "" },
//     duration: "",
//     validity: "",
//     price: "",
//     visaType: "", // ObjectId
//     country: { ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
//     isActive: true,

//     // imageFile: null,
//   });

//   // تعبئة النموذج عند التعديل
//   useEffect(() => {
//     if (initialData) {
//       setForm({
//         name: {
//           ar: initialData.name?.ar || "",
//           en: initialData.name?.en || "",
//         },
//         description: {
//           ar: initialData.description?.ar || "",
//           en: initialData.description?.en || "",
//         },
//         duration: initialData.duration || "",
//         validity: initialData.validity || "",
//         price: initialData.price || "",
//         visaType: initialData.visaType?._id || initialData.visaType || "",
//         country: {
//           ar: initialData?.country?.ar || "المملكة العربية السعودية",
//           en: initialData?.country?.en || "Saudi Arabia",
//         },
//         isActive:
//           typeof initialData.isActive === "boolean"
//             ? initialData.isActive
//             : true,
//         // imageFile: null,
//       });
//       // إعادة تعيين الصور
//       setUploadedImages({
//         newImages: [],
//         deletedOldImages: [],
//       });
//     } else {
//       setForm((f) => ({
//         name: { ar: "", en: "" },
//         description: { ar: "", en: "" },
//         duration: "",
//         validity: "",
//         price: "",
//         visaType: "",
//         country: { ar: "المملكة العربية السعودية", en: "Saudi Arabia" },

//         isActive: true,
//       }));
//       setUploadedImages({ newImages: [], deletedOldImages: [] });
//     }
//   }, [initialData, show]);

//   useEffect(() => {
//     // ensure visa types loaded for select
//     dispatch(fetchVisaTypes());
//   }, [dispatch]);

//   const handleField = (path, value) => {
//     if (path.includes(".")) {
//       const [parent, child] = path.split(".");
//       setForm((prev) => ({
//         ...prev,
//         [parent]: { ...prev[parent], [child]: value },
//       }));
//     } else {
//       setForm((prev) => ({ ...prev, [path]: value }));
//     }
//   };

//   // واكتب هذا فقط:
//   const handleImageChange = (data) => {
//     setUploadedImages(data);
//     // أضف المعاينة
//     if (data.newImages.length > 0) {
//       const previews = data.newImages.map((file) => URL.createObjectURL(file));
//       setImagePreview(previews);
//     }
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     const fd = new FormData();

//     // أضف الملف أولًا
//     // if (form.imageFile) {
//     //   fd.append("image", form.imageFile);
//     // }
//     // 1. إضافة الصور الجديدة
//     uploadedImages.newImages.forEach((file) => {
//       fd.append("images", file); // اسم الحقل يجب أن يكون "images"
//     });

//     // 2. إخبار الـ Backend بحذف الصور القديمة
//     uploadedImages.deletedOldImages.forEach((path) => {
//       fd.append("deleteImages[]", path);
//     });

//     // أرسل باقي البيانات كـ JSON في حقل واحد
//     // 3. باقي البيانات كـ JSON
//     const data = {
//       name: {
//         ar: (form.name.ar || "").trim(),
//         en: (form.name.en || "").trim(),
//       },
//       description: {
//         ar: (form.description.ar || "").trim(),
//         en: (form.description.en || "").trim(),
//       },
//       duration: (form.duration || "").trim(),
//       validity: (form.validity || "").trim(),
//       price: Number(form.price) || 0,
//       visaType: form.visaType,
//       country: {
//         ar: (form.country.ar || "المملكة العربية السعودية").trim(),
//         en: (form.country.en || "Saudi Arabia").trim(),
//       },
//       isActive: Boolean(form.isActive),
//     };

//     fd.append("data", JSON.stringify(data));

//     try {
//       await onSave(fd, isEditing, initialData?._id);
//       onHide();
//     } catch (err) {
//       console.error("Error saving visa:", err);
//       return;
//     }
//     console.log("datadata", data);
//   };

//   return (
//     <Modal show={show} onHide={onHide} centered size="xl">
//       <Modal.Header closeButton>
//         <Modal.Title>
//           {isEditing
//             ? lang === "ar"
//               ? "تعديل التأشيرة"
//               : "Edit Visa"
//             : lang === "ar"
//             ? "إضافة تأشيرة جديدة"
//             : "Add New Visa"}
//         </Modal.Title>
//       </Modal.Header>

//       <Form onSubmit={submit}>
//         <Modal.Body>
//           <Row className="g-4">
//             {/* === الحقول العادية === */}
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم (عربي)</Form.Label>
//                 <Form.Control
//                   value={form.name.ar}
//                   onChange={(e) => handleField("name.ar", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Name (English)</Form.Label>
//                 <Form.Control
//                   value={form.name.en}
//                   onChange={(e) => handleField("name.en", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الوصف (عربي)</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={form.description.ar}
//                   onChange={(e) =>
//                     handleField("description.ar", e.target.value)
//                   }
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Description (English)</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={form.description.en}
//                   onChange={(e) =>
//                     handleField("description.en", e.target.value)
//                   }
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>المدة (مثال: 30 يوم)</Form.Label>
//                 <Form.Control
//                   value={form.duration}
//                   onChange={(e) => handleField("duration", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>الصلاحية (مثال: 90 يوم)</Form.Label>
//                 <Form.Control
//                   value={form.validity}
//                   onChange={(e) => handleField("validity", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>السعر (ريال)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.price}
//                   onChange={(e) => handleField("price", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الدولة (عربي)</Form.Label>
//                 <Form.Control
//                   value={form.country.ar}
//                   onChange={(e) => handleField("country.ar", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Country (English)</Form.Label>
//                 <Form.Control
//                   value={form.country.en}
//                   onChange={(e) => handleField("country.en", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>نوع التأشيرة</Form.Label>
//                 <Form.Select
//                   value={form.visaType}
//                   onChange={(e) => handleField("visaType", e.target.value)}
//                   required
//                 >
//                   <option value="">
//                     {lang === "ar" ? "اختر النوع" : "Select Type"}
//                   </option>
//                   {visaTypes.map((vt) => (
//                     <option key={vt._id} value={vt._id}>
//                       {lang === "ar" ? vt.nameAr : vt.nameEn}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Check
//                   type="switch"
//                   label={lang === "ar" ? "نشط" : "Active"}
//                   checked={form.isActive}
//                   onChange={(e) => handleField("isActive", e.target.checked)}
//                 />
//               </Form.Group>
//             </Col>

//             {/* === ImageUploader الجديد === */}
//             <Col md={12}>
//               <ImageUploader
//                 initialImages={initialData?.images || []}
//                 onChange={handleImageChange}
//                 multiple={true}
//                 maxImages={10}
//                 label={
//                   lang === "ar"
//                     ? "صور التأشيرة (متعددة)"
//                     : "Visa Images (Multiple)"
//                 }
//               />
//               {/* {imagePreview.length > 0 && (
//                 <div className="mt-3 d-flex flex-wrap gap-3">
//                   {imagePreview.map((src, idx) => (
//                     <img
//                       key={idx}
//                       src={src}
//                       className="img-thumbnail"
//                       style={{ maxHeight: 160 }}
//                     />
//                   ))}
//                 </div>
//               )} */}
//             </Col>
//           </Row>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="secondary" onClick={onHide}>
//             {lang === "ar" ? "إلغاء" : "Cancel"}
//           </Button>
//           <Button variant="primary" type="submit">
//             {isEditing
//               ? lang === "ar"
//                 ? "حفظ التعديلات"
//                 : "Save Changes"
//               : lang === "ar"
//               ? "إنشاء التأشيرة"
//               : "Create Visa"}
//           </Button>
//         </Modal.Footer>
//       </Form>
//     </Modal>
//   );
// }
