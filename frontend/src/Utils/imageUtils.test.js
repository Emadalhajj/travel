import { formatImagePath } from "./imageUtils";

describe("formatImagePath", () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;

  afterEach(() => {
    process.env.REACT_APP_API_URL = originalApiUrl;
  });

  test("uses the current origin for relative API configuration", () => {
    process.env.REACT_APP_API_URL = "/api";

    expect(formatImagePath("/uploads/hotels/example.jpg")).toBe(
      "/uploads/hotels/example.jpg",
    );
  });

  test("uses the configured API origin for absolute API configuration", () => {
    process.env.REACT_APP_API_URL = "https://api.example.test/api";

    expect(formatImagePath("hotels/example.jpg")).toBe(
      "https://api.example.test/uploads/hotels/example.jpg",
    );
  });

  test("preserves absolute and browser-owned URLs", () => {
    expect(formatImagePath("https://cdn.example.test/example.jpg")).toBe(
      "https://cdn.example.test/example.jpg",
    );
    expect(formatImagePath("blob:example")).toBe("blob:example");
  });
});
