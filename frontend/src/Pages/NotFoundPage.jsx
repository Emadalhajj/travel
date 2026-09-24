import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PublicPageLayout from "../Components/layout/PublicPageLayout";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PublicPageLayout containerClassName="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm" aria-labelledby="not-found-title">
        <p className="text-sm font-bold text-emerald-700">404</p>
        <h1 id="not-found-title" className="mt-2 text-3xl font-bold text-slate-900">
          {t("release.notFound.title")}
        </h1>
        <p className="mt-3 text-slate-600">{t("release.notFound.description")}</p>
        <Link className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white" to="/">
          {t("release.notFound.home")}
        </Link>
      </section>
    </PublicPageLayout>
  );
}
