import { fireEvent, render, screen } from "@testing-library/react";

import ProgramCard from "./ProgramCard";

test("renders the public list DTO with its single projected image", () => {
  const onViewDetails = jest.fn();
  render(
    <ProgramCard
      program={{
        _id: "program-1",
        nameEn: "Umrah Program",
        shortDescriptionEn: "A lightweight card description",
        serviceLevel: "premium",
        durationDays: 7,
        capacity: { availableSeats: 12 },
        pricing: { totalPrice: 2500, currency: "SAR" },
        images: [{ url: "/uploads/umrah-programs/card.jpg" }],
      }}
      isArabic={false}
      t={(_key, fallback) => fallback}
      onViewDetails={onViewDetails}
    />,
  );

  expect(screen.getByText("Umrah Program")).toBeTruthy();
  expect(screen.getByText("A lightweight card description")).toBeTruthy();
  expect(screen.getByText("12")).toBeTruthy();
  expect(screen.getByRole("img").getAttribute("src")).toContain("card.jpg");

  fireEvent.click(screen.getByRole("button", { name: "عرض التفاصيل" }));
  expect(onViewDetails).toHaveBeenCalledTimes(1);
});
