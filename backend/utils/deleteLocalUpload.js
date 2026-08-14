import fs from "fs/promises";
import path from "path";

/*
=====================================================
deleteLocalUpload
=====================================================

يحذف ملف Upload محلي بشكل آمن.

- لا يتعامل مع Business Logic.
- لا يحذف روابط خارجية.
- يمنع Path Traversal.
- يمكن تقييده بمجلد معين.
- عدم وجود الملف لا يعتبر خطأ.
=====================================================
*/
export const deleteLocalUpload = async ({
  filePath,
  allowedFolder = "uploads",
}) => {
  if (!filePath || typeof filePath !== "string") return false;

  const normalizedPath = filePath.trim().replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith("//")) {
    return false;
  }

  const relativePath = normalizedPath.replace(/^\/+/, "");
  const allowedDirectory = path.resolve(process.cwd(), allowedFolder);
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (
    absolutePath !== allowedDirectory &&
    !absolutePath.startsWith(`${allowedDirectory}${path.sep}`)
  ) {
    return false;
  }

  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
};
