import { Button } from "react-bootstrap";
import { Edit, Trash2, Eye, Plus, Copy , ArrowLeft, ArrowRight } from "lucide-react";
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
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const navigate = useNavigate()

  const config = ACTION_CONFIG[action];

  if (!config) {
    console.warn(`ActionButton: unknown action "${action}"`);
    return null;
  }

  const Icon = config.icon;

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
  //back function
  const hanldeClick = (e)=>{
    if(action === "back"){
      e.preventDefault()
      navigate(-1)

    } else if (onClick){
      onClick(e)
    }

  
  }
// get backIcon as language
const getBackIcon = ()=>{
  return lang === "ar" ? ArrowRight : ArrowLeft
}
if(action === "back"){
  config.icon = getBackIcon()
}
  return (
    <Button
      size={size}
      variant={config.variant}
      onClick={hanldeClick}
      disabled={disabled}
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