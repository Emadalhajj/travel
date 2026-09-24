import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-hover",

  secondary:
    "border border-line bg-surface text-content hover:bg-surface-muted",

  danger: "bg-red-600 text-white hover:bg-red-700",

  dangerOutline:
    "border border-red-200 bg-surface text-red-700 hover:bg-red-50",

  successOutline:
    "border border-primary/20 bg-surface text-primary hover:bg-primary-soft",

  ghost: "bg-transparent text-content hover:bg-surface-muted",
};

const SIZES = {
  sm: "min-h-9 px-3 py-2 text-sm",

  md: "min-h-10 px-4 py-2.5 text-sm",

  lg: "min-h-11 px-5 py-3 text-base",
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
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-2",

        "rounded-app",

        "font-semibold",

        "transition",

        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-primary",
        "focus-visible:ring-offset-2",

        "disabled:cursor-not-allowed",
        "disabled:opacity-60",

        VARIANTS[variant] || VARIANTS.primary,

        SIZES[size] || SIZES.md,

        fullWidth ? "w-full" : "",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading && (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      )}

      {!loading && Icon && iconPosition === "start" && (
        <Icon size={18} aria-hidden="true" />
      )}

      {children}

      {!loading && Icon && iconPosition === "end" && (
        <Icon size={18} aria-hidden="true" />
      )}
    </button>
  );
}

