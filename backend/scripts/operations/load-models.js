import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const modelsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../models");

const modelFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return modelFiles(fullPath);
    if (!entry.name.endsWith(".js") || fullPath.includes(`${path.sep}shared${path.sep}`)) return [];
    return [fullPath];
  });

export const loadAllModels = async () => {
  for (const filePath of modelFiles(modelsRoot)) await import(pathToFileURL(filePath));
};
