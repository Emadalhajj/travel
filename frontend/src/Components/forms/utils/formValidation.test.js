import { validateFormField, validateFormFields } from "./formValidation";

describe("shared form validation", () => {
  it("returns immediate localized required and range messages", () => {
    expect(validateFormField({ required: true }, "", true)).toBe("هذا الحقل مطلوب");
    expect(validateFormField({ min: 1 }, 0, false)).toBe("Value must be at least 1");
  });

  it("maps nested required fields to their form paths", () => {
    expect(validateFormFields([
      { name: "location.country.ar", required: true },
      { name: "nameAr", required: true },
    ], { location: { country: { ar: "" } }, nameAr: "فندق" }, true)).toEqual({
      "location.country.ar": "هذا الحقل مطلوب",
    });
  });
});
