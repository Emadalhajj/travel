import { buildPaymentConfigurationListQuery } from "./AdminPaymentConfigurationsPage";

describe("AdminPaymentConfigurationsPage list query", () => {
  it("keeps search, filters, and pagination as an object for the API layer", () => {
    const query = buildPaymentConfigurationListQuery(
      {
        search: "مدى",
        sectionCode: "BOOKING",
        isActive: "true",
      },
      2,
      25,
    );

    expect(query).toEqual({
      search: "مدى",
      sectionCode: "BOOKING",
      isActive: "true",
      page: 2,
      limit: 25,
    });
    expect(query).not.toBeInstanceOf(URLSearchParams);
  });
});
