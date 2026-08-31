import React from "react";
import { Table } from "react-bootstrap";
import { motion } from "framer-motion";

export default function UniversalTable({
  columns = [],
  data = [],
  emptyMessage = "No data",
  lang = "ar",
}) {
  const visibleColumns = columns.filter((col) => !col.hidden);

  const getValue = (row, accessor) => {
    if (!accessor) return null;

    if (Array.isArray(accessor)) {
      const key = lang === "ar" ? accessor[0] : accessor[1];
      return key.split(".").reduce((obj, k) => obj?.[k], row) ?? "";
    }

    if (typeof accessor === "string") {
      return accessor.split(".").reduce((obj, k) => obj?.[k], row) ?? "";
    }

    return null;
  };

  return (
    <Table hover responsive className="mb-0 align-middle">
      <thead
        className="text-white"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <tr>
          {visibleColumns.map((col, idx) => (
            <th
              key={idx}
              className="text-center align-middle"
              style={{ width: col.width }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={visibleColumns.length}
              className="text-center  py-5 text-muted"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, rowIndex) => (
            <motion.tr
              key={row._id || rowIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {visibleColumns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    width: col.width,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    // whiteSpace: col.wrap ? 'normal' : 'nowrap',
                    textAlign: col.align || "center", // ← ✅ افتراضي: توسيط
                    verticalAlign: "middle", // ← ✅ توسيط رأسي
                  }}
                >
                  {col.render
                    ? col.render(row, rowIndex, lang)
                    : (getValue(row, col.accessor) ?? "—")}
                </td>
              ))}
            </motion.tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

// export default function UniversalTable({
//   columns = [],
//   data = [],
//   emptyMessage = "No data",
//     lang = "ar", // ← جديد: اللغة الحالية

// }) {
//     // دالة مساعدة للحصول على القيمة المعربة
//   const getLocalizedValue = (row, field) => {
//     if (!field) return "";

//     // إذا كان accessor مصفوفة [nameAr, nameEn]
//     if (Array.isArray(field)) {
//       const key = lang === "ar" ? field[0] : field[1];
//       return row[key] ?? "";
//     }

//     // إذا كان accessor نص عادي
//     return row[field] ?? "";
//   };

//   return (

//     <Table hover responsive className="mb-0 align-middle">
//       <thead
//         className="text-white"
//         style={{
//           background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//         }}
//       >
//         <tr>
//           {columns.map((col, idx) => (
//             <th
//               key={idx}
//               className={col.align === "center" ? "text-center" : ""}
//             >
//               {col.header}
//             </th>
//           ))}
//         </tr>
//       </thead>

//       <tbody>
//         {data.length === 0 ? (
//           <tr>
//             <td colSpan={columns.length} className="text-center py-5 text-muted">
//               {emptyMessage}
//             </td>
//           </tr>
//         ) : (
//           data.map((row, rowIndex) => (
//             <motion.tr
//               key={row._id || rowIndex}
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//             >
//               {columns.map((col, colIndex) => (
//                 <td
//                   key={colIndex}
//                   className={col.align === "center" ? "text-center" : ""}
//                 >
//                   {col.render
//                     ? col.render(row, rowIndex)
//                     : row[col.accessor]}
//                 </td>
//               ))}
//             </motion.tr>
//           ))
//         )}
//       </tbody>
//     </Table>
//   );
// }
