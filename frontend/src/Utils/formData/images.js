export const withExistingImages = (fd, currentImages = []) => {
  const requestData = new FormData();

  [...fd.entries()].forEach(([key, value]) => {
    if (key !== "data") {
      requestData.append(key, value);
    }
  });

  const rawDataEntry = fd.get("data");
  const parsedData = rawDataEntry ? JSON.parse(rawDataEntry) : {};

  const deletedImages = [...fd.entries()]
    .filter(([key]) => key === "imagesDeleted[]")
    .map(([, value]) => value);

  const existingImages = currentImages
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean)
    .filter((img) => !deletedImages.includes(img));

  requestData.set(
    "data",
    JSON.stringify({
      ...parsedData,
      existingImages,
    })
  );

  return requestData;
};
