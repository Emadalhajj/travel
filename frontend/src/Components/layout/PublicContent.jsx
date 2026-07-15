
export default function PublicContent({
  children,
  withSidebar = false,
  className = "",
}) {
  if (withSidebar) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <main className={className}>
      {children}
    </main>
  );
}