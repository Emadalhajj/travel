import { useEffect, useState } from "react";

import { Check, Copy } from "lucide-react";

const copyText = async (value) => {
  const text = String(value || "");

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};

/*
=====================================================
Copyable Value
=====================================================

مكون عام لعرض قيمة مع زر نسخ، ويمكن استخدامه مع:
IBAN، رقم الحساب، SWIFT، المراجع وأرقام الحجوزات.
=====================================================
*/

export default function CopyableValue({
  label,
  value,
  isArabic = true,
  dir = "ltr",
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!value) return;

    try {
      await copyText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <div className="min-w-0 flex-1 text-sm text-slate-700">
        <span className="font-semibold text-slate-500">{label}: </span>
        <span className="break-all" dir={dir}>{value || "-"}</span>
      </div>

      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition ${
            copied
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
          }`}
          aria-label={`${isArabic ? "نسخ" : "Copy"} ${label}`}
          title={`${isArabic ? "نسخ" : "Copy"} ${label}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? (isArabic ? "تم النسخ" : "Copied") : (isArabic ? "نسخ" : "Copy")}</span>
        </button>
      )}
    </div>
  );
}
