import { CalendarDays } from "lucide-react";

export default function CalendarField({
  id,
  value = "",
  onChange,
  min,
  max,
  required = false,
  error = "",
  isArabic = true,
}) {
  return (
    <div>
      <div className="relative">
        <CalendarDays
          size={19}
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-emerald-600"
        />
        <input
          id={id}
          type="date"
          value={value ? String(value).slice(0, 10) : ""}
          min={min}
          max={max}
          required={required}
          onChange={(event) => onChange?.(event.target.value)}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white py-3 pe-4 ps-12 text-sm outline-none transition focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
          }`}
        />
      </div>
      <p className={`mt-1 text-xs ${error ? "font-semibold text-red-600" : "text-slate-500"}`}>
        {error || (isArabic ? "اختر التاريخ من التقويم" : "Choose a date from the calendar")}
      </p>
    </div>
  );
}
