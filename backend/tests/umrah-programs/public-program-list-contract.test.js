import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicProgramListPipeline,
} from "../../services/umrah-programs/umrah-program-service.js";

test("public program list projects only ProgramCard fields and one image URL", () => {
  const filter = { isDeleted: false, isActive: true, status: "active" };
  const pipeline = buildPublicProgramListPipeline({
    filter,
    sortOption: { createdAt: -1 },
    skip: 10,
    limit: 5,
  });
  const project = pipeline.at(-1).$project;

  assert.deepEqual(pipeline.slice(0, 4), [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $skip: 10 },
    { $limit: 5 },
  ]);
  assert.deepEqual(project.images, {
    $map: {
      input: { $slice: [{ $ifNull: ["$images", []] }, 1] },
      as: "image",
      in: { url: "$$image.url" },
    },
  });

  for (const field of [
    "items",
    "hotel",
    "transport",
    "visa",
    "includes",
    "excludes",
    "termsAr",
    "termsEn",
    "createdBy",
    "updatedBy",
    "deletedBy",
  ]) {
    assert.equal(Object.hasOwn(project, field), false);
  }
});

test("public list optimization remains separate from details and admin queries", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(
    new URL("../../services/umrah-programs/umrah-program-service.js", import.meta.url),
    "utf8",
  ));

  assert.match(source, /getAllUmrahPrograms[\s\S]*UmrahProgram\.find\(filter\)/);
  assert.match(source, /getPublicUmrahProgramById[\s\S]*UmrahProgram\.findOne\(/);
});
