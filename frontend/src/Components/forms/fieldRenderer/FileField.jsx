/*
الصور والمرفقات
FileField.jsx

وظيفته:

إدارة الصور والمرفقات.
*/
import ImageUploader from "../../common/ImageUploader";

import FileAttachmentUploader from "../../common/FileAttachmentUploader";

import { set, get } from "../utils/objectPath";

export default function FileField(
  props,
) {

  const {
    field,
    formState,
    setFormState,
    initialData,
    setImageState,
    isArabic,
    helpers,
  } = props;

  const value =
    helpers.getFieldValue(
      field,
    ) || [];

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
        initialData?.[field.name] || value
      }

      multiple={field.multiple !== false}

      label={
        isArabic
          ? field.labelAr
          : field.labelEn
      }

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
