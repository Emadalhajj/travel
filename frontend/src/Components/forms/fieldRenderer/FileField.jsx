/*
الصور والمرفقات
FileField.jsx

وظيفته:

إدارة الصور والمرفقات.
*/
import ImageUploader from "../../common/ImageUploader";
import { useMemo } from "react";

import FileAttachmentUploader from "../../common/FileAttachmentUploader";

import { set, get } from "../utils/objectPath";

const EMPTY_FILES = [];

export default function FileField(
  props,
) {

  const {
    field,
    setFormState,
    initialData,
    setImageState,
    isArabic,
    helpers,
  } = props;

  const value =
    helpers.getFieldValue(
      field,
    ) || EMPTY_FILES;

  const currentImages = initialData?.[field.name] || value;
  const normalizedInitialImages = useMemo(
    () => Array.isArray(currentImages)
      ? currentImages
      : currentImages
        ? [currentImages]
        : [],
    [currentImages],
  );

  if (
    field.type ===
    "file-attachment"
  ) {

    return (
      <FileAttachmentUploader

        name={field.name}
        multiple={field.multiple !== false}
        maxFiles={field.maxFiles || 8}
        maxSizeMB={field.maxSizeMB || 15}
        initialFiles={
          value
        }

        onChange={(
          files,
        ) => {

          setFormState((prev) =>
            set(prev, helpers.getFieldStatePath(field), files),
          );

        }}

        onDeleteExisting={(file) => {
          setFormState((prev) => {
            const currentDeleted =
              get(prev, "deleteAttachments") || [];

            return set(
              prev,
              "deleteAttachments",
              [
                ...currentDeleted,
                file?.url || file,
              ],
            );
          });
        }}

      />
    );

  }

  return (
    <ImageUploader

      initialImages={
        normalizedInitialImages
      }

      multiple={field.multiple !== false}

      maxImages={field.maxImages || 10}

      label={
        isArabic
          ? field.labelAr
          : field.labelEn
      }

      showLabel={false}

      className={field.previewClassName || ""}

      onChange={(data) =>
        setImageState((prev) => ({
          ...prev,
          [field.name]: {
            newImages: data.newImages || [],
            deletedOldImages: data.deletedOldImages || [],
          },
        }))
      }

    />
  );
}
