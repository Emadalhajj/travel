import { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import CalendarField from "../../../common/CalendarField";
import { importExternalFlightApi, searchExternalFlightsApi } from "../../../../services/api/admin/trips";
import { formatPrice } from "../../../../Utils/roundPrice";

const CABIN_OPTIONS = [
  ["ECONOMY", "اقتصادية", "Economy"],
  ["PREMIUM_ECONOMY", "اقتصادية مميزة", "Premium economy"],
  ["BUSINESS", "رجال الأعمال", "Business"],
  ["FIRST", "الأولى", "First"],
];

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

const formatDateTime = (value, language) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
           dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
};

const getSliceSegments = (offer, slice) => {
  const ids = new Set(slice.segmentIds || []);
  return (offer.segments || []).filter((segment) => ids.has(segment.id));
};

function OfferJourney({ offer, language }) {
  return (offer.slices || []).map((slice, sliceIndex) => {
    const segments = getSliceSegments(offer, slice);
    const first = segments[0];
    const last = segments.at(-1);
    return (
      <div key={slice.id || sliceIndex} className="border rounded p-3 mb-2 bg-light">
        <div className="fw-semibold mb-2">
          {language === "ar"
            ? (sliceIndex === 0 ? "الذهاب" : "العودة")
            : (sliceIndex === 0 ? "Outbound" : "Inbound")}
          {" — "}{slice.origin?.code} → {slice.destination?.code}
        </div>
        <div className="small text-secondary mb-2">
          {formatDateTime(first?.departureAt, language)} → {formatDateTime(last?.arrivalAt, language)}
          {" · "}
          {segments.length <= 1
            ? (language === "ar" ? "مباشرة" : "Direct")
            : `${segments.length - 1} ${language === "ar" ? "توقف" : "stop(s)"}`}
        </div>
        {segments.map((segment) => (
          <div key={segment.id} className="small border-top pt-2 mt-2">
            {segment.origin?.code} → {segment.destination?.code}
            {" · "}{segment.marketingCarrier?.name || segment.operatingCarrier?.name || "—"}
            {segment.flightNumber ? ` ${segment.flightNumber}` : ""}
          </div>
        ))}
      </div>
    );
  });
}

export default function DuffelFlightSearchPanel({
  searchFlights = searchExternalFlightsApi,
  importOffer = importExternalFlightApi,
  onImported,
}) {
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith("ar") ? "ar" : "en";
  const [criteria, setCriteria] = useState(initialCriteria);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [imported, setImported] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState("");

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const update = (name, value) => {
    setCriteria((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const search = async () => {
    if (!criteria.origin || !criteria.destination || !criteria.departureDate) {
      setError(language === "ar" ? "أدخل المطارات وتاريخ الذهاب" : "Enter airports and departure date");
      return;
    }
    setLoading(true);
    setError("");
    setSelectedOffer(null);
    setImported(null);
    try {
      const response = await searchFlights({ provider: "DUFFEL", ...criteria });
      setOffers(response?.data?.data || []);
      setHasSearched(true);
    } catch (requestError) {
      setOffers([]);
      setError(requestError?.response?.data?.message ||
        (language === "ar" ? "تعذر البحث عن الرحلات" : "Unable to search for flights"));
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    setImportLoading(true);
    setError("");
    try {
      const response = await importOffer({
        provider: selectedOffer.provider || "DUFFEL",
        offerId: selectedOffer.offerId,
      });
      const result = response?.data?.data;
      setImported(result);
      onImported?.(result);
    } catch (requestError) {
      setError(requestError?.response?.data?.message ||
        (language === "ar" ? "تعذر استيراد العرض" : "Unable to import the offer"));
    } finally {
      setImportLoading(false);
    }
  };

  if (selectedOffer) {
    const expiresAt = new Date(selectedOffer.expiresAt || 0);
    const isExpired = Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date();
    return (
      <Card className="mt-4 border-primary" data-testid="duffel-offer-preview">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <strong>{language === "ar" ? "مراجعة العرض الخارجي" : "External offer preview"}</strong>
          <Badge bg="secondary">Duffel</Badge>
        </Card.Header>
        <Card.Body>
          <h5>{selectedOffer.airline?.name || "—"}</h5>
          <OfferJourney offer={selectedOffer} language={language} />
          <Row className="g-2 mt-2">
            <Col md={4}><strong>{language === "ar" ? "المقصورة" : "Cabin"}:</strong> {selectedOffer.cabinClass || "—"}</Col>
            <Col md={4}><strong>{language === "ar" ? "السعر" : "Price"}:</strong> {formatPrice(selectedOffer.pricing?.total, selectedOffer.pricing?.currency || "SAR")}</Col>
            <Col md={4}><strong>{language === "ar" ? "صالح حتى" : "Expires"}:</strong> {formatDateTime(selectedOffer.expiresAt, language)}</Col>
          </Row>
          {isExpired && <Alert variant="warning" className="mt-3 mb-0">
            {language === "ar" ? "انتهت صلاحية العرض؛ أعد البحث قبل الاستيراد" : "This offer has expired; search again before importing"}
          </Alert>}
          {imported && <Alert variant="success" className="mt-3 mb-0">
            {language === "ar"
              ? `تم استيراد ${imported.items?.length || 0} مغادرة بنجاح`
              : `${imported.items?.length || 0} departure(s) imported successfully`}
          </Alert>}
          {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
          <div className="d-flex gap-2 mt-3">
            <Button variant="outline-secondary" onClick={() => { setSelectedOffer(null); setImported(null); }} disabled={importLoading}>
              {language === "ar" ? "تغيير العرض" : "Change offer"}
            </Button>
            <Button onClick={confirmImport} disabled={Boolean(imported) || isExpired || importLoading}>
              {importLoading
                ? (language === "ar" ? "جارٍ الاستيراد..." : "Importing...")
                : (language === "ar" ? "تأكيد الاستيراد" : "Confirm import")}
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <section className="mt-4 border-top pt-4" data-testid="duffel-search-panel">
      <h5>{language === "ar" ? "بحث عن رحلة خارجية" : "Search external flights"}</h5>
      <Row className="g-3">
        {["origin", "destination"].map((name) => (
          <Col md={3} key={name}>
            <Form.Label>{name === "origin" ? (language === "ar" ? "من" : "From") : (language === "ar" ? "إلى" : "To")}</Form.Label>
            <Form.Control value={criteria[name]} maxLength={3} placeholder="IATA" onChange={(event) => update(name, event.target.value.toUpperCase())} />
          </Col>
        ))}
        <Col md={3}>
          <Form.Label>{language === "ar" ? "تاريخ الذهاب" : "Departure date"}</Form.Label>
          <CalendarField value={criteria.departureDate} min={minDate} onChange={(value) => update("departureDate", value)} isArabic={language === "ar"} showMessage={false} />
        </Col>
        <Col md={3}>
          <Form.Label>{language === "ar" ? "تاريخ العودة" : "Return date"}</Form.Label>
          <CalendarField value={criteria.returnDate} min={criteria.departureDate || minDate} onChange={(value) => update("returnDate", value)} isArabic={language === "ar"} showMessage={false} />
        </Col>
        {["adults", "children", "infants"].map((name) => (
          <Col md={2} key={name}>
            <Form.Label>{language === "ar" ? ({ adults: "بالغون", children: "أطفال", infants: "رضع" }[name]) : name}</Form.Label>
            <Form.Control type="number" min={name === "adults" ? 1 : 0} max={9} value={criteria[name]} onChange={(event) => update(name, Number(event.target.value))} />
          </Col>
        ))}
        <Col md={3}>
          <Form.Label>{language === "ar" ? "درجة المقصورة" : "Cabin class"}</Form.Label>
          <Form.Select value={criteria.cabinClass} onChange={(event) => update("cabinClass", event.target.value)}>
            {CABIN_OPTIONS.map(([value, ar, en]) => <option key={value} value={value}>{language === "ar" ? ar : en}</option>)}
          </Form.Select>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button className="w-100" onClick={search} disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />{language === "ar" ? "جارٍ البحث" : "Searching"}</> : (language === "ar" ? "بحث" : "Search")}
          </Button>
        </Col>
      </Row>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {!loading && !error && offers.length === 0 && <div className="text-muted mt-3">
        {hasSearched
          ? (language === "ar" ? "لا توجد رحلات مطابقة" : "No matching flights were found")
          : (language === "ar" ? "ابدأ البحث لعرض الرحلات المتاحة" : "Search to view available flights")}
      </div>}
      <div className="mt-3 d-grid gap-3">
        {offers.map((offer) => <Card key={offer.offerId}>
          <Card.Body>
            <div className="d-flex justify-content-between gap-3 flex-wrap">
              <div><strong>{offer.airline?.name || "—"}</strong><div>{offer.slices?.[0]?.origin?.code || offer.origin?.code} → {offer.slices?.[0]?.destination?.code || offer.destination?.code}</div></div>
              <div>{formatPrice(offer.pricing?.total, offer.pricing?.currency || "SAR")}</div>
              <Button variant="outline-primary" onClick={() => setSelectedOffer(offer)}>{language === "ar" ? "اختيار" : "Select"}</Button>
            </div>
            <OfferJourney offer={offer} language={language} />
          </Card.Body>
        </Card>)}
      </div>
    </section>
  );
}
