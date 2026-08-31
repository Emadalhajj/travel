import reducer, { createNewTrip, fetchTrips } from "./tripSlice";

describe("trip errors isolation", () => {
  it("keeps a create validation error out of the list error overlay", () => {
    const listFailure = reducer(undefined, {
      type: fetchTrips.rejected.type,
      payload: "List failed",
    });
    expect(listFailure.error).toBe("List failed");

    const mutationFailure = reducer(undefined, {
      type: createNewTrip.rejected.type,
      payload: { "capacity.maxAdults": "Must be at least 1" },
    });
    expect(mutationFailure.error).toBeNull();
    expect(mutationFailure.mutationError).toEqual({
      "capacity.maxAdults": "Must be at least 1",
    });
  });
});
