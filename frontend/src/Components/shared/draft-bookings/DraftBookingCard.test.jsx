import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import DraftBookingCard from "./DraftBookingCard";

test("renders the lightweight draft list contract without requiring travelers", () => {
  render(
    <MemoryRouter>
      <DraftBookingCard
        draft={{
          _id: "draft-1",
          status: "draft",
          currentStep: "payment",
          customer: { name: "Customer" },
          program: { nameEn: "Program" },
          travelersCount: 3,
          createdAt: "2026-08-26T00:00:00.000Z",
        }}
        isArabic={false}
        t={(_key, fallback) => fallback}
        onView={() => {}}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText("Customer")).toBeTruthy();
  expect(screen.getByText("Program")).toBeTruthy();
  expect(screen.getByText("3")).toBeTruthy();
});
