import { useCallback } from "react";
import { formatImagePath } from "../Utils/imageUtils";

export const useImagePath = () => {
  const getImageUrl = useCallback(
    (image) => formatImagePath(image, { fallback: null }),
    [],
  );

  return { getImageUrl };
};
