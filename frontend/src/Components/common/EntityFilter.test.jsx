import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import i18n from "../../i18n";
import EntityFilter, { resolveFilterPlaceholder } from "./EntityFilter";

test("infers an in-field name for select filters without a page placeholder", async () => {
  await i18n.changeLanguage("en");
  expect(resolveFilterPlaceholder({ key: "currency", field: {}, lang: "en" })).toBe("Currency");
  expect(resolveFilterPlaceholder({ key: "isActive", field: {}, lang: "ar" })).toBe("الحالة");

  render(
    <MemoryRouter>
      <EntityFilter
        filters={{ currency: "" }}
        setFilters={() => {}}
        config={{ currency: { type: "select", options: [] } }}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("button", { name: "Currency" }).textContent).toContain("Currency");
  expect(screen.getByRole("button", { name: "Currency" }).className).toContain("entity-filter-control");
});

test("uses the same visual class for search and regular text filters", async () => {
  await i18n.changeLanguage("en");
  render(
    <MemoryRouter>
      <EntityFilter
        filters={{ search: "", origin: "" }}
        setFilters={() => {}}
        config={{
          search: { type: "text", placeholder: "Search by name" },
          origin: { type: "text", placeholder: "Origin" },
        }}
      />
    </MemoryRouter>,
  );

  expect(screen.getByPlaceholderText("Search by name").className).toContain("entity-filter-control");
  expect(screen.getByPlaceholderText("Origin").className).toContain("entity-filter-control");
});

test("uses the shared filter control styling for date fields", async () => {
  await i18n.changeLanguage("ar");
  render(
    <MemoryRouter>
      <EntityFilter
        filters={{ fromDate: "" }}
        setFilters={() => {}}
        config={{ fromDate: { type: "date" } }}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("button", { name: "اختر التاريخ" }).className).toContain(
    "entity-filter-control",
  );
});
