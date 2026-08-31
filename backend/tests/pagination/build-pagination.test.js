import assert from "node:assert/strict";
import test from "node:test";

import { buildPagination } from "../../utils/Builders/buildPagination.js";

test("pagination uses stable defaults for missing and invalid values", () => {
  for (const input of [
    undefined,
    {},
    { page: 0, limit: 0 },
    { page: -1, limit: -1 },
    { page: "abc", limit: "abc" },
    { page: Number.MAX_VALUE, limit: Number.MAX_VALUE },
  ]) {
    assert.deepEqual(buildPagination(input), { page: 1, limit: 10, skip: 0 });
  }
});

test("pagination floors positive values and caps limit at 100", () => {
  assert.deepEqual(buildPagination({ page: "3.9", limit: "25.8" }), {
    page: 3,
    limit: 25,
    skip: 50,
  });
  assert.deepEqual(buildPagination({ page: 2, limit: 1000 }), {
    page: 2,
    limit: 100,
    skip: 100,
  });
});
