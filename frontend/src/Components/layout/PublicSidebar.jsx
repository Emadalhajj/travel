

export default function PublicSidebar({
  children,
  sticky = true,
  className = "",
}) {
  return (
    <aside className={`${sticky ? "lg:sticky lg:top-6 h-fit" : ""} ${className}`}>
      {children}
    </aside>
  );
}