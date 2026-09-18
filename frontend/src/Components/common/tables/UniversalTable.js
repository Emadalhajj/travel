import React from "react";
import { motion } from "framer-motion";

export default function UniversalTable({
  columns = [],
  data = [],
  emptyMessage = "No data",
  lang = "ar",
  rowKey = (row, index) => row?._id || row?.id || index,
  className = "",
}) {
  const visibleColumns = columns.filter((col) => !col.hidden);

  const getValue = (row, accessor) => {
    if (!accessor) return null;

    if (Array.isArray(accessor)) {
      const key = lang === "ar" ? accessor[0] : accessor[1];
      return key?.split(".").reduce((obj, part) => obj?.[part], row) ?? "";
    }

    if (typeof accessor === "string") {
      return accessor.split(".").reduce((obj, part) => obj?.[part], row) ?? "";
    }

    return null;
  };

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-slate-900 text-white">
          <tr>
            {visibleColumns.map((col, index) => (
              <th
                key={col.key || col.accessor || index}
                scope="col"
                className="whitespace-nowrap px-3 py-3 text-center align-middle font-semibold sm:px-4"
                style={{ width: col.width, minWidth: col.minWidth }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(visibleColumns.length, 1)}
                className="px-4 py-10 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <motion.tr
                key={rowKey(row, rowIndex)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="transition-colors hover:bg-slate-50"
              >
                {visibleColumns.map((col, colIndex) => (
                  <td
                    key={col.key || col.accessor || colIndex}
                    className={`px-3 py-3 align-middle sm:px-4 ${
                      col.wrap ? "whitespace-normal break-words" : "whitespace-nowrap"
                    }`}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      maxWidth: col.maxWidth,
                      textAlign: col.align || "center",
                    }}
                  >
                    {col.render
                      ? col.render(row, rowIndex, lang)
                      : getValue(row, col.accessor) || "—"}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
