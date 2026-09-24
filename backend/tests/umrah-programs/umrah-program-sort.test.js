import test from "node:test";
import assert from "node:assert/strict";

import { buildUmrahProgramSort } from "../../utils/buildUmrahProgramSort.js";

test("buildUmrahProgramSort accepts the admin product sort contract", () => {
  assert.deepEqual(buildUmrahProgramSort({ sort: "pricing.basePrice_asc" }), {
    "pricing.basePrice": 1,
  });
  assert.deepEqual(buildUmrahProgramSort({ sort: "pricing.basePrice_desc" }), {
    "pricing.basePrice": -1,
  });
  assert.deepEqual(buildUmrahProgramSort({ sort: "createdAt_asc" }), {
    createdAt: 1,
  });
  assert.deepEqual(buildUmrahProgramSort({ sort: "createdAt_desc" }), {
    createdAt: -1,
  });
});
