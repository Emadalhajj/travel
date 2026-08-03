/*
useFormInitializer.js

وظيفته:

تهيئة النموذج عند الفتح.
*/
import { useEffect } from "react";
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
  useEffect(() => {
    if (!show) return;

    const conditionalFields =
      Object.values(
        config.conditionalFields ||
          {},
      ).flat();

    let initial = {
      specs:
        initialData?.specs || {},
      attachments:
        initialData?.attachments ||
        [],
      deleteAttachments: [],
    };

    const fields = [
      ...(config.commonFields ||
        []),
      ...conditionalFields,
    ].filter(Boolean);

    fields.forEach((field) => {
      if (
        field.name === "images"
      )
        return;

      const value =
        get(
          initialData,
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
    config,
    initialData,
    setFormState,
    setImageState,
  ]);
}
