import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccommodationResults, { groupRoomsByHotel } from "./AccommodationResults";

const rooms = [
  { _id: "r1", productId: "r1", nameAr: "ديلوكس", nameEn: "Deluxe", hotelId: "h1", hotel: { _id: "h1", nameAr: "فندق مكة", nameEn: "Makkah Hotel", stars: 5 }, capacity: { maxAdults: 2, maxChildren: 1 }, price: 300, currency: "SAR", availableCount: 2 },
  { _id: "r2", productId: "r2", nameAr: "عائلية", nameEn: "Family", hotelId: "h1", hotel: { _id: "h1", nameAr: "فندق مكة", nameEn: "Makkah Hotel", stars: 5 }, totalOccupancy: 4, price: 500, currency: "SAR", availableCount: 1 },
];

test("groups multiple sellable room types beneath one hotel", () => {
  const grouped = groupRoomsByHotel(rooms);
  expect(grouped).toHaveLength(1);
  expect(grouped[0].rooms).toHaveLength(2);
});

test("renders localized hotel rooms and selects only the room product", () => {
  const onSelect = jest.fn();
  render(<MemoryRouter><AccommodationResults rooms={rooms} onSelect={onSelect} isArabic /></MemoryRouter>);
  expect(screen.getByText("فندق مكة")).toBeTruthy();
  expect(screen.getByText("ديلوكس")).toBeTruthy();
  expect(screen.getByText("عائلية")).toBeTruthy();
  fireEvent.click(screen.getAllByRole("button", { name: "اختيار الغرفة" })[0]);
  expect(onSelect).toHaveBeenCalledWith(rooms[0]);
});

test("renders English labels in LTR mode", () => {
  render(<MemoryRouter><AccommodationResults rooms={[rooms[0]]} isArabic={false} /></MemoryRouter>);
  expect(screen.getByText("Makkah Hotel")).toBeTruthy();
  expect(screen.getByText("Deluxe")).toBeTruthy();
});
