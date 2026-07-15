/*
    PublicSection.jsx
    
*/
export default function PublicSection({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <section className={`rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}