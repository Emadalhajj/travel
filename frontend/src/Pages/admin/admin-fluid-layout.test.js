import fs from "node:fs";
import path from "node:path";

const collectSourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.")
      ? [entryPath]
      : [];
  });

test("all admin pages use the fluid layout instead of a width-limited Bootstrap container", () => {
  const adminDirectory = path.resolve(__dirname);
  const offenders = collectSourceFiles(adminDirectory)
    .filter((file) => /className=["'][^"']*\bcontainer\b(?!-fluid)/.test(fs.readFileSync(file, "utf8")))
    .map((file) => path.relative(adminDirectory, file));

  expect(offenders).toEqual([]);
  expect(fs.readFileSync(path.join(adminDirectory, "AdminLayout.jsx"), "utf8"))
    .toMatch(/<main className="container-fluid/);
});
