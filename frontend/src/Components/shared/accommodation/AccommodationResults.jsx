import { Badge, Card, Col, Row } from "react-bootstrap";
import { BedDouble, MapPin, Star, Users } from "lucide-react";
import ActionButton from "../../common/buttons/ActionButton";
import EmptyState from "../common/EmptyState";
import { getProductSelectionId } from "../../../Utils/products/productSelection";

const localized = (item, key, isArabic) =>
  item?.[`${key}${isArabic ? "Ar" : "En"}`] ||
  item?.[`${key}${isArabic ? "En" : "Ar"}`] || "";

export const groupRoomsByHotel = (rooms = []) =>
  Array.from(rooms.reduce((groups, room) => {
    const id = String(room.hotel?._id || room.hotelId || "unknown");
    if (!groups.has(id)) groups.set(id, { hotel: room.hotel || {}, rooms: [] });
    groups.get(id).rooms.push(room);
    return groups;
  }, new Map()).values());

export default function AccommodationResults({
  rooms = [], selectedItems = [], onSelect, onRemove, isArabic = true,
}) {
  const selectedIds = new Set(selectedItems.map((item) => String(getProductSelectionId(item))));
  const groups = groupRoomsByHotel(rooms);
  if (!groups.length) return <EmptyState icon="🏨" title={isArabic ? "لا توجد أماكن إقامة مطابقة" : "No matching accommodation"} />;

  return <div className="d-flex flex-column gap-4" dir={isArabic ? "rtl" : "ltr"}>
    {groups.map(({ hotel, rooms: hotelRooms }) => {
      const hotelName = localized(hotel, "name", isArabic) || (isArabic ? "مكان إقامة" : "Accommodation");
      const image = hotel.images?.[0];
      const location = hotel.location?.city?.[isArabic ? "ar" : "en"] || hotel.location?.city?.ar || hotel.location?.city?.en || "";
      return <Card key={hotel._id || hotelName} className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Row className="g-0">
          <Col xs={12} md={4} lg={3}>
            {image ? <img src={image} alt={hotelName} loading="lazy" decoding="async" className="w-100 h-100 object-fit-cover" style={{ minHeight: 210 }} /> :
              <div className="h-100 d-flex align-items-center justify-content-center bg-light" style={{ minHeight: 210 }}><BedDouble size={48} aria-hidden="true" /></div>}
          </Col>
          <Col xs={12} md={8} lg={9}>
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div><h3 className="h5 fw-bold mb-1">{hotelName}</h3>
                  {location && <span className="text-muted small"><MapPin size={15} aria-hidden="true" /> {location}</span>}
                </div>
                <div aria-label={`${hotel.stars || 0} stars`}>{Array.from({ length: Number(hotel.stars || 0) }, (_, i) => <Star key={i} size={16} fill="currentColor" className="text-warning" />)}</div>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-3">{(hotel.facilities || []).slice(0, 4).map((facility) => <Badge bg="light" text="dark" key={facility}>{facility}</Badge>)}</div>
              <div className="d-flex flex-column gap-3">
                {hotelRooms.map((room) => {
                  const id = String(getProductSelectionId(room)); const selected = selectedIds.has(id);
                  const capacity = Number(room.totalOccupancy || (Number(room.capacity?.maxAdults || 0) + Number(room.capacity?.maxChildren || 0)));
                  return <div key={id} className={`border rounded-3 p-3 ${selected ? "border-success bg-success-subtle" : ""}`}>
                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                      <div><h4 className="h6 fw-bold">{localized(room, "name", isArabic)}</h4>
                        <div className="small text-muted d-flex flex-wrap gap-3">
                          <span><Users size={15} /> {capacity} {isArabic ? "ضيوف" : "guests"}</span>
                          {room.bedType && <span>{isArabic ? "السرير" : "Bed"}: {room.bedType}</span>}
                          {room.mealPlan && <span>{isArabic ? "الوجبات" : "Meal"}: {room.mealPlan}</span>}
                          {room.availableCount != null && <span>{isArabic ? "المتاح" : "Available"}: {room.availableCount}</span>}
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-lg-end gap-2">
                        <strong className="text-success">{Number(room.price || 0).toLocaleString()} {room.currency || "SAR"} <small>{isArabic ? "/ ليلة" : "/ night"}</small></strong>
                        <ActionButton action={selected ? "delete" : "add"} label={selected ? (isArabic ? "إزالة" : "Remove") : (isArabic ? "اختيار الغرفة" : "Select room")} onClick={() => selected ? onRemove(room) : onSelect(room)} disabled={room.availability?.available === false} />
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>;
    })}
  </div>;
}
