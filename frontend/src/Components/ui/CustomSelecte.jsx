import React, { useState, useRef, useEffect } from "react";
import i18n from "../../i18n";

export default function CustomSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "اختر...",
  className = "",
  disabled = false,
  showAllOption = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const lang = i18n.language || "ar";

  const selectedOption = options.find((opt) => opt.value === value);

  const getOptionLabel = (option) => {
    if (!option) return "";
    if (lang === "ar")
      return option.labelAr || option.labelEn || option.label || "";
    return option.labelEn || option.labelAr || option.label || "";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2 
          bg-white border border-gray-300 rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200 hover:border-gray-400
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          ${className}`}
      >
        <span
          className={`text-sm ${!selectedOption ? "text-gray-500" : "text-gray-800"}`}
        >
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>

        {/* أيقونة بدون مكتبة خارجية */}
        <span
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-80 overflow-auto animate-in fade-in slide-in-from-top-2">
          {showAllOption && (
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm transition-colors border-b"
            >
              {lang === "ar" ? "الكل" : "All"}
            </div>
          )}

          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 text-md cursor-pointer transition-colors hover:bg-blue-50
                ${value === option.value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
            >
              {getOptionLabel(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
