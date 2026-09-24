import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";
import "dotenv/config";

import { getDatabaseConfig } from "./database-safety.js";
import { loadAllModels } from "./load-models.js";

const relevantOptions = (index = {}) => Object.fromEntries(
  ["unique", "sparse", "partialFilterExpression", "expireAfterSeconds", "collation"]
    .filter((key) => index[key] !== undefined)
    .map((key) => [key, index[key]]),
);

const { uri, dbName } = getDatabaseConfig();
await loadAllModels();
const expectedCount = mongoose.modelNames().reduce(
  (count, name) => count + mongoose.model(name).schema.indexes().length,
  0,
);
if (expectedCount !== 132) throw new Error(`Schema index baseline changed: expected 132, found ${expectedCount}`);

await mongoose.connect(uri, { dbName, autoIndex: false });
const report = { expected: expectedCount, matched: 0, missing: [], conflicting: [], duplicateKeys: [], failedCollections: [] };
try {
  for (const name of mongoose.modelNames()) {
    const model = mongoose.model(name);
    let actual;
    try {
      actual = await model.collection.indexes();
    } catch (error) {
      if (error?.codeName === "NamespaceNotFound") actual = [];
      else {
        report.failedCollections.push({ collection: model.collection.name, error: error?.message });
        continue;
      }
    }
    const groups = new Map();
    for (const item of actual.filter((item) => item.name !== "_id_")) {
      const key = JSON.stringify(item.key);
      groups.set(key, [...(groups.get(key) || []), item]);
    }
    for (const [fields, options] of model.schema.indexes()) {
      const candidates = groups.get(JSON.stringify(fields)) || [];
      const match = candidates.find((item) => isDeepStrictEqual(relevantOptions(item), relevantOptions(options)));
      if (match) report.matched += 1;
      else if (candidates.length) report.conflicting.push({ model: name, fields, expectedOptions: relevantOptions(options), actual: candidates.map((item) => ({ name: item.name, options: relevantOptions(item) })) });
      else report.missing.push({ model: name, fields, expectedOptions: relevantOptions(options) });
    }
    const expectedGroups = new Map();
    for (const [fields, options] of model.schema.indexes()) {
      const key = JSON.stringify(fields);
      expectedGroups.set(key, [...(expectedGroups.get(key) || []), relevantOptions(options)]);
    }
    for (const [key, items] of groups) {
      const declared = expectedGroups.get(key) || [];
      const undeclared = items.filter((item) => !declared.some((options) =>
        isDeepStrictEqual(relevantOptions(item), options),
      ));
      if (undeclared.length) report.duplicateKeys.push({ model: name, fields: JSON.parse(key), names: undeclared.map((item) => item.name) });
    }
  }
} finally {
  await mongoose.disconnect();
}

report.ok = report.matched === report.expected && !report.missing.length && !report.conflicting.length && !report.duplicateKeys.length && !report.failedCollections.length;
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
