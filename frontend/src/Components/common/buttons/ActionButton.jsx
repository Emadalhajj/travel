import { Button } from "react-bootstrap";
import { Edit, Trash2, Eye, EyeOff, Plus, Copy, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, KeyRound, UserCheck, UserX, FileDown, Sheet, Filter, Star, CalendarDays, CalendarCheck, CircleX, CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";   // ← أضفنا هذا
const ACTION_CONFIG = {
  add: {
    icon: Plus,
    variant: "success",
    labelKeyEn: "Add",
    labelKeyAr: "إضافة",
    className: " bg-green-100 text-green-700 hover:bg-green-200",
  },
  clone: {
    icon: Copy,
    variant: "outline-success",
    labelKeyEn: "Clone",
    labelKeyAr: "نسخ",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  },
  edit: {
    icon: Edit,
    variant: "outline-primary",
    labelKeyEn: "Edit",
    labelKeyAr: "تعديل",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },
  delete: {
    icon: Trash2,
    variant: "outline-danger",
    labelKeyEn: "Delete",
    labelKeyAr: "حذف",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  },
  view: {
    icon: Eye,
    variant: "outline-info",
    labelKeyEn: "View",
    labelKeyAr: "عرض",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  departures: {
    icon: CalendarDays,
    variant: "outline-info",
    labelKeyEn: "Departures",
    labelKeyAr: "المغادرات",
    className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
  },
  schedule: {
    icon: CalendarCheck,
    variant: "outline-success",
    labelKeyEn: "Schedule",
    labelKeyAr: "جدولة",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  },
  cancel: {
    icon: CircleX,
    variant: "outline-danger",
    labelKeyEn: "Cancel",
    labelKeyAr: "إلغاء",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  },
  complete: {
    icon: CircleCheck,
    variant: "outline-primary",
    labelKeyEn: "Complete",
    labelKeyAr: "إكمال",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  resetPassword: {
    icon: KeyRound,
    variant: "outline-warning",
    labelKeyEn: "Reset password",
    labelKeyAr: "إعادة تعيين كلمة المرور",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },
  activate: {
    icon: UserCheck,
    variant: "outline-success",
    labelKeyEn: "Activate",
    labelKeyAr: "تفعيل",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  },
  deactivate: {
    icon: UserX,
    variant: "outline-danger",
    labelKeyEn: "Deactivate",
    labelKeyAr: "تعطيل",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  },
  show: {
    icon: Eye,
    variant: "outline-info",
    labelKeyEn: "Show",
    labelKeyAr: "إظهار",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  hide: {
    icon: EyeOff,
    variant: "outline-secondary",
    labelKeyEn: "Hide",
    labelKeyAr: "إخفاء",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  },
  default: {
    icon: Star,
    variant: "outline-warning",
    labelKeyEn: "Set default",
    labelKeyAr: "تعيين افتراضي",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },
  exportPdf: {
    icon: FileDown,
    variant: "outline-danger",
    labelKeyEn: "Export PDF",
    labelKeyAr: "تصدير PDF",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  },
  exportExcel: {
    icon: Sheet,
    variant: "outline-success",
    labelKeyEn: "Export Excel",
    labelKeyAr: "تصدير Excel",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  },
  apply: {
    icon: Filter,
    variant: "success",
    labelKeyEn: "Apply filters",
    labelKeyAr: "تطبيق الفلاتر",
    className: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  toggle: {
    icon: ChevronDown,
    variant: "outline-secondary",
    labelKeyEn: "Toggle section",
    labelKeyAr: "طي أو فتح القسم",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  },
    back: {
      icon : null,
    variant: "outline-info",
    labelKeyEn: "Back",
    labelKeyAr: "عودة",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
};

export default function ActionButton({
  action,
  onClick,
  size = "sm",           // غيرت الافتراضي إلى sm لأنه أنسب للجداول
  disabled = false,
  className = "",
  withShadow = true,
  withPadding = true,
  showLabel = false,      // الافتراضي: بدون نص (جيد للجداول)
  label,                  // ← prop جديد: نص مخصص يتجاوز كل شيء
  tooltip,
  expanded = false,
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const navigate = useNavigate();

  const config = ACTION_CONFIG[action];

  if (!config) {
    console.warn(`ActionButton: unknown action "${action}"`);
    return null;
  }

  const Icon = action === "back"
    ? (lang === "ar" ? ArrowRight : ArrowLeft)
    : action === "toggle"
      ? (expanded ? ChevronUp : ChevronDown)
      : config.icon;

  // ترتيب الأولوية للنص:
  // 1. label المخصص (إذا وُجد)
  // 2. الترجمة من ACTION_CONFIG إذا كان showLabel = true
  // 3. لا نص
  let displayLabel = null;

  if (label) {
    displayLabel = label;                    // أولوية أولى: النص الذي مررته يدويًا
  } else if (showLabel) {
    displayLabel = lang === "ar" ? config.labelKeyAr : config.labelKeyEn;
  }
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
    <Button
      size={size}
      variant={config.variant}
      onClick={handleClick}
      disabled={disabled}
      aria-expanded={action === "toggle" ? expanded : undefined}
      aria-label={tooltip || displayLabel || (lang === "ar" ? config.labelKeyAr : config.labelKeyEn)}
      title={tooltip || displayLabel || (lang === "ar" ? config.labelKeyAr : config.labelKeyEn)}
      className={`
        d-flex align-items-center justify-content-center
        
        border-1 rounded-2
        transition-all
        ${withShadow ? "shadow-sm hover:shadow" : ""}
         ${withPadding ? "px-1 py-1.5" : "p-1.5"}
        ${config.className}
        ${className}
      `}
    >
      <Icon size={size === "lg" ? 22 : 18} strokeWidth={2} />
      {displayLabel && <span className="fw-medium">{displayLabel}</span>}
    </Button>
  );
}
