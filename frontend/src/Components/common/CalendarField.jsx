import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CalendarField({ id, value = "", onChange, min, max, required = false, error = "", isArabic = true, showMessage = true }) {
  const selectedDate = toDate(value);
  const today = new Date();
  const initialView = selectedDate || toDate(max) || today;
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());
  const containerRef = useRef(null);
  const locale = isArabic ? "en-US" : "en-US";

  useEffect(() => {
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const minimum = toDate(min);
  const maximum = toDate(max);
  const years = useMemo(() => {
    const lower = minimum?.getFullYear() ?? Math.min(today.getFullYear() - 100, viewYear - 50);
    const upper = maximum?.getFullYear() ?? Math.max(today.getFullYear() + 20, viewYear + 20);
    return Array.from({ length: upper - lower + 1 }, (_, index) => upper - index);
  }, [min, max, viewYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, month, 1))), [locale]);
  const weekdays = useMemo(() => {
    const sunday = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + day)));
  }, [locale]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const start = new Date(viewYear, viewMonth, 1 - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [viewYear, viewMonth]);

  const moveMonth = (amount) => {
    const date = new Date(viewYear, viewMonth + amount, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const isDisabled = (date) => (minimum && date < minimum) || (maximum && date > maximum);
  const isSameDay = (first, second) => first && second && toIsoDate(first) === toIsoDate(second);
  const displayValue = selectedDate
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(selectedDate)
    : isArabic ? "اختر التاريخ" : "Choose date";

  return (
    <div ref={containerRef} className="relative" dir={isArabic ? "rtl" : "ltr"}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${error ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"}`}
      >
        <span className={selectedDate ? "font-semibold text-slate-800" : "text-slate-400"}>{displayValue}</span>
        <CalendarDays size={19} className="shrink-0 text-emerald-600" />
      </button>

      {isOpen && (
        <div role="dialog" aria-label={isArabic ? "اختيار التاريخ" : "Choose date"} className="absolute start-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center gap-2">
            <button type="button" onClick={() => moveMonth(isArabic ? 1 : -1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={isArabic ? "الشهر السابق" : "Previous month"}>{isArabic ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
            <select value={viewMonth} onChange={(event) => setViewMonth(Number(event.target.value))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm font-semibold">{months.map((month, index) => <option key={month} value={index}>{month}</option>)}</select>
            <select value={viewYear} onChange={(event) => setViewYear(Number(event.target.value))} className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm font-semibold">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            <button type="button" onClick={() => moveMonth(isArabic ? -1 : 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={isArabic ? "الشهر التالي" : "Next month"}>{isArabic ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">{weekdays.map((day) => <span key={day} className="py-1 text-xs font-bold text-slate-400">{day}</span>)}{calendarDays.map((date) => {
            const disabled = isDisabled(date);
            const selected = isSameDay(date, selectedDate);
            const current = isSameDay(date, today);
            const outside = date.getMonth() !== viewMonth;
            return <button key={toIsoDate(date)} type="button" disabled={disabled} onClick={() => { onChange?.(toIsoDate(date)); setIsOpen(false); }} className={`aspect-square rounded-lg text-sm transition ${selected ? "bg-emerald-600 font-bold text-white" : current ? "border border-emerald-500 font-bold text-emerald-700" : outside ? "text-slate-300 hover:bg-slate-50" : "text-slate-700 hover:bg-emerald-50"} disabled:cursor-not-allowed disabled:text-slate-200`}>{date.getDate()}</button>;
          })}</div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <button type="button" onClick={() => { onChange?.(""); setIsOpen(false); }} disabled={required} className="inline-flex items-center gap-1 text-xs font-bold text-red-600 disabled:hidden"><X size={15} />{isArabic ? "مسح" : "Clear"}</button>
            <button type="button" disabled={isDisabled(today)} onClick={() => { onChange?.(toIsoDate(today)); setIsOpen(false); }} className="text-xs font-bold text-emerald-700 disabled:text-slate-300">{isArabic ? "اليوم" : "Today"}</button>
          </div>
        </div>
      )}

      {showMessage && (
        <p className={`mt-1 text-xs ${error ? "font-semibold text-red-600" : "text-slate-500"}`}>{error || (isArabic ? "اختر التاريخ من التقويم" : "Choose a date from the calendar")}</p>
      )}
    </div>
  );
}

