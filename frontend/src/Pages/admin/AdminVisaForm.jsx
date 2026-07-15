// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { createVisa } from "../../redux/visas/visaSlice";
// import { Loader2, PlusCircle, Pointer } from "lucide-react";
// import { motion } from "framer-motion";
// import { Button } from "react-bootstrap";
// import { Link } from "react-router-dom";

// export default function AdminVisaForm() {
//   const dispatch = useDispatch();
  
//   const { visaTypes , loading} = useSelector((state) => state.visaType) || [];

//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     duration: "",
//     validity: "",
//     price: "",
//     isActive: true,
//   });

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!form.name || !form.price) return alert("يرجى إدخال جميع البيانات الأساسية");
//     dispatch(createVisa(form));
//     setForm({
//       name: "",
//       description: "",
//       duration: "",
//       validity: "",
//       price: "",
//       isActive: true,
//     });
//   };

//   return (
//     <>
//       <motion.div
//       className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100 mt-10"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//     >
//       <Link to="/adminVisaTypeList">
//        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//         <PlusCircle
//         cursor={Pointer}
//         className="w-6 h-6 text-blue-600" />
//         إنشاء نوع تأشيرة جديدة
//       </h2>
//       </Link>

//          <Link to="/adminVisaTypeList">
//        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//         <PlusCircle
//         cursor={Pointer}
//         className="w-6 h-6 text-blue-600" />
//         إنشاء خدمة تأشيرة جديدة
//       </h2>
//       </Link>
      

      
//     </motion.div>
//     </>
  
//   );
// }
