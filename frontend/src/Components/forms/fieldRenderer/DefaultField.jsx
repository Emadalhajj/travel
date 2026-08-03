/*
DefaultField.jsx

وظيفته:

كل input عادي.
*/
import { Form } from "react-bootstrap";

import { set } from "../utils/objectPath";

export default function DefaultField(props) {

  const {
    field,
    formState,
    setFormState,
    fieldErrors,
    helpers,
    isArabic,
  } = props;

  const {
    getFieldValue,
    getFieldStatePath,
    clearFieldError,
  } = helpers;

  const value =
    getFieldValue(field);

  const error =
    fieldErrors?.[
      getFieldStatePath(field)
    ];

 const handleChange = (e) => {
  const { value, checked } = e.target;

  let newValue = value;

  if (field.type === "checkbox") {
    newValue = checked;
  }

  if (field.type === "number") {
    newValue = value === "" ? "" : Number(value);
  }

  setFormState((prev) => {
    let updated = set(
      prev,
      getFieldStatePath(field),
      newValue,
    );

    if (field.name === "inventoryType") {
      updated = set(updated, "itemId", "");
    }

    return updated;
  });

  clearFieldError(field);
};

  // ================= SELECT =================

  const resolvedOptions =
  typeof field.options === "function"
    ? field.options(formState)
    : field.options || [];

  if (field.type === "select") {

    return (
      <>

        <Form.Select
          value={value ?? ""}
          onChange={handleChange}
          isInvalid={!!error}
          size="lg"
          className="shadow-sm"
        >

          <option value="">
            {isArabic
              ? "اختر..."
              : "Select..."}
          </option>

          {(resolvedOptions || []).map(
            (opt, index) => (

              <option
                key={
                  opt.value ||
                  index
                }
                value={opt.value}
              >

                {isArabic
                  ? opt.labelAr
                  : opt.labelEn}

              </option>

            ),
          )}

        </Form.Select>

      </>
    );
  }

  // ================= TEXTAREA =================
  if (field.type === "textarea") {

    return (
      <>

        <Form.Control
          as="textarea"
          rows={field.rows || 4}
          value={value ?? ""}
          onChange={handleChange}
          isInvalid={!!error}
          className="shadow-sm"
        />

      </>
    );
  }

  // ================= CHECKBOX =================
  if (field.type === "checkbox") {

    return (
      <Form.Check
        type="checkbox"
        label={
          isArabic
            ? field.labelAr
            : field.labelEn
        }
        checked={!!value}
        onChange={handleChange}
        isInvalid={!!error}
      />
    );
  }

  // ================= DEFAULT INPUT =================
  return (
    <>

      <Form.Control
        type={
          field.type || "text"
        }
        value={value ?? ""}
        onChange={handleChange}
        isInvalid={!!error}
        size="lg"
        className="shadow-sm"
      />

    </>
  );
}
