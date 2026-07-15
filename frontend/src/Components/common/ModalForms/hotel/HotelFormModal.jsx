// import React, { useState, useEffect, useCallback } from "react";
// import { Modal, Button, Form, Row, Col } from "react-bootstrap";
// import { useSelector, useDispatch } from "react-redux";
// import { fetchVisaTypes } from "../../../../redux/visas/visaTypeSlice"; // assuming exists
// import ImageUploader from "../../ImageUploader";
// import { useTranslation } from "react-i18next";
// import { fetchRoomTypes } from "../../../../redux/hotels/roomtypeSlice";
// import { on } from "events";
// // import { log } from "node:console";

// export default function HotelFormModal({
//   show,
//   onClose,
//   onSubmit,
//   initialData = {},
//   // isEditing,
//   mode, // create | edit | clone
// }) {
//   const { t, i18n } = useTranslation();
//   const lang = i18n.language || "ar";
//   const [uploadedImages, setUploadedImages] = useState({
//     oldImages: [],
//     newImages: [],
//     deletedOldImages: [],
//   });
//   const [uploadedAttachments, setUploadedAttachments] = useState({
//     existingAttachments: [],
//     newAttachments: [],
//     deletedAttachments: [],
//   });
//   //const isEditing = mode === "edit" || mode === "clone";

//   const dispatch = useDispatch();

//   const roomTypes = useSelector((state) => state.roomTypes?.roomTypes || []);
//   useEffect(() => {
//     if (show) {
//       dispatch(fetchRoomTypes());
//     }
//   }, [dispatch, show]);
//   //console.log("roomTypes in HotelFormModal:", roomTypes);

//   useEffect(() => {
//     if (!Array.isArray(roomTypes)) {
//       console.warn("HotelFormModal: roomTypes is not an array", roomTypes);
//     }
//   }, [roomTypes]);
//   const [formData, setFormData] = useState({
//     nameAr: "",
//     nameEn: "",
//     descriptionAr: "",
//     descriptionEn: "",
//     stars: 3,
//     location: {
//       country: { ar: "السعودية", en: "Saudi Arabia" },
//       city: { ar: "مكة المكرمة", en: "Makkah" },
//       area: "",
//       address: { ar: "", en: "" },
//       coordinates: { lat: "24.7136° N", lng: "46.6753° E" },
//       googleMapsLink: "",
//     },
//     contact: {
//       phone: [""],
//       email: [""],
//       website: [""],
//       whatsapp: [""],
//     },
//     // images: []
//     facilities: "0",
//     roomTypes: [],
//     policies: {
//       checkIn: "14:00", // "14:00"
//       checkOut: "12:00", // "12:00"
//       cancellationDays: 0, // عدد الأيام المسموح فيها إلغاء مجاني
//       childPolicy: "0-5 سنوات مجانا",
//       petPolicy: "مسموح بالحيوانات الاليفة",
//     },
//     isActive: true,
//     isFeatured: false,
//     rankingScore: 0,

//     // totalBookings: 0,
//     // reviewCount: 0,
//     // reviewScore: 0,
//   });
//   useEffect(() => {
//     if (!show) {
//       // عند إغلاق المودال → إعادة تعيين
//       setFormData({
//         nameAr: "",
//         nameEn: "",
//         descriptionAr: "",
//         descriptionEn: "",
//         stars: 3,
//         location: {
//           country: { ar: "السعودية", en: "Saudi Arabia" },
//           city: { ar: "مكة المكرمة", en: "Makkah" },
//           area: "",
//           address: { ar: "", en: "" },
//           coordinates: { lat: "24.7136° N", lng: "46.6753° E" },
//           googleMapsLink: "",
//         },
//         contact: {
//           phone: [""],
//           email: [""],
//           website: [""],
//           whatsapp: [""],
//         },
//         // images: []
//         facilities: "0",
//         roomTypes: [],
//         policies: {
//           checkIn: "14:00", // "14:00"
//           checkOut: "12:00", // "12:00"
//           cancellationDays: 0, // عدد الأيام المسموح فيها إلغاء مجاني
//           childPolicy: "0-5 سنوات مجانا",
//           petPolicy: "مسموح بالحيوانات الاليفة",
//         },
//         isActive: true,
//         isFeatured: false,
//         rankingScore: 0,
//       });
//       setUploadedImages({
//         oldImages: [],
//         newImages: [],
//         deletedOldImages: [],
//       });
//       return;
//     }

//     // if (!show) return;
//     if (initialData && Object.keys(initialData).length > 0) {
//       setFormData({
//         nameAr: initialData.nameAr || "",
//         nameEn: initialData.nameEn || "",
//         descriptionAr: initialData.descriptionAr || "",
//         descriptionEn: initialData.descriptionEn || "",
//         stars: initialData.stars || 3,
//         location: {
//           country: {
//             ar: initialData.location.country.ar || "",
//             en: initialData.location.country.en || "",
//           },
//           city: {
//             ar: initialData.location.city.ar || "",
//             en: initialData.location.city.en || "",
//           },
//           area: initialData.location.area || "",
//           address: {
//             ar: initialData.location.address.ar || "",
//             en: initialData.location.address.en || "",
//           },
//           coordinates: {
//             lat: initialData.location.coordinates.lat || "",
//             lng: initialData.location.coordinates.lng || "",
//           },
//           googleMapsLink: initialData.location.googleMapsLink || "",
//         },
//         contact: {
//           phone: Array.isArray(initialData.contact?.phone)
//             ? [...initialData.contact.phone]
//             : initialData.contact?.phone
//               ? [initialData.contact.phone]
//               : [""],
//           email: initialData.contact?.email
//             ? Array.isArray(initialData.contact.email)
//               ? [...initialData.contact.email]
//               : [initialData.contact.email]
//             : [""],
//           website: initialData.contact?.website
//             ? Array.isArray(initialData.contact.website)
//               ? [...initialData.contact.website]
//               : [initialData.contact.website]
//             : [""],
//           whatsapp: initialData.contact?.whatsapp
//             ? Array.isArray(initialData.contact.whatsapp)
//               ? [...initialData.contact.whatsapp]
//               : [initialData.contact.whatsapp]
//             : [""],
//         },
//         facilities: Array.isArray(initialData.facilities)
//           ? [...initialData.facilities]
//           : [],
//         roomTypes: Array.isArray(initialData.roomTypes)
//           ? [...initialData.roomTypes]
//           : [],
//         policies: {
//           checkIn:
//             initialData.policies &&
//             typeof initialData.policies.checkIn === "string"
//               ? initialData.policies.checkIn
//               : "",
//           checkOut:
//             initialData.policies &&
//             typeof initialData.policies.checkOut === "string"
//               ? initialData.policies.checkOut
//               : "",
//           cancellationDays:
//             initialData.policies &&
//             typeof initialData.policies.cancellationDays === "number"
//               ? initialData.policies.cancellationDays
//               : 0,
//           childPolicy:
//             initialData.policies &&
//             typeof initialData.policies.childPolicy === "string"
//               ? initialData.policies.childPolicy
//               : "",
//           petPolicy:
//             initialData.policies &&
//             typeof initialData.policies.petPolicy === "string"
//               ? initialData.policies.petPolicy
//               : "",
//         },
//         isActive:
//           typeof initialData.isActive === "boolean"
//             ? initialData.isActive
//             : true,
//         isFeatured:
//           typeof initialData.isFeatured === "boolean"
//             ? initialData.isFeatured
//             : false,
//         rankingScore:
//           typeof initialData.rankingScore === "number"
//             ? initialData.rankingScore
//             : 0,
//       });
//       setUploadedImages({
//         oldImages: initialData?.images || [],
//         newImages: [],
//         deletedOldImages: [],
//       });
//       setUploadedAttachments({
//         existingAttachments: initialData?.attachments || [],
//         newAttachments: [],
//         deletedAttachments: [],
//       });
//     } else {
//       setFormData({
//         nameAr: "",
//         nameEn: "",
//         descriptionAr: "",
//         descriptionEn: "",
//         stars: 3,
//         location: {
//           country: { ar: "السعودية", en: "Saudi Arabia" },
//           city: { ar: "مكة المكرمة", en: "Makkah" },
//           area: "",
//           address: { ar: "", en: "" },
//           coordinates: { lat: "24.7136° N", lng: "46.6753° E" },
//           googleMapsLink: "",
//         },
//         contact: {
//           phone: [""],
//           email: [""],
//           website: [""],
//           whatsapp: [""],
//         },

//         facilities: "",
//         roomTypes: [],
//         policies: {
//           checkIn: "12:00", // "14:00"
//           checkOut: "02:00", // "12:00"
//           cancellationDays: 0, // عدد الأيام المسموح فيها إلغاء مجاني
//           childPolicy: "",
//           petPolicy: "",
//         },
//         isActive: true,
//         isFeatured: false,
//         rankingScore: 0,
//       });
//       setUploadedImages({
//         oldImages: [],
//         newImages: [],
//         deletedOldImages: [],
//       });
//     }
//   }, [initialData, show]);

//   const handleChange = (key, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [key]: value,
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
//     setUploadedImages({
//       oldImages: data.oldImages || [],
//       newImages: data.newImages || [],
//       deletedOldImages: data.deletedOldImages || [],
//     });
//   };

//   const handleOnSubmit = async (e) => {
//     e.preventDefault();

//     const fd = new FormData();

//     // 3) بيانات النموذج كـ JSON string
//     const data = {
//       nameAr: formData.nameAr?.trim() || "",
//       nameEn: formData.nameEn?.trim() || "",

//       descriptionAr: formData.descriptionAr?.trim() || "",
//       descriptionEn: formData.descriptionEn?.trim() || "",

//       stars: Number(formData.stars),

//       hotelType: formData.hotelType || "hotel",

//       location: {
//         country: {
//           ar: formData.location.country.ar?.trim() || "",
//           en: formData.location.country.en?.trim() || "",
//           code: formData.location.country.code || "SA",
//         },
//         city: {
//           ar: formData.location.city.ar?.trim() || "",
//           en: formData.location.city.en?.trim() || "",
//         },
//         area: formData.location.area?.trim() || "",
//         address: {
//           ar: formData.location.address.ar?.trim() || "",
//           en: formData.location.address.en?.trim() || "",
//         },
//         coordinates: {
//           lat: Number(formData.location.coordinates.lat),
//           lng: Number(formData.location.coordinates.lng),
//         },
//         googleMapsLink: formData.location.googleMapsLink?.trim() || "",
//       },

//       contact: {
//         phone: Array.isArray(formData.contact.phone)
//           ? formData.contact.phone.filter(Boolean)
//           : [],
//         email: Array.isArray(formData.contact.email)
//           ? (formData.contact.email[0] || "").trim()
//           : (formData.contact.email || "").trim(),
//         website: Array.isArray(formData.contact.website)
//           ? (formData.contact.website[0] || "").trim()
//           : (formData.contact.website || "").trim(),
//         whatsapp: Array.isArray(formData.contact.whatsapp)
//           ? (formData.contact.whatsapp[0] || "").trim()
//           : (formData.contact.whatsapp || "").trim(),
//       },

//       roomTypes: Array.isArray(formData.roomTypes)
//         ? formData.roomTypes.map((rt) =>
//             rt && typeof rt === "object" ? rt._id || rt : rt,
//           )
//         : [],

//       facilities: Array.isArray(formData.facilities)
//         ? formData.facilities.map((f) =>
//             f && typeof f === "object" ? f._id || f : f,
//           )
//         : [],

//       policies: {
//         checkIn: formData.policies.checkIn || "",
//         checkOut: formData.policies.checkOut || "",
//         cancellationDays: Number(formData.policies.cancellationDays || 0),
//         childPolicy: formData.policies.childPolicy || "",
//         petPolicy: formData.policies.petPolicy || "",
//       },

//       isActive: Boolean(formData.isActive),
//       isFeatured: Boolean(formData.isFeatured),
//       rankingScore: Number(formData.rankingScore || 0),
//     };
//     // 1) صور جديدة

//     // 1️⃣ الصور الجديدة
//     // تحديد ما إذا كنا في وضع إنشاء/نسخ أم تعديل
//     const isCreatedMode = mode !== "edit";
//     if (isCreatedMode) {
//       // في النسخ أو الإنشاء: نرسل كل الصور (القديمة الباقية + الجديدة)
//       // الصور القديمة الباقية = oldImages ما عدا المحذوفة
//       const remainingOldImages = uploadedImages.oldImages.map((img) =>
//         typeof img === "string" ? img : img.url,
//       );

//       data.existingImages = remainingOldImages;

//       // ثم نضيف الصور الجديدة كالمعتاد
//       data.existingImages = remainingOldImages;

//       //fd.append("data", JSON.stringify(data));

//       // 2️⃣ الصور الجديدة (File)
//       uploadedImages.newImages.forEach((file) => {
//         fd.append("images", file);
//       });
//     }

//     fd.append("data", JSON.stringify(data));
//     // 2️⃣ صور للحذف (مسارات الصور القديمة المحذوفة)
//     uploadedImages.deletedOldImages.forEach((img) => {
//       fd.append("deleteImages[]", img);
//     });
//     try {
//       const success = await onSubmit(fd, initialData?._id);
//       //   onClose();
//       if (success) {
//         onClose();
//       }
//     } catch (error) {
//       console.error("Error submitting form:", error);
//     }
//   };

//   return (
//     <Modal show={show} onHide={onClose} size="lg" centered backdrop="static">
//       <Modal.Header closeButton>
//         <Modal.Title>
//           {mode === "edit"
//             ? lang === "ar"
//               ? "تعديل  الفندق"
//               : "Edit Hotel"
//             : mode === "clone"
//               ? lang === "ar"
//                 ? "استنساخ  الفندق"
//                 : "Clone Hotel"
//               : lang === "ar"
//                 ? "إضافة  فندق جديد "
//                 : "Add a New Hotel"}
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form onSubmit={handleOnSubmit}>
//           {/* ==================== Basic Info ==================== */}
//           <Row className="mb-4">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم بالعربية *</Form.Label>
//                 <Form.Control
//                   value={formData.nameAr}
//                   onChange={(e) => handleChange("nameAr", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الاسم بالإنجليزية *</Form.Label>
//                 <Form.Control
//                   value={formData.nameEn}
//                   onChange={(e) => handleChange("nameEn", e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row className="mb-4">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>الوصف بالعربية</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={formData.descriptionAr}
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
//                   value={formData.descriptionEn}
//                   onChange={(e) =>
//                     handleChange("descriptionEn", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* stars */}
//           {/* ==================== Classification ==================== */}
//           <Row className="mb-4">
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>عدد النجوم *</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min={1}
//                   max={5}
//                   value={formData.stars}
//                   onChange={(e) =>
//                     handleChange("stars", Number(e.target.value))
//                   }
//                   required
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>نوع الفندق *</Form.Label>
//                 <Form.Select
//                   value={formData.hotelType}
//                   onChange={(e) => handleChange("hotelType", e.target.value)}
//                   required
//                 >
//                   <option value="hotel">Hotel</option>
//                   <option value="resort">Resort</option>
//                   <option value="apartment">Apartment</option>
//                   <option value="hostel">Hostel</option>
//                   <option value="villa">Villa</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* الموقع الجغرافي */}

//           {/* ==================== Location ==================== */}
//           <Row className="mb-4">
//             <Col md={6}>
//               <Form.Label>الدولة (عربي)</Form.Label>
//               <Form.Control
//                 value={formData.location.country.ar}
//                 onChange={(e) =>
//                   handleNestedChange("location", "country", {
//                     ...formData.location.country,
//                     ar: e.target.value,
//                   })
//                 }
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Label>الدولة (English)</Form.Label>
//               <Form.Control
//                 value={formData.location.country.en}
//                 onChange={(e) =>
//                   handleNestedChange("location", "country", {
//                     ...formData.location.country,
//                     en: e.target.value,
//                   })
//                 }
//               />
//             </Col>
//           </Row>

//           <Row className="mb-4">
//             <Col md={6}>
//               <Form.Label>المدينة (عربي)</Form.Label>
//               <Form.Control
//                 value={formData.location.city.ar}
//                 onChange={(e) =>
//                   handleNestedChange("location", "city", {
//                     ...formData.location.city,
//                     ar: e.target.value,
//                   })
//                 }
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Label>المدينة (English)</Form.Label>
//               <Form.Control
//                 value={formData.location.city.en}
//                 onChange={(e) =>
//                   handleNestedChange("location", "city", {
//                     ...formData.location.city,
//                     en: e.target.value,
//                   })
//                 }
//               />
//             </Col>
//           </Row>

//           <Row className="mb-4">
//             <Col md={6}>
//               <Form.Control
//                 type="number"
//                 placeholder="Latitude"
//                 value={formData.location.coordinates.lat}
//                 onChange={(e) =>
//                   handleNestedChange("location", "coordinates", {
//                     ...formData.location.coordinates,
//                     lat: Number(e.target.value),
//                   })
//                 }
//               />
//             </Col>

//             <Col md={6}>
//               <Form.Control
//                 type="number"
//                 placeholder="Longitude"
//                 value={formData.location.coordinates.lng}
//                 onChange={(e) =>
//                   handleNestedChange("location", "coordinates", {
//                     ...formData.location.coordinates,
//                     lng: Number(e.target.value),
//                   })
//                 }
//               />
//             </Col>
//           </Row>
//           {/* ==================== Contact ==================== */}
//           <Row className="mb-4">
//             {["phone", "email", "website", "whatsapp"].map((field) => (
//               <Col md={3} key={field}>
//                 <Form.Control
//                   placeholder={field}
//                   value={formData.contact[field][0] || ""}
//                   onChange={(e) => {
//                     const arr = [...formData.contact[field]];
//                     arr[0] = e.target.value;
//                     handleNestedChange("contact", field, arr);
//                   }}
//                 />
//               </Col>
//             ))}
//           </Row>

//           {/* أنواع الغرف */}

//           {/* ==================== Room Types ==================== */}
//           {/* <Form.Group className="mb-3">
//             <Form.Label>أنواع الغرف</Form.Label>
//             <Form.Select
//               value={formData.roomTypes}
//               onChange={(e) => handleChange("roomTypes", [e.target.value])}
//             >
//               <option value="">اختر نوع الغرفة</option>
//               {(Array.isArray(roomTypes) ? roomTypes : []).map((rt) => (
//                 <option key={rt._id} value={rt._id}>
//                   {lang === "ar" ? rt.nameAr : rt.nameEn}
//                 </option>
//               ))}
//             </Form.Select>
//           </Form.Group> */}

//           {/* ==================== Policies ==================== */}
//           <Row className="mb-4">
//             {Object.keys(formData.policies).map((key) => (
//               <Col md={3} key={key}>
//                 <Form.Control
//                   placeholder={key}
//                   value={formData.policies[key]}
//                   onChange={(e) =>
//                     handleNestedChange("policies", key, e.target.value)
//                   }
//                 />
//               </Col>
//             ))}
//           </Row>

//           {/* حالة الفندق */}
//           <Form.Check
//             label="نشط"
//             checked={formData.isActive}
//             onChange={(e) => handleChange("isActive", e.target.checked)}
//           />

//           <ImageUploader
//             initialImages={initialData?.images || []}
//             onChange={handleImageChange}
//             maxImages={10}
//           />

//           <Modal.Footer>
//             <Button variant="secondary" onClick={onClose}>
//               {lang === "ar" ? "إلغاء" : "Cancel"}
//             </Button>
//             <Button variant="primary" type="submit">
//               {mode === "edit"
//                 ? lang === "ar"
//                   ? "حفظ التعديلات"
//                   : "Save Changes"
//                 : lang === "ar"
//                   ? "إنشاء فندق جديد"
//                   : "Create Hotel"}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal.Body>
//     </Modal>
//   );
// }
