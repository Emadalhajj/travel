import { fireEvent, render, screen } from "@testing-library/react";

import "../../i18n";
import CustomSelect from "./CustomSelecte";

test("renders one All option when options also contain an empty value", () => {
  render(
    <CustomSelect
      value=""
      onChange={() => {}}
      ariaLabel="Country"
      placeholder="Select Country"
      options={[
        { value: "", labelAr: "الكل", labelEn: "All" },
        { value: "SA", labelAr: "السعودية", labelEn: "Saudi Arabia" },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Country" }));
  expect(screen.getByRole("button", { name: "Country" }).textContent).toContain("Select Country");
  expect(screen.getAllByRole("option", { name: "All" })).toHaveLength(1);
  expect(screen.getByRole("option", { name: "Saudi Arabia" })).toBeTruthy();
});

test("keeps the filter name in the field when an empty default option is configured", () => {
  render(
    <CustomSelect
      value=""
      onChange={() => {}}
      ariaLabel="Sort"
      placeholder="Sort by price"
      showAllOption={false}
      options={[
        { value: "", labelAr: "الافتراضي", labelEn: "Default" },
        { value: "price_asc", labelAr: "الأقل سعراً", labelEn: "Lowest price" },
      ]}
    />,
  );

  expect(screen.getByRole("button", { name: "Sort" }).textContent).toContain("Sort by price");
  fireEvent.click(screen.getByRole("button", { name: "Sort" }));
  expect(screen.getByRole("option", { name: "Default" })).toBeTruthy();
});
