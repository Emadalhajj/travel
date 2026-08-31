import reducer, {
  ensurePublicDraftBooking,
  updatePublicDraftBooking,
} from "./bookingSlice";

describe("public draft reuse policy", () => {
  const draft = { _id: "draft-1", customer: { name: "Test" } };
  let now;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runEnsure = (publicBooking, draftId = "draft-1", options) => {
    const dispatched = { type: "request" };
    const dispatch = jest.fn(() => dispatched);
    const result = ensurePublicDraftBooking(draftId, options)(
      dispatch,
      () => ({ publicBooking }),
    );
    return { dispatch, result, dispatched };
  };

  it("fetches when Redux has no draft", () => {
    const { dispatch, result, dispatched } = runEnsure({
      draftBooking: null,
      draftLoadedAt: null,
      draftLoading: false,
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(result).toBe(dispatched);
  });

  it("reuses the same fresh draft", async () => {
    const { dispatch, result } = runEnsure({
      draftBooking: draft,
      draftLoadedAt: now - 30_000,
      draftLoading: false,
    });

    await expect(result).resolves.toEqual({ cached: true, data: draft });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each([
    ["a different draft", "draft-2", 30_000, undefined],
    ["an expired draft", "draft-1", 60_000, undefined],
    ["a forced refresh", "draft-1", 30_000, { force: true }],
  ])("fetches for %s", (_label, draftId, age, options) => {
    const { dispatch } = runEnsure({
      draftBooking: draft,
      draftLoadedAt: now - age,
      draftLoading: false,
    }, draftId, options);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("refreshes draftLoadedAt after an update", () => {
    const next = reducer(undefined, updatePublicDraftBooking.fulfilled({ data: draft }));

    expect(next.draftBooking).toEqual(draft);
    expect(next.draftLoadedAt).toBe(now);
  });
});
