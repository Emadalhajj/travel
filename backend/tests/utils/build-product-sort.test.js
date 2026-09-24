import test from "node:test";
import assert from "node:assert/strict";

import { buildProductSort } from "../../utils/buildProductSort.js";

test("buildProductSort supports the configured product price field", () => {
  assert.deepEqual(
    buildProductSort({
      value: "pricing.basePrice_asc",
      priceField: "pricing.basePrice",
    }),
    { "pricing.basePrice": 1 },
  );
  assert.deepEqual(
    buildProductSort({ value: "price_desc", priceField: "price" }),
    { price: -1 },
  );
});

test("buildProductSort supports creation date and rejects arbitrary fields", () => {
  assert.deepEqual(
    buildProductSort({ value: "createdAt_asc", priceField: "price" }),
    { createdAt: 1 },
  );
  assert.deepEqual(
    buildProductSort({ value: "currency_asc", priceField: "price" }),
    { createdAt: -1 },
  );
  assert.deepEqual(buildProductSort(), { createdAt: -1 });
});
