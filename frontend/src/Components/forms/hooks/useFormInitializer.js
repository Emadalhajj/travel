/*
useFormInitializer.js

وظيفته:

تهيئة النموذج عند الفتح.
*/
import { useEffect, useRef } from "react";
import {
  get,
  set,
} from "../utils/objectPath";

export default function useFormInitializer({
  show,
  config,
  initialData,
  setFormState,
  setImageState,
}) {
  const configRef = useRef(config);
  const initialDataRef = useRef(initialData);
  configRef.current = config;
  initialDataRef.current = initialData;

  useEffect(() => {
    if (!show) return;

    const currentConfig = configRef.current;
    const currentInitialData = initialDataRef.current;

    const conditionalFields =
      Object.values(
        currentConfig.conditionalFields ||
          {},
      ).flat();

    let initial = {
      specs:
        currentInitialData?.specs || {},
      attachments:
        currentInitialData?.attachments ||
        [],
      deleteAttachments: [],
    };

    const fields = [
      ...(currentConfig.commonFields ||
        []),
      ...conditionalFields,
    ].filter(Boolean);

    fields.forEach((field) => {
      // Image fields are managed consistently by ImageUploader/imageState,
      // regardless of whether the API field is named images or profileImage.
      if (field.type === "file") return;

      const value =
        get(
          currentInitialData,
          field.name,
        ) ??
        field.defaultValue ??
        "";

      initial = set(
        initial,
        field.name,
        value,
      );
    });

    setFormState(initial);
    setImageState?.({});
  }, [
    show,
    setFormState,
    setImageState,
  ]);
}
