import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  clearPublicProgramError,
  fetchPublicPrograms,
} from "../../../redux/public/programSlice";
import ProgramCard from "../../../Components/shared/programs/ProgramCard";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import Loader from "../../../Components/common/Loader";
import PageHeader from "../../../Components/layout/PageHeader";

// import {
//   fetchPublicPrograms,
//   clearPublicProgramError,
// } from "../../redux/slices/public/programSlice";

/*
=========================================================
PublicProgramListPage
=========================================================

أول صفحة عامة للعميل.

المهام:
1- جلب البرامج العامة من API
2- عرض البرامج المتاحة للعميل
3- دعم عربي / انجليزي
4- الانتقال إلى صفحة تفاصيل البرنامج
=========================================================
*/

export default function PublicProgramListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const {
    programs = [],
    loading,
    error,
  } = useSelector((state) => state.publicPrograms || {});
  useEffect(() => {
    dispatch(fetchPublicPrograms());

    return () => {
      dispatch(clearPublicProgramError());
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          eyebrowAr="برامج العمرة"
          eyebrowEn="Umrah Programs"
          titleAr="برامج العمرة"
          titleEn="Umrah Programs"
          subtitleAr="اختر البرنامج المناسب لك أو قم ببناء برنامج مخصص."
          subtitleEn="Choose a ready-made package or build your own custom package."
          actions={
            <button
              type="button"
              onClick={() => navigate("/custom-package")}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              {t("buildCustomPackage", "بناء برنامج مخصص")}
            </button>
          }
        />

        {loading && <Loader />}

        <ErrorOverlay show={!loading && Boolean(error)} message={error} />

        {/* Empty State */}
        {!loading && !error && programs.length === 0 && (
          <div className="text-center bg-white rounded-xl shadow-sm p-10">
            <h3 className="text-xl font-semibold text-gray-800">
              {t("noProgramsFound", "لا توجد برامج متاحة حاليًا")}
            </h3>

            <p className="text-gray-500 mt-2">
              {t("noProgramsFoundDesc", "سيتم عرض البرامج هنا عند توفرها")}
            </p>
          </div>
        )}

        {/* Programs Grid */}
        {!loading && !error && programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <ProgramCard
                key={program._id}
                program={program}
                isArabic={isArabic}
                t={t}
                onViewDetails={() => navigate(`/programs/${program._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
