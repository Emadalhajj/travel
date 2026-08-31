import {
  getAllCountries,
  resetCountriesCacheForTests,
} from "./countries";

describe("countries reference cache", () => {
  let now;

  beforeEach(() => {
    resetCountriesCacheForTests();
    now = 3_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the local bilingual country reference and reuses its fresh result", async () => {
    const first = getAllCountries();
    const second = getAllCountries();

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(secondResult).toBe(firstResult);
    expect(firstResult).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SA" }),
    ]));

    expect(await getAllCountries()).toBe(firstResult);
  });

  it("rebuilds the local reference after five minutes", async () => {
    const first = await getAllCountries();
    now += 300_000;
    const second = await getAllCountries();

    expect(second).not.toBe(first);
    expect(second).toEqual(first);
  });
});
