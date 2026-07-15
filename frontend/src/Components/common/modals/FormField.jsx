//     //  ├── FormField.jsx        ✅ حقل واحد (input / select)
// import { Modal, Button, Form, Row, Col } from "react-bootstrap";

// export default function FormField({ field, value, onChange, lang }) {

//   const label = lang === "ar" ? field.labelAr : field.labelEn;

//   if (field.type === "select") {
//     return (
//       <Form.Group className="mb-3">
//         <Form.Label>{label}</Form.Label>
//         <Form.Select
//           value={value || ""}
//           onChange={(e) => onChange(field.name, e.target.value)}
//         >
//           <option value="">---</option>
//           {field.options.map((opt) => (
//             <option key={opt.value} value={opt.value}>
//               {lang === "ar" ? opt.labelAr : opt.labelEn}
//             </option>
//           ))}
//         </Form.Select>
//       </Form.Group>
//     );
//   }

//   return (
//     <Form.Group className="mb-3">
//       <Form.Label>{label}</Form.Label>
//       <Form.Control
//         type={field.type}
//         value={value || ""}
//         onChange={(e) => onChange(field.name, e.target.value)}
//       />
//     </Form.Group>
//   );
// }
