import { Col } from "react-bootstrap";

export default function FieldRenderer({
  field,
  value,
  onChange,
  isArabic = true,
}) {
  const label =
    (isArabic ? field.labelAr : field.labelEn) ||
    field.label ||
    field.name ||
    "";
  const col = field.col || 12;

  return (
    <Col md={col} xs={12}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
          {field.required && <span className="text-red-500"> *</span>}
        </span>

        {renderField({ field, value, onChange, isArabic })}
      </label>
    </Col>
  );
}

function renderField({ field, value, onChange, isArabic }) {
  const baseClass =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        required={field.required}
        rows={field.rows || 3}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value || field.defaultValue || ""}
        required={field.required}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {(isArabic ? option.labelAr : option.labelEn) ||
              option.label ||
              option.value}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
      />
    );
  }

  return (
    <input
      type={field.type || "text"}
      value={value || ""}
      required={field.required}
      min={field.min}
      max={field.max}
      placeholder={isArabic ? field.placeholderAr : field.placeholderEn}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
    />
  );
}
