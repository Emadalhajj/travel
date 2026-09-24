const getUploadsBaseUrl = () => {
  const apiBaseUrl = process.env.REACT_APP_API_URL || "/api";

  if (!/^https?:\/\//i.test(apiBaseUrl)) return "/uploads";

  try {
    return `${new URL(apiBaseUrl).origin}/uploads`;
  } catch {
    return "/uploads";
  }
};

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
  return `${getUploadsBaseUrl()}/${uploadPath.replace(/^\/+/, "")}`;
};
