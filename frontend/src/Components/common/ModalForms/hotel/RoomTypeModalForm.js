// import React, { useEffect, useState } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import { useTranslation } from "react-i18next";
// import ImageUploader from "../../ImageUploader";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchHotels } from "../../../../redux/hotels/hotelSlice";

// export const RoomTypeModalForm = ({
//   show,
//   onHide,
//   title,
//   onSubmit,
//   initialData = null,
//   isEditing,
// }) => {
//   const { t, i18n } = useTranslation();
//   const lang = i18n.language || "ar";
//   const hotelslist = useSelector((state) => state.hotels?.hotelslist || {});
//   const dispatch = useDispatch();

//   // Fetch hotels only when the modal is opened to avoid unnecessary calls
//   useEffect(() => {
//     if (!show) return;
//     dispatch(fetchHotels());
//   }, [dispatch, show]);
//   console.log("hotellllllls", hotelslist);

//   const [uploadedImages, setUploadedImages] = useState({
//     newImages: [],
//     deletedOldImages: [],
//   });
//   const [imagePreview, setImagePreview] = useState(null);

//   const [formData, setFormData] = useState({
//     nameAr: "",
//     nameEn: "",
//     descriptionAr: "",
//     descriptionEn: "",
//     hotel: "",
//     capacity: { maxAdults: 2, maxChildren: 0, maxOccupancy: 2 },
//     size: "",
//     bedType: "double",
//     totalRooms: 1,
//     amenities: [],
//     pricing: {
//       basePrice: 0,
//       weekendPrice: 0,
//       currency: "SAR",
//       discountPercent: 0,
//     },
//     mealPlan: "room_only",
//     isActive: true,
//     // images: [],
//   });

//   // ✅ تعبئة عند التعديل (نفس فكرة التأشيرات)
//   useEffect(() => {
//     if (!show) return; // مهم جداً

//     if (initialData && typeof initialData === "object") {
//       setFormData({
//         nameAr: initialData.nameAr || "",
//         nameEn: initialData.nameEn || "",
//         descriptionAr: initialData.descriptionAr || "",
//         descriptionEn: initialData.descriptionEn || "",
//         hotel:
//           initialData.hotel && typeof initialData.hotel === "object"
//             ? initialData.hotel._id || ""
//             : initialData.hotel || "",
//         bedType: initialData.bedType || "double",
//         size: initialData.size || "",
//         totalRooms: initialData.totalRooms || 1,
//         capacity: initialData.capacity || {
//           maxAdults: 2,
//           maxChildren: 0,
//           maxOccupancy: 2,
//         },
//         amenities: initialData.amenities || [],
//         pricing: initialData.pricing || {
//           basePrice: 0,
//           weekendPrice: 0,
//           currency: "SAR",
//           discountPercent: 0,
//         },
//         mealPlan: initialData.mealPlan || "room_only",
//         isActive:
//           typeof initialData.isActive === "boolean"
//             ? initialData.isActive
//             : true,
//       });

//       setUploadedImages({
//         oldImages: initialData?.images || [],
//         newImages: [],
//         deletedOldImages: [],
//       });
//     } else {
//       setFormData({
//         nameAr: "",
//         nameEn: "",
//         descriptionAr: "",
//         descriptionEn: "",
//         hotel: "",
//         bedType: "double",
//         size: "",
//         totalRooms: 1,
//         capacity: { maxAdults: 2, maxChildren: 0, maxOccupancy: 2 },
//         pricing: {
//           basePrice: 0,
//           weekendPrice: 0,
//           currency: "SAR",
//           discountPercent: 0,
//         },
//         mealPlan: "room_only",
//         isActive: true,
//         amenities: [],
//       });

//       setUploadedImages({
//         oldImages: [],
//         newImages: [],
//         deletedOldImages: [],
//       });
//     }
//   }, [show, initialData]);

//   const handleChange = (field, value) => {
//     // const { name, value } = event.target;
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleNestedChange = (parent, child, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [parent]: {
//         ...prev[parent],
//         [child]: value,
//       },
//     }));
//   };
//   const handleImageChange = (data) => {
//     setUploadedImages(data);
//   };

//   const handleField = (path, value) => {
//     if (path.includes(".")) {
//       const [p, c] = path.split(".");
//       setFormData((prev) => ({
//         ...prev,
//         [p]: { ...prev[p], [c]: value },
//       }));
//     } else {
//       setFormData((prev) => ({ ...prev, [path]: value }));
//     }
//   };

//   const submit = async (e) => {
//     e.preventDefault();

//     const fd = new FormData();
//     // 1) صور جديدة
//     uploadedImages.newImages.forEach((file) => {
//       fd.append("images", file);
//     });
//     // 2) صور محذوفة من القديمة
//     uploadedImages.deletedOldImages.forEach((img) => {
//       fd.append("deleteImages[]", img);
//     });

//     // أرسل باقي البيانات كـ JSON في حقل واحد
//     // 3. باقي البيانات كـ JSON

//     const data = {
//       nameAr: formData.nameAr.trim(),
//       nameEn: formData.nameEn.trim(),

//       descriptionAr: (formData.descriptionAr || "").trim(),
//       descriptionEn: (formData.descriptionEn || "").trim(),

//       hotel: formData.hotel,

//       bedType: formData.bedType,
//       size: Number(formData.size) || 0,
//       totalRooms: Number(formData.totalRooms) || 1,

//       capacity: {
//         maxAdults: Number(formData.capacity.maxAdults) || 1,
//         maxChildren: Number(formData.capacity.maxChildren) || 0,
//         maxOccupancy: Number(formData.capacity.maxOccupancy) || 1,
//       },

//       amenities: formData.amenities || [],

//       pricing: {
//         basePrice: Number(formData.pricing.basePrice) || 0,
//         weekendPrice: Number(formData.pricing.weekendPrice) || 0,
//         currency: formData.pricing.currency || "SAR",
//         discountPercent: Number(formData.pricing.discountPercent) || 0,
//       },

//       mealPlan: formData.mealPlan,
//       isActive: Boolean(formData.isActive),
//     };

//     // 4) إرسال البيانات في متغير data فقط  في

//     fd.append("data", JSON.stringify(data));

//     try {
//       await onSubmit(fd, isEditing, initialData?._id);
//       onHide();
//     } catch (err) {
//       console.error("Error saving visa:", err);
//       // return;
//     }
//     console.log("datadata", data);
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     onSubmit(formData);
//   };

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           {isEditing
//             ? lang === "ar"
//               ? "تعديل نوع الغرفة"
//               : "Edit Room Type"
//             : lang === "ar"
//             ? "إضافة نوع غرفة"
//             : "Add Room Type"}
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form onSubmit={submit}>
//           {/* اختيار الفندق */}
//           <Form.Group className="mb-3">
//             <Form.Label>الفندق *</Form.Label>
//             <Form.Select
//               value={formData.hotel || ""}
//               onChange={(e) => handleChange("hotel", e.target.value)}
//               required
//             >
//               <option value="">-- اختر الفندق --</option>
//               {hotelslist.map((h) => (
//                 <option key={h._id} value={h._id}>
//                   {h.nameAr || h.nameEn}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group>

//           {/* الأسماء */}
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم بالعربية *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={formData.nameAr || ""}
//                   onChange={(e) => handleChange("nameAr", e.target.value)}
//                   placeholder="غرفة مزدوجة ديلوكس"
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم بالإنجليزية *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={formData.nameEn || ""}
//                   onChange={(e) => handleChange("nameEn", e.target.value)}
//                   placeholder="Deluxe Double Room"
//                   required
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* الوصف */}
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الوصف بالعربية</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={formData.descriptionAr || ""}
//                   onChange={(e) =>
//                     handleChange("descriptionAr", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الوصف بالإنجليزية</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={formData.descriptionEn || ""}
//                   onChange={(e) =>
//                     handleChange("descriptionEn", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* السعة */}

//           <Row className="mb-3">
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>عدد البالغين *</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="1"
//                   value={formData.capacity?.maxAdults || 2}
//                   onChange={(e) =>
//                     handleNestedChange(
//                       "capacity",
//                       "maxAdults",
//                       parseInt(e.target.value)
//                     )
//                   }
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>عدد الأطفال</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="0"
//                   value={formData.capacity?.maxChildren || 0}
//                   onChange={(e) =>
//                     handleNestedChange(
//                       "capacity",
//                       "maxChildren",
//                       parseInt(e.target.value)
//                     )
//                   }
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>إجمالي السعة *</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="1"
//                   value={formData.capacity?.maxOccupancy || 2}
//                   onChange={(e) =>
//                     handleNestedChange(
//                       "capacity",
//                       "maxOccupancy",
//                       parseInt(e.target.value)
//                     )
//                   }
//                   required
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* المساحة ونوع السرير */}
//           <Row className="mb-3">
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>المساحة (م²)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="10"
//                   value={formData.size || ""}
//                   onChange={(e) =>
//                     handleChange("size", parseInt(e.target.value))
//                   }
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>نوع السرير</Form.Label>
//                 <Form.Select
//                   value={formData.bedType || "double"}
//                   onChange={(e) => handleChange("bedType", e.target.value)}
//                 >
//                   <option value="single">سرير مفرد</option>
//                   <option value="twin">سريران منفصلان</option>
//                   <option value="double">سرير مزدوج</option>
//                   <option value="queen">Queen</option>
//                   <option value="king">King</option>
//                   <option value="suite">جناح</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//               <Form.Group>
//                 <Form.Label>عدد الغرف *</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="1"
//                   value={formData.totalRooms || 1}
//                   onChange={(e) =>
//                     handleChange("totalRooms", parseInt(e.target.value))
//                   }
//                   required
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* السعر */}
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>السعر الأساسي *</Form.Label>
//                 <InputGroup>
//                   <Form.Control
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     value={formData.pricing?.basePrice || ""}
//                     onChange={(e) =>
//                       handleNestedChange(
//                         "pricing",
//                         "basePrice",
//                         parseFloat(e.target.value)
//                       )
//                     }
//                     required
//                   />
//                   <InputGroup.Text>ريال</InputGroup.Text>
//                 </InputGroup>
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>سعر نهاية الأسبوع</Form.Label>
//                 <InputGroup>
//                   <Form.Control
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     value={formData.pricing?.weekendPrice || ""}
//                     onChange={(e) =>
//                       handleNestedChange(
//                         "pricing",
//                         "weekendPrice",
//                         parseFloat(e.target.value)
//                       )
//                     }
//                   />
//                   <InputGroup.Text>ريال</InputGroup.Text>
//                 </InputGroup>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>العملة</Form.Label>
//                 <Form.Select
//                   value={formData.pricing?.currency || "SAR"}
//                   onChange={(e) =>
//                     handleNestedChange("pricing", "currency", e.target.value)
//                   }
//                 >
//                   <option value="SAR">ريال سعودي</option>
//                   <option value="USD">دولار أمريكي</option>
//                   <option value="EUR">يورو</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>نسبة الخصم (%)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min="0"
//                   max="100"
//                   value={formData.pricing?.discountPercent || 0}
//                   onChange={(e) =>
//                     handleNestedChange(
//                       "pricing",
//                       "discountPercent",
//                       parseFloat(e.target.value)
//                     )
//                   }
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* نظام الوجبات */}
//           <Form.Group className="mb-3">
//             <Form.Label>نظام الوجبات</Form.Label>
//             <Form.Select
//               value={formData.mealPlan || "room_only"}
//               onChange={(e) => handleChange("mealPlan", e.target.value)}
//             >
//               <option value="room_only">غرفة فقط</option>
//               <option value="breakfast">إفطار</option>
//               <option value="half_board">نصف إقامة</option>
//               <option value="full_board">إقامة كاملة</option>
//               <option value="all_inclusive">الكل شامل</option>
//             </Form.Select>
//           </Form.Group>
//           {/* الحالة */}
//           <Form.Group className="mb-3">
//             <Form.Check
//               type="checkbox"
//               label="نشط"
//               checked={formData.isActive !== false}
//               onChange={(e) => handleChange("isActive", e.target.checked)}
//             />
//           </Form.Group>

//           {/* === ImageUploader الجديد === */}
//           <Col md={12}>
//             <ImageUploader
//               initialImages={initialData?.images}
//               onChange={handleImageChange}
//               multiple
//               maxImages={10}
//               label={lang === "ar" ? "صور  (متعددة)" : "Room Images (Multiple)"}
//             />
//           </Col>

//           <div className="d-flex justify-content-end mt-4">
//             <Button variant="secondary" onClick={onHide} className="me-2">
//               {lang === "ar" ? "إلغاء" : "Cancel"}
//             </Button>
//             <Button type="submit" variant="primary">
//               {lang === "ar" ? "حفظ" : "Save"}
//             </Button>
//           </div>
//         </Form>
//       </Modal.Body>
//     </Modal>
//   );
// };
