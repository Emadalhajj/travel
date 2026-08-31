import { ensureVisaTypes } from "./visaTypeSlice";

describe("visa types cache policy", () => {
  let now;

  beforeEach(() => {
    now = 2_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runEnsure = (visaTypes, options) => {
    const dispatch = jest.fn(() => ({ type: "request" }));
    const result = ensureVisaTypes(options)(dispatch, () => ({ visaTypes }));
    return { dispatch, result };
  };

  it("fetches on first use", () => {
    const { dispatch } = runEnsure({ visaTypes: [], loadedAt: null, loading: false });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("reuses data within five minutes", async () => {
    const items = [{ _id: "visa-type-1" }];
    const { dispatch, result } = runEnsure({
      visaTypes: items,
      loadedAt: now - 60_000,
      loading: false,
    });

    await expect(result).resolves.toEqual({ cached: true, data: items });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("fetches after cache expiry", () => {
    const { dispatch } = runEnsure({
      visaTypes: [{ _id: "visa-type-1" }],
      loadedAt: now - 300_000,
      loading: false,
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch a concurrent request", async () => {
    const { dispatch, result } = runEnsure({
      visaTypes: [],
      loadedAt: null,
      loading: true,
    });

    await expect(result).resolves.toEqual({ skipped: true });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
