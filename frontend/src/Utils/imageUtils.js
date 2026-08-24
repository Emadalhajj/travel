const UPLOADS_BASE_URL = "http://localhost:5000/uploads";

export const formatImagePath = (
  image,
  { fallback = "/placeholder-image.png" } = {},
) => {
  if (!image) return fallback;

  if (
    typeof File !== "undefined" &&
    (image instanceof File ||
      (typeof Blob !== "undefined" && image instanceof Blob))
  ) {
    return URL.createObjectURL(image);
  }

  const rawPath =
    typeof image === "string"
      ? image
      : image?.url || image?.path || image?.filename;

  if (!rawPath) return fallback;

  const normalizedPath = String(rawPath).trim().replace(/\\/g, "/");
  if (!normalizedPath) return fallback;
  if (/^(https?:|data:|blob:)/i.test(normalizedPath)) return normalizedPath;

  const uploadPath = normalizedPath.replace(/^\/?uploads\/?/i, "");
  return `${UPLOADS_BASE_URL}/${uploadPath.replace(/^\/+/, "")}`;
};
