export default function AdminPageActions({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        d-inline-flex flex-nowrap align-items-center gap-2
        ${className}
      `}
    >
      {children}
    </div>
  );
}
