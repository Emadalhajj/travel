import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  fetchPublicProgramById,
  clearSelectedProgram,
} from "../../../redux/public/programSlice";

import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

// import PublicPageLayout from "../../../Components/shared/layouts/PublicPageLayout";
// import PublicSectionCard from "../../../Components/shared/layouts/PublicSectionCard";
import PublicButton from "../../../Components/shared/buttons/PublicButton";

import DraftBookingSummaryCard from "../../../Components/shared/draft-bookings/DraftBookingSummaryCard";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";

export default function PublicProgramDetailsPage() {
  const { id } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { selectedProgram, detailsLoading, error } = useSelector(
    (state) => state.publicPrograms
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchPublicProgramById(id));
    }

    return () => {
      dispatch(clearSelectedProgram());
    };
  }, [dispatch, id]);

  const programName = useMemo(() => {
    return getLocalizedName(selectedProgram, isArabic);
  }, [selectedProgram, isArabic]);

  const programDescription = useMemo(() => {
    return getLocalizedDescription(selectedProgram, isArabic);
  }, [selectedProgram, isArabic]);

  const programItems =
    selectedProgram?.items ||
    selectedProgram?.bookingItems ||
    selectedProgram?.services ||
    [];

  const infoItems = [
    {
      label: t("startDate", "Start Date"),
      value: formatDate(selectedProgram?.startDate, isArabic),
    },
    {
      label: t("endDate", "End Date"),
      value: formatDate(selectedProgram?.endDate, isArabic),
    },
    {
      label: t("duration", "Duration"),
      value: `${selectedProgram?.durationDays || "-"} ${t("days", "Days")}`,
    },
    {
      label: t("serviceLevel", "Service Level"),
      value: selectedProgram?.serviceLevel || "-",
    },
    {
      label: t("availableSeats", "Available Seats"),
      value: selectedProgram?.capacity?.availableSeats ?? "-",
    },
    {
      label: t("status", "Status"),
      value: selectedProgram?.status || "-",
    },
  ];

  const summaryRows = [
    {
      label: t("program", "Program"),
      value: programName,
    },
    {
      label: t("startDate", "Start Date"),
      value: formatDate(selectedProgram?.startDate, isArabic),
    },
    {
      label: t("endDate", "End Date"),
      value: formatDate(selectedProgram?.endDate, isArabic),
    },
    {
      label: t("availableSeats", "Available Seats"),
      value: selectedProgram?.capacity?.availableSeats ?? "-",
    },
    {
      label: t("total", "Total"),
      value: `${selectedProgram?.pricing?.totalPrice || 0} ${
        selectedProgram?.pricing?.currency || "SAR"
      }`,
    },
  ];

  const canBook =
    selectedProgram && selectedProgram.capacity?.availableSeats !== 0;

  const handleStartBooking = () => {
    navigate(`/booking/program/${selectedProgram._id}`);
  };

  if (detailsLoading) {
    return (
      <PublicPageLayout>
        <Loader />
      </PublicPageLayout>
    );
  }

  if (!detailsLoading && !selectedProgram) {
    return (
      <PublicPageLayout>
        <PublicSectionCard title={t("programNotFound", "Program Not Found")}>
          <ErrorOverlay show={Boolean(error)} message={error} />
          <PublicButton
            variant="secondary"
            onClick={() => navigate("/programs")}
            className="mt-4"
          >
            {t("backToPrograms", "Back to Programs")}
          </PublicButton>
        </PublicSectionCard>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {t("programDetails", "Program Details")}
          </p>

          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
            {programName}
          </h1>

          {programDescription && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {programDescription}
            </p>
          )}
        </div>

        <PublicButton variant="secondary" onClick={() => navigate("/programs")}>
          {t("backToPrograms", "Back to Programs")}
        </PublicButton>
      </div>

      <ErrorOverlay show={Boolean(error)} message={error} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <PublicSectionCard title={t("programInfo", "Program Information")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {infoItems.map((item) => (
                <InfoBox key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </PublicSectionCard>

          <PublicSectionCard title={t("description", "Description")}>
            <p className="text-sm leading-7 text-slate-600">
              {programDescription || "-"}
            </p>
          </PublicSectionCard>

          <PublicSectionCard title={t("includedServices", "Included Services")}>
            {programItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("noIncludedServices", "No included services")}
              </p>
            ) : (
              <div className="space-y-4">
                {programItems.map((item, index) => (
                  <ServiceItemCard
                    key={item._id || item.refId || index}
                    item={item}
                    isArabic={isArabic}
                    t={t}
                  />
                ))}
              </div>
            )}
          </PublicSectionCard>
        </main>

        <aside>
          <DraftBookingSummaryCard
            title={t("bookingSummary", "Booking Summary")}
            rows={summaryRows}
            primaryAction={{
              label: t("bookNow", "Book Now"),
              onClick: handleStartBooking,
              disabled: !canBook,
            }}
            note={t(
              "draftBookingNote",
              "A draft booking will be created first, then reviewed before final confirmation."
            )}
          />
        </aside>
      </div>
    </PublicPageLayout>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <strong className="mt-2 block text-slate-900">{value}</strong>
    </div>
  );
}

function ServiceItemCard({ item, isArabic, t }) {
  const name = getLocalizedName(item, isArabic);
  const description = getLocalizedDescription(item, isArabic);
  const images = Array.isArray(item.images) ? item.images : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{name}</h3>

          <p className="mt-1 text-xs font-semibold text-emerald-700">
            {item.type || item.category || "-"}
          </p>

          {description && description !== "-" && (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700">
          {item.priceAtTime || item.price || 0} {item.currency || "SAR"}
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.url || image}
              alt={name}
              className="h-28 w-full rounded-xl border object-cover"
            />
          ))}
        </div>
      )}

      {item.metadata && (
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
          {Object.entries(item.metadata).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-white px-3 py-2">
              <span className="font-semibold">{t(key, key)}: </span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getLocalizedName(item, isArabic) {
  if (!item) return "-";

  return isArabic
    ? item.nameAr || item.name?.ar || item.nameEn || item.name?.en || "-"
    : item.nameEn || item.name?.en || item.nameAr || item.name?.ar || "-";
}

function getLocalizedDescription(item, isArabic) {
  if (!item) return "";

  return isArabic
    ? item.descriptionAr ||
        item.shortDescriptionAr ||
        item.description?.ar ||
        item.descriptionEn ||
        item.shortDescriptionEn ||
        item.description?.en ||
        ""
    : item.descriptionEn ||
        item.shortDescriptionEn ||
        item.description?.en ||
        item.descriptionAr ||
        item.shortDescriptionAr ||
        item.description?.ar ||
        "";
}

function formatDate(date, isArabic) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString(isArabic ? "ar-SA" : "en-US");
}