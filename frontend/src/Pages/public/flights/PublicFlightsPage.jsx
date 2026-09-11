import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CalendarField from "../../../Components/common/CalendarField";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import PageHeader from "../../../Components/layout/PageHeader";
import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PublicSectionCard from "../../../Components/layout/PublicSectionCard";
import PublicButton from "../../../Components/shared/buttons/PublicButton";
import {
  apiCreatePublicFlightDraft,
  apiSearchPublicFlights,
} from "../../../services/api/public/flightApi";
import { formatPrice } from "../../../Utils/roundPrice";

const today = new Date().toISOString().slice(0, 10);
const initialCriteria = {
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  adults: 1,
  children: 0,
  infants: 0,
  cabinClass: "ECONOMY",
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function PublicFlightsPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [criteria, setCriteria] = useState(initialCriteria);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState("");
  const [error, setError] = useState("");
  const passengerTotal = useMemo(
    () => Number(criteria.adults) + Number(criteria.children) + Number(criteria.infants),
    [criteria.adults, criteria.children, criteria.infants],
  );

  const change = (name, value) =>
    setCriteria((previous) => ({ ...previous, [name]: value }));

  const search = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiSearchPublicFlights(criteria);
      setOffers(Array.isArray(response?.data) ? response.data : []);
    } catch (searchError) {
      setOffers([]);
      setError(getErrorMessage(searchError,
        isArabic ? "تعذر البحث عن الرحلات" : "Unable to search flights"));
    } finally {
      setLoading(false);
    }
  };

  const selectOffer = async (offer) => {
    setError("");
    setSelectingId(offer.offerId);
    try {
      const response = await apiCreatePublicFlightDraft({
        offerId: offer.offerId,
        expected: {
          route: {
            origin: offer.origin?.code || criteria.origin,
            destination: offer.destination?.code || criteria.destination,
          },
          pricing: offer.pricing,
          passengers: {
            adults: Number(criteria.adults),
            children: Number(criteria.children),
            infants: Number(criteria.infants),
            total: passengerTotal,
          },
        },
      });
      const draftId = response?.data?._id;
      if (draftId) navigate(`/booking/draft/${draftId}/details`);
    } catch (selectError) {
      setError(getErrorMessage(selectError,
        isArabic ? "تعذر اختيار العرض، أعد البحث وحاول مجددًا" : "Unable to select this offer. Search again and retry."));
    } finally {
      setSelectingId("");
    }
  };

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="خدمات الطيران"
        eyebrowEn="Flight services"
        titleAr="ابحث واحجز رحلتك"
        titleEn="Search and book your flight"
        subtitleAr="يتم التحقق من السعر والتوفر مرة أخرى قبل إنشاء المسودة وقبل الدفع."
        subtitleEn="Price and availability are revalidated before draft creation and payment."
      />
      <ErrorOverlay show={Boolean(error)} message={error} />
      <PublicSectionCard>
        <form onSubmit={search} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FlightInput label={isArabic ? "من (رمز المطار)" : "From (airport code)"} value={criteria.origin}
            onChange={(value) => change("origin", value.toUpperCase())} required />
          <FlightInput label={isArabic ? "إلى (رمز المطار)" : "To (airport code)"} value={criteria.destination}
            onChange={(value) => change("destination", value.toUpperCase())} required />
          <Labeled label={isArabic ? "تاريخ المغادرة" : "Departure date"}>
            <CalendarField value={criteria.departureDate} min={today} required isArabic={isArabic}
              onChange={(value) => change("departureDate", value)} />
          </Labeled>
          <Labeled label={isArabic ? "تاريخ العودة (اختياري)" : "Return date (optional)"}>
            <CalendarField value={criteria.returnDate} min={criteria.departureDate || today} isArabic={isArabic}
              onChange={(value) => change("returnDate", value)} />
          </Labeled>
          {[["adults", "البالغون", "Adults", 1], ["children", "الأطفال", "Children", 0], ["infants", "الرضع", "Infants", 0]].map(([name, ar, en, min]) => (
            <FlightInput key={name} type="number" min={min} max="9" label={isArabic ? ar : en}
              value={criteria[name]} onChange={(value) => change(name, Number(value))} required />
          ))}
          <Labeled label={isArabic ? "درجة السفر" : "Cabin class"}>
            <select className="w-full rounded-xl border border-slate-200 px-4 py-3" value={criteria.cabinClass}
              onChange={(event) => change("cabinClass", event.target.value)}>
              <option value="ECONOMY">{isArabic ? "اقتصادية" : "Economy"}</option>
              <option value="PREMIUM_ECONOMY">{isArabic ? "اقتصادية ممتازة" : "Premium economy"}</option>
              <option value="BUSINESS">{isArabic ? "رجال الأعمال" : "Business"}</option>
              <option value="FIRST">{isArabic ? "الأولى" : "First"}</option>
            </select>
          </Labeled>
          <div className="md:col-span-2 lg:col-span-4">
            <PublicButton type="submit" loading={loading} disabled={loading}>
              {isArabic ? "بحث عن الرحلات" : "Search flights"}
            </PublicButton>
          </div>
        </form>
      </PublicSectionCard>
      <div className="mt-8 space-y-5">
        {!loading && offers.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
            {isArabic ? "استخدم النموذج لعرض الرحلات المتاحة." : "Use the form to see available flights."}
          </p>
        )}
        {offers.map((offer) => (
          <FlightOfferCard key={offer.offerId} offer={offer} isArabic={isArabic}
            loading={selectingId === offer.offerId} onSelect={() => selectOffer(offer)} />
        ))}
      </div>
    </PublicPageLayout>
  );
}

function FlightOfferCard({ offer, isArabic, loading, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  return <PublicSectionCard className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-start gap-4">
      {offer.airline?.logoUrl && <img src={offer.airline.logoUrl} alt="" loading="lazy" decoding="async" className="h-12 w-12 object-contain" />}
      <div>
        <h2 className="font-bold text-slate-900">{offer.airline?.name || offer.airline?.iataCode || "-"}</h2>
        <p className="mt-1 text-lg font-extrabold text-emerald-800">{offer.origin?.code} → {offer.destination?.code}</p>
        <p className="mt-1 text-sm text-slate-500">{offer.slices?.length > 1 ? (isArabic ? "ذهاب وعودة" : "Round trip") : (isArabic ? "ذهاب فقط" : "One way")}</p>
        <p className="mt-1 text-sm text-slate-500">{isArabic ? "الدرجة" : "Cabin"}: {offer.cabinClass || "-"}</p>
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          {(offer.slices || []).map((slice) => <p key={slice.id}>{slice.origin?.code} → {slice.destination?.code} · {(slice.segmentIds?.length || 1) - 1} {isArabic ? "توقف" : "stops"} · {slice.duration || "-"}</p>)}
        </div>
        {expanded && <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          {(offer.segments || []).map((segment) => <div key={segment.id} className="border-b border-slate-200 pb-2 last:border-0">
            <strong>{segment.origin?.code} → {segment.destination?.code}</strong>
            <span> · {segment.departureAt ? new Date(segment.departureAt).toLocaleString(isArabic ? "ar-SA" : "en-US") : "-"}</span>
            <span> · {segment.flightNumber || "-"}</span>
            {segment.baggage?.length > 0 && <span> · {isArabic ? "الأمتعة" : "Baggage"}: {segment.baggage.map((item) => `${item.quantity} ${item.type}`).join(", ")}</span>}
          </div>)}
        </div>}
      </div>
    </div>
    <div className="text-end">
      <p className="text-xl font-black text-slate-900">{formatPrice(offer.pricing?.total, offer.pricing?.currency)}</p>
      <p className="mb-3 text-xs text-amber-700">{isArabic ? "السعر والتوفر قابلان للتغير حتى الدفع" : "Price and availability may change until payment"}</p>
      <PublicButton variant="secondary" onClick={() => setExpanded((value) => !value)} className="me-2">
        {expanded ? (isArabic ? "إخفاء التفاصيل" : "Hide details") : (isArabic ? "التفاصيل" : "Details")}
      </PublicButton>
      <PublicButton onClick={onSelect} loading={loading} disabled={loading}>{isArabic ? "اختيار الرحلة" : "Select flight"}</PublicButton>
    </div>
  </PublicSectionCard>;
}

function Labeled({ label, children }) {
  return <label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label>;
}

function FlightInput({ label, value, onChange, type = "text", ...props }) {
  return <Labeled label={label}><input type={type} value={value} onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-emerald-500" {...props} /></Labeled>;
}
