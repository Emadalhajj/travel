import { serializeForApi } from "./serialize";

describe("serializeForApi checkbox-group contract", () => {
  it("serializes an empty optional array field as an array", () => {
    const config = {
      commonFields: [{ name: "segments", type: "array" }],
    };

    expect(serializeForApi({ segments: "" }, config)).toEqual({
      segments: [],
    });
  });

  it("preserves objects inside configured array fields", () => {
    const config = {
      commonFields: [{ name: "routeStops", type: "array" }],
    };

    expect(serializeForApi({
      routeStops: [{ location: "جدة", notes: "المحطة الأولى" }],
    }, config)).toEqual({
      routeStops: [{ location: "جدة", notes: "المحطة الأولى" }],
    });
  });

  it("keeps object-mode features as the object expected by Transport", () => {
    const config = {
      commonFields: [{
        name: "features",
        type: "checkbox-group",
        valueMode: "object",
      }],
    };

    expect(serializeForApi({
      features: { wifi: true, ac: true, meals: false },
    }, config)).toEqual({
      features: { wifi: true, ac: true, meals: false },
    });
  });

  it("preserves the existing array contract for ordinary checkbox groups", () => {
    const config = {
      commonFields: [{ name: "facilities", type: "checkbox-group" }],
    };

    expect(serializeForApi({
      facilities: { wifi: true, pool: false },
    }, config)).toEqual({ facilities: ["wifi"] });
  });
});
