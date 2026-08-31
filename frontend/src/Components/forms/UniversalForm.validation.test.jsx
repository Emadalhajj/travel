import { fireEvent, render, screen } from "@testing-library/react";
import UniversalForm from "./UniversalForm";

const config = {
  conditionKey: "tripType",
  commonFields: [
    {
      name: "tripType",
      labelAr: "نوع الرحلة",
      labelEn: "Trip type",
      type: "select",
      options: [{ value: "transport", labelAr: "نقل", labelEn: "Transport" }],
    },
    {
      name: "capacity.maxAdults",
      labelAr: "عدد البالغين",
      labelEn: "Max adults",
      type: "number",
      required: true,
      min: 1,
    },
  ],
  conditionalFields: { transport: [] },
};

describe("UniversalForm field errors", () => {
  it("shows immediate and backend errors below a nested conditional field", async () => {
    const { rerender } = render(
      <UniversalForm
        config={config}
        initialData={{ tripType: "transport", capacity: { maxAdults: 1 } }}
      />,
    );

    const input = await screen.findByRole("spinbutton");
    fireEvent.change(input, { target: { value: "0" } });
    expect(await screen.findByText("يجب ألا تقل القيمة عن 1")).toBeTruthy();

    rerender(
      <UniversalForm
        config={config}
        initialData={{ tripType: "transport", capacity: { maxAdults: 1 } }}
        errors={{ "capacity.maxAdults": "خطأ قادم من الخادم" }}
      />,
    );
    expect(await screen.findByText("خطأ قادم من الخادم")).toBeTruthy();
  });
});
