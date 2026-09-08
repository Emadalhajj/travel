import { StrictMode } from "react";
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
  it("preserves conditional array values during edit in StrictMode", async () => {
    const editConfig = {
      conditionKey: "type",
      commonFields: [{
        name: "type",
        labelAr: "النوع",
        labelEn: "Type",
        type: "select",
        options: [{ value: "LAND", labelAr: "بري", labelEn: "Land" }],
      }],
      conditionalFields: {
        LAND: [{
          name: "routeStops",
          labelAr: "محطات المسار",
          labelEn: "Route stops",
          type: "array",
          fields: [{ name: "location", labelAr: "الموقع", labelEn: "Location" }],
        }],
      },
    };

    render(
      <StrictMode>
        <UniversalForm
          config={editConfig}
          initialData={{
            type: "LAND",
            routeStops: [{ location: "تعز" }, { location: "عدن" }],
          }}
        />
      </StrictMode>,
    );

    expect(await screen.findByDisplayValue("تعز")).toBeTruthy();
    expect(await screen.findByDisplayValue("عدن")).toBeTruthy();
  });

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
