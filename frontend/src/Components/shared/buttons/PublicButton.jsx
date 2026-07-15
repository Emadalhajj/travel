export default function PublicButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    secondary: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-300 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}