import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { resolveUploadDirectory } from "../../middleware/upload/uploadFactory.js";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("upload destinations reject malformed and traversal values", () => {
  for (const folder of [undefined, null, {}, "[object Object]", "undefined", "null", "../hotels"] ) {
    assert.throws(() => resolveUploadDirectory({ folder }), /Invalid upload destination/);
  }
  assert.match(resolveUploadDirectory({ folder: "hotels" }), /uploads[\\/]hotels$/);
});

test("hotel images stay public while attachments use private storage", () => {
  const presets = read("../../middleware/upload/uploadPresets.js");
  assert.match(presets, /folder:\s*"hotels"/);
  assert.match(presets, /attachments:\s*\{[\s\S]*folder:\s*"hotel-attachments"[\s\S]*storageRoot:\s*"private-uploads"/);
});

test("hotel private downloads require admin authorization", () => {
  const routes = read("../../routes/private-file-routes.js");
  assert.match(routes, /"\/private-files\/hotels\/:hotelId\/:attachmentId"[\s\S]*protect[\s\S]*authorize\("admin",\s*"superAdmin"\)/);
});

test("public accommodation projection does not expose attachments", () => {
  const availability = read("../../services/availability/accommodation-availability-service.js");
  const publicSelect = availability.match(/const publicHotelSelect = \[([\s\S]*?)\]\.join/);
  assert.ok(publicSelect);
  assert.doesNotMatch(publicSelect[1], /attachments/);
});

test("public static hotel documents are blocked before static uploads", () => {
  const server = read("../../server.js");
  const blockIndex = server.indexOf('app.use("/uploads/hotels"');
  const staticIndex = server.indexOf('app.use("/uploads", express.static');
  assert.ok(blockIndex >= 0 && staticIndex > blockIndex);
  assert.match(server.slice(blockIndex, staticIndex), /pdf\|doc\|docx/);
  assert.match(server.slice(0, staticIndex), /object%20Object/);
});
