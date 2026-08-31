import { buildFormData } from "./buildFormData";
import { serializeForApi } from "./serialize";

const getConfiguredFieldNames = (formConfig = {}) => {
  const fieldNames = new Set();

  const collect = (fields = []) => {
    fields.forEach((field) => {
      if (field?.name) {
        fieldNames.add(field.name);
      }

      if (field?.fields) {
        field.fields.forEach((subField) => {
          if (field.name && subField?.name) {
            fieldNames.add(`${field.name}.${subField.name}`);
          }
        });
      }
    });
  };

  collect(formConfig.commonFields);

  Object.values(formConfig.conditionalFields || {}).forEach(collect);

  return fieldNames;
};

const toErrorMessage = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(toErrorMessage).filter(Boolean).join("\n");
  if (typeof value === "object") return value.message || value.messageAr || value.messageEn || "";
  return String(value);
};

const getGeneralErrorField = (message, formConfig) => {
  const fieldNames = getConfiguredFieldNames(formConfig);

  if (
    fieldNames.has("pricing.pricingPeriods") &&
    /فترات التسعير|فترة|pricing periods?|period/i.test(message)
  ) {
    return "pricing.pricingPeriods";
  }

  return "_form";
};

const normalizeBackendErrors = (err, formConfig, fallbackMessage) => {
  const rawErrors =
    err?.errors ||
    err?.payload?.errors ||
    err?.data?.errors ||
    err?.response?.data?.errors;

  const rawMessage =
    fallbackMessage ||
    (typeof err === "string" ? err : "") ||
    err?.message ||
    err?.payload?.message ||
    err?.data?.message ||
    err?.response?.data?.message;

  const rawField =
    err?.field ||
    err?.payload?.field ||
    err?.data?.field ||
    err?.response?.data?.field;

  if (rawField && rawMessage) {
    return { [rawField]: rawMessage };
  }

  if (Array.isArray(rawErrors)) {
    const message = rawErrors.map(toErrorMessage).filter(Boolean).join("\n");
    return {
      [getGeneralErrorField(`${rawMessage || ""} ${message}`, formConfig)]:
        message || rawMessage,
    };
  }

  if (rawErrors && typeof rawErrors === "object") {
    return Object.fromEntries(
      Object.entries(rawErrors).map(([key, value]) => [key, toErrorMessage(value)]),
    );
  }

  if (err && typeof err === "object" && !Array.isArray(err)) {
    const entries = Object.entries(err).filter(([, value]) => value);
    const isIndexedErrorObject =
      entries.length > 0 && entries.every(([key]) => /^\d+$/.test(key));

    if (isIndexedErrorObject) {
      const message = entries.map(([, value]) => toErrorMessage(value)).join("\n");
      return {
        [getGeneralErrorField(`${rawMessage || ""} ${message}`, formConfig)]:
          message || rawMessage,
      };
    }

    if (entries.length > 0 && !("message" in err)) {
      return Object.fromEntries(
        entries.map(([key, value]) => [key, toErrorMessage(value)]),
      );
    }
  }

  if (rawMessage) {
    return {
      [getGeneralErrorField(rawMessage, formConfig)]: rawMessage,
    };
  }

  return {};
};

export const createHandleSave = ({
  dispatch,
  createAction,
  updateAction,
  fetchAction,
  getId,
  formConfig,

  // UI helpers
  toast,
  lang,
  closeModal,
  resetItem,
  resetMode,
  setLoading, // 🔥 جديد
  setFormErrors,

  // إضافات
  extraPayload, // 🔥 جديد
  onSuccess, // 🔥 جديد
  onError, // 🔥 جديد
  useFormData = true,
}) => {
  return async (data, context = {}) => {
    try {
      setLoading?.(true);

      // 🔥 1. بناء payload
      const formState = data?.formState || data;
      const fd = useFormData
        ? buildFormData(data, formConfig)
        : serializeForApi(formState, formConfig);

      // 🔥 2. إضافة بيانات إضافية
      if (extraPayload) {
        const extra =
          typeof extraPayload === "function"
            ? extraPayload(context)
            : extraPayload;

        Object.entries(extra || {}).forEach(([key, val]) => {
          if (useFormData) {
            fd.append(key, val);
          } else {
            fd[key] = val;
          }
        });
      }

      const mode = context.formMode;
      const currentItem = context.currentItem;

      let result;

      // 🔥 3. Create / Update
      if (mode === "edit") {
        result = await dispatch(
          updateAction({
            id: getId(currentItem),
            payload: fd,
            data: fd,
          }),
        ).unwrap();

        toast.success(
          lang === "ar" ? "تم التحديث بنجاح" : "Updated successfully",
        );
      } else {
        result = await dispatch(createAction(fd)).unwrap();

        toast.success(
          lang === "ar" ? "تمت الإضافة بنجاح" : "Created successfully",
        );
      }

      // 🔥 4. UI reset
      closeModal?.();
      resetItem?.();
      resetMode?.();
      if (fetchAction) {
        dispatch(fetchAction());
      }

      // 🔥 5. hook إضافي
      onSuccess?.(result);

      return result;
    } catch (err) {
      const message =
        (typeof err === "string" ? err : "") ||
        err?.message ||
        err?.payload?.message ||
        err?.data?.message ||
        err?.response?.data?.message ||
        "حدث خطأ";

      const backendErrors = normalizeBackendErrors(err, formConfig, message);

      console.log("BACKEND ERRORS:", backendErrors);

      setFormErrors?.(backendErrors);
      onError?.(err);

    //   toast.error(message);
    } finally {
      setLoading?.(false);
    }
  };
};
