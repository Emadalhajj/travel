import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  Copy,
  Edit,
  Eye,
  EyeOff,
  FileDown,
  Filter,
  KeyRound,
  Loader2,
  Plus,
  Sheet,
  Star,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const ACTION_CONFIG = {
  add: { icon: Plus, labelEn: "Add", labelAr: "إضافة", className: "bg-green-100 text-green-700 hover:bg-green-200" },
  clone: { icon: Copy, labelEn: "Clone", labelAr: "نسخ", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  edit: { icon: Edit, labelEn: "Edit", labelAr: "تعديل", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  delete: { icon: Trash2, labelEn: "Delete", labelAr: "حذف", className: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
  view: { icon: Eye, labelEn: "View", labelAr: "عرض", className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  departures: { icon: CalendarDays, labelEn: "Departures", labelAr: "المغادرات", className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200" },
  schedule: { icon: CalendarCheck, labelEn: "Schedule", labelAr: "جدولة", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  cancel: { icon: CircleX, labelEn: "Cancel", labelAr: "إلغاء", className: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
  complete: { icon: CircleCheck, labelEn: "Complete", labelAr: "إكمال", className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  resetPassword: { icon: KeyRound, labelEn: "Reset password", labelAr: "إعادة تعيين كلمة المرور", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  activate: { icon: UserCheck, labelEn: "Activate", labelAr: "تفعيل", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  deactivate: { icon: UserX, labelEn: "Deactivate", labelAr: "تعطيل", className: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
  show: { icon: Eye, labelEn: "Show", labelAr: "إظهار", className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  hide: { icon: EyeOff, labelEn: "Hide", labelAr: "إخفاء", className: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  default: { icon: Star, labelEn: "Set default", labelAr: "تعيين افتراضي", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  exportPdf: { icon: FileDown, labelEn: "Export PDF", labelAr: "تصدير PDF", className: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
  exportExcel: { icon: Sheet, labelEn: "Export Excel", labelAr: "تصدير Excel", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  apply: { icon: Filter, labelEn: "Apply filters", labelAr: "تطبيق الفلاتر", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
  toggle: { icon: ChevronDown, labelEn: "Toggle section", labelAr: "طي أو فتح القسم", className: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  back: { icon: null, labelEn: "Back", labelAr: "عودة", className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
};

const SIZE_CLASSES = {
  sm: "min-h-9 min-w-9 text-sm",
  md: "min-h-10 min-w-10 text-sm",
  lg: "min-h-11 min-w-11 text-base",
};

export default function ActionButton({
  action,
  onClick,
  size = "sm",
  disabled = false,
  loading = false,
  className = "",
  withShadow = true,
  withPadding = true,
  showLabel = false,
  label,
  tooltip,
  expanded = false,
  fullWidth = false,
  type = "button",
  ...props
}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();
  const config = ACTION_CONFIG[action];

  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`ActionButton: unknown action "${action}"`);
    }
    return null;
  }

  const Icon =
    action === "back"
      ? isArabic
        ? ArrowRight
        : ArrowLeft
      : action === "toggle"
        ? expanded
          ? ChevronUp
          : ChevronDown
        : config.icon;

  const defaultLabel = isArabic ? config.labelAr : config.labelEn;
  const displayLabel = label || (showLabel ? defaultLabel : null);
  const accessibleLabel = tooltip || label || defaultLabel;
  const isDisabled = disabled || loading;

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
      return;
    }

    if (action === "back") {
      event.preventDefault();
      navigate(-1);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-expanded={action === "toggle" ? expanded : undefined}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium",
        "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        SIZE_CLASSES[size] || SIZE_CLASSES.sm,
        withPadding ? (displayLabel ? "px-3 py-2" : "p-2") : "",
        withShadow ? "shadow-sm hover:shadow" : "",
        fullWidth ? "w-full" : "",
        config.className,
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "lg" ? 22 : 18} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={size === "lg" ? 22 : 18} strokeWidth={2} aria-hidden="true" />
      )}
      {displayLabel && <span>{displayLabel}</span>}
    </button>
  );
}
