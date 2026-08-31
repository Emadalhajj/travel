import assert from "node:assert/strict";
import test from "node:test";

import { mapWithConcurrency } from "../../utils/async/mapWithConcurrency.js";

test("mapWithConcurrency caps active workers and preserves result order", async () => {
  let active = 0;
  let maximumActive = 0;
  const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (value) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, value % 2 ? 4 : 1));
    active -= 1;
    return value * 10;
  });

  assert.equal(maximumActive, 2);
  assert.deepEqual(results, [10, 20, 30, 40, 50, 60]);
});
