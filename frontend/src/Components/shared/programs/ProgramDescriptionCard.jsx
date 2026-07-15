export default function ProgramDescriptionCard({
  title,
  description,
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <h2 className="mb-4 text-xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
        {description || "-"}
      </p>
    </section>
  );
}