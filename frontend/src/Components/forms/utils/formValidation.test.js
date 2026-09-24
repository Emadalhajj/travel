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

  it("validates configured Arabic and English fields without blocking acronyms", () => {
    expect(validateFormField({ language: "ar" }, "رحلة VIP مكة", true)).toBe("");
    expect(validateFormField({ language: "ar" }, "Makkah Trip", true)).toBe(
      "يرجى إدخال النص باللغة العربية",
    );
    expect(validateFormField({ language: "en" }, "Makkah - Madinah 2026", false)).toBe("");
    expect(validateFormField({ language: "en" }, "رحلة مكة", false)).toBe(
      "Please enter this text in English",
    );
  });

  it("infers language validation from localized field names", () => {
    expect(validateFormField({ name: "descriptionAr" }, "English text", true)).toBe(
      "يرجى إدخال النص باللغة العربية",
    );
    expect(validateFormField({ path: "location.nameEn" }, "نص عربي", true)).toBe(
      "يرجى إدخال النص باللغة الإنجليزية",
    );
  });

  it("passes the complete form state to business-aware field validators", () => {
    const formState = { capacity: { totalSeats: 45 } };
    const field = { validate: (value, state) => state.capacity.totalSeats === value || "invalid" };
    expect(validateFormField(field, 45, true, formState)).toBe("");
  });
});
