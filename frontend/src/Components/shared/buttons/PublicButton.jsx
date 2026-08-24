import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dangerOutline: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  successOutline: "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
};

const SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-base",
};

export default function PublicButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "start",
  fullWidth = false,
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2",
        "rounded-xl font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? "w-full" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {!loading && Icon && iconPosition === "start" && <Icon size={18} />}
      {children}
      {!loading && Icon && iconPosition === "end" && <Icon size={18} />}
    </button>
  );
}
