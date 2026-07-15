import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          🕋 منصة حجز برامج العمرة
        </h1>

        <p className="mt-4 text-slate-600">
          اختر طريقة الحجز المناسبة لك، إما من البرامج الجاهزة أو بتصميم برنامج مخصص.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/programs")}
            className="rounded-2xl bg-white p-8 text-start shadow-sm border border-slate-100 hover:border-emerald-400 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-slate-900">
              استعراض البرامج الجاهزة
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              اختر من البرامج التي تم إعدادها مسبقًا بواسطة الإدارة، مع خدمات وفنادق ونقل محددة.
            </p>
            <span className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-2 text-white font-bold">
              عرض البرامج
            </span>
          </button>

          <button
            onClick={() => navigate("/custom-package-builder")}
            className="rounded-2xl bg-white p-8 text-start shadow-sm border border-slate-100 hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">🧩</div>
            <h2 className="text-xl font-bold text-slate-900">
              إنشاء برنامج مخصص
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              صمّم برنامجك بنفسك باختيار الفنادق، النقل، التأشيرات، الرحلات والخدمات الإضافية.
            </p>
            <span className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2 text-white font-bold">
              ابدأ التصميم
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}