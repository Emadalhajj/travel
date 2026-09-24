export default function UniversalTable({
  columns = [],
  data = [],
  emptyMessage = "No data",
  lang = "ar",

  getRowKey = (row, index) => row?._id || row?.id || index,

  className = "",
}) {
  const visibleColumns = columns.filter((column) => !column.hidden);

  const getValue = (row, accessor) => {
    if (!accessor) {
      return null;
    }
// تعمل على استرجاع القيمة حسب اللغة 
    const resolvedAccessor = Array.isArray(accessor)
      ? lang === "ar"
        ? accessor[0]
        : accessor[1]
      : accessor;

    if (typeof resolvedAccessor !== "string") {
      return null;
    }

    return resolvedAccessor
      .split(".")
      .reduce((value, key) => value?.[key], row);
  };

  return (
    <div
      className={[
        "w-full overflow-x-auto",

        "rounded-app border border-line",

        "bg-surface",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <table className="w-full min-w-max border-collapse">
        <thead className="bg-surface-muted">
          <tr>
            {visibleColumns.map((column, index) => (
              <th
                key={column.key || column.accessor || index}
                scope="col"
                style={{
                  width: column.width,
                }}
                className={[
                  "border-b border-line",

                  "px-4 py-3",

                  "text-sm font-semibold",

                  "text-content",

                  "whitespace-nowrap",

                  column.align === "start"
                    ? "text-start"
                    : column.align === "end"
                      ? "text-end"
                      : "text-center",
                ].join(" ")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {!data.length ? (
            <tr>
              <td
                colSpan={Math.max(visibleColumns.length, 1)}
                className="
                  px-4 py-10

                  text-center

                  text-sm
                  text-content-muted
                "
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className="
                  transition-colors

                  hover:bg-surface-muted/60
                "
              >
                {visibleColumns.map((column, columnIndex) => {
                  const value = column.render
                    ? column.render(row, rowIndex, lang)
                    : getValue(row, column.accessor);

                  return (
                    <td
                      key={column.key || column.accessor || columnIndex}
                      style={{
                        width: column.width,
                      }}
                      className={[
                        "px-4 py-3",

                        "align-middle",

                        "text-sm",

                        "text-content-muted",

                        column.wrap
                          ? "whitespace-normal break-words"
                          : "whitespace-nowrap",

                        column.align === "start"
                          ? "text-start"
                          : column.align === "end"
                            ? "text-end"
                            : "text-center",
                      ].join(" ")}
                    >
                      {value === null || value === undefined || value === ""
                        ? "—"
                        : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
