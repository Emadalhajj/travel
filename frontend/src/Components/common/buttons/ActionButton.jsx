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
  Download,
   RotateCcw,
  Settings2,

} from "lucide-react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const ACTION_CONFIG = {
  add: {
    icon: Plus,
    labelAr: "إضافة",
    labelEn: "Add",
    className: "bg-primary text-white hover:bg-primary-hover",
  },

  clone: {
    icon: Copy,
    labelAr: "نسخ",
    labelEn: "Clone",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  },

  edit: {
    icon: Edit,
    labelAr: "تعديل",
    labelEn: "Edit",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },

  delete: {
    icon: Trash2,
    labelAr: "حذف",
    labelEn: "Delete",
    className: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  },

  view: {
    icon: Eye,
    labelAr: "عرض",
    labelEn: "View",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },

  departures: {
    icon: CalendarDays,
    labelAr: "المغادرات",
    labelEn: "Departures",
    className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
  },

  schedule: {
    icon: CalendarCheck,
    labelAr: "جدولة",
    labelEn: "Schedule",
    className: "bg-primary-soft text-primary hover:bg-emerald-200",
  },

  cancel: {
    icon: CircleX,
    labelAr: "إلغاء",
    labelEn: "Cancel",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },

  complete: {
    icon: CircleCheck,
    labelAr: "إكمال",
    labelEn: "Complete",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },

  resetPassword: {
    icon: KeyRound,
    labelAr: "إعادة تعيين كلمة المرور",
    labelEn: "Reset password",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },

  activate: {
    icon: UserCheck,
    labelAr: "تفعيل",
    labelEn: "Activate",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },

  deactivate: {
    icon: UserX,
    labelAr: "تعطيل",
    labelEn: "Deactivate",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },

  show: {
    icon: Eye,
    labelAr: "إظهار",
    labelEn: "Show",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },

  hide: {
    icon: EyeOff,
    labelAr: "إخفاء",
    labelEn: "Hide",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  },

  default: {
    icon: Star,
    labelAr: "تعيين افتراضي",
    labelEn: "Set default",
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },

  exportPdf: {
    icon: FileDown,
    labelAr: "تصدير PDF",
    labelEn: "Export PDF",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },

  exportExcel: {
    icon: Sheet,
    labelAr: "تصدير Excel",
    labelEn: "Export Excel",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },


  download: {
    icon: Download,
    labelAr: "تحميل",
    labelEn: "Download",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },

  apply: {
    icon: Filter,
    labelAr: "تطبيق الفلاتر",
    labelEn: "Apply filters",
    className: "bg-primary text-white hover:bg-primary-hover",
  },

  toggle: {
    icon: ChevronDown,
    labelAr: "طي أو فتح القسم",
    labelEn: "Toggle section",
    className: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  },

  back: {
    icon: null,
    labelAr: "عودة",
    labelEn: "Back",
    className: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  manage: {
  icon: Settings2,

  labelAr: "إدارة",
  labelEn: "Manage",

  className:
    "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
},
reset: {
  icon: RotateCcw,
  labelAr: "إعادة تعيين",
  labelEn: "Reset",
  className:
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
},
};

const SIZE_CLASSES = {
  sm: "min-h-9 min-w-9 text-sm",
  md: "min-h-10 min-w-10 text-sm",
  lg: "min-h-11 min-w-11 text-base",
};

const ICON_SIZES = {
  sm: 17,
  md: 19,
  lg: 21,
};

export default function ActionButton({
  action,

  onClick,

  type = "button",

  size = "sm",

  disabled = false,

  loading = false,

  showLabel = false,

  label,

  tooltip,

  expanded = false,

  fullWidth = false,

  className = "",

  ...props
}) {
  const { i18n } = useTranslation();

  const navigate = useNavigate();

  const isArabic = i18n.language === "ar";

  const config = ACTION_CONFIG[action];

  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`ActionButton: unknown action "${action}"`);
    }

    return null;
  }

  const defaultLabel = isArabic ? config.labelAr : config.labelEn;

  const displayLabel = label || (showLabel ? defaultLabel : null);

  const accessibleLabel = tooltip || label || defaultLabel;

  let Icon = config.icon;

  if (action === "back") {
    Icon = isArabic ? ArrowRight : ArrowLeft;
  }

  if (action === "toggle") {
    Icon = expanded ? ChevronUp : ChevronDown;
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

  const isDisabled = disabled || loading;

  const iconSize = ICON_SIZES[size] || ICON_SIZES.sm;

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={accessibleLabel}
      aria-busy={loading || undefined}
      aria-expanded={action === "toggle" ? expanded : undefined}
      data-action={action}
      title={accessibleLabel}
      className={[
        "inline-flex items-center justify-center gap-2",

        "rounded-full border border-transparent",

        "font-medium",

        "transition",

        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-primary",
        "focus-visible:ring-offset-2",

        "disabled:cursor-not-allowed",
        "disabled:opacity-60",

        SIZE_CLASSES[size] || SIZE_CLASSES.sm,

        displayLabel ? "px-3 py-2" : "p-2",

        fullWidth ? "w-full" : "",

        config.className,

        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <Loader2
          size={iconSize}
          className="shrink-0 animate-spin"
          width={iconSize}
          height={iconSize}
          aria-hidden="true"
        />
      ) : (
        Icon && (
          <Icon
            size={iconSize}
            strokeWidth={2}
            className="shrink-0"
            width={iconSize}
            height={iconSize}
            aria-hidden="true"
          />
        )
      )}

      {displayLabel && <span>{displayLabel}</span>}
    </button>
  );
}
