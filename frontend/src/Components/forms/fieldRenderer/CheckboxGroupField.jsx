/*
CheckboxGroupField.jsx

وظيفته:

checkbox متعدد.
*/
import {
  Form,
  Row,
  Col,
} from "react-bootstrap";

import {
  set,
} from "../utils/objectPath";

export default function CheckboxGroupField(
  props,
) {

  const {
    field,
    setFormState,
    isArabic,
    helpers,
    fieldErrors,
  } = props;

  if (!field) {
    return null;
  }

  const options =
    field.options || [];

  const fieldPath =
    helpers.getFieldStatePath(
      field,
    );

  const currentValue =
    helpers.getFieldValue(
      field,
    );

  const hasError = Boolean(
    fieldErrors?.[
      fieldPath
    ],
  );

  const usesArrayValue =
    field.valueMode === "array";

  const selectedValues =
    Array.isArray(currentValue)
      ? currentValue
      : [];

  const selectedObject =
    !usesArrayValue &&
    currentValue &&
    typeof currentValue ===
      "object" &&
    !Array.isArray(currentValue)
      ? currentValue
      : {};

  return (
    <div
      className={`border rounded p-3 bg-light ${
        hasError
          ? "border-danger"
          : ""
      }`}
    >

      <Row className="g-2">

        {options.map((opt) => {
          const optionValue =
            opt.value ?? opt.key;

          return (
            <Col
              md={4}
              sm={6}
              xs={12}
              key={optionValue}
            >

              <Form.Check

                label={
                  isArabic
                    ? opt.labelAr
                    : opt.labelEn
                }

                checked={
                  usesArrayValue
                    ? selectedValues.includes(
                        optionValue,
                      )
                    : !!selectedObject[
                        optionValue
                      ]
                }

                onChange={(e) => {

                  const checked =
                    e.target.checked;

                  const nextValue =
                    usesArrayValue
                      ? checked
                        ? [
                            ...new Set([
                              ...selectedValues,
                              optionValue,
                            ]),
                          ]
                        : selectedValues.filter(
                            (value) =>
                              value !==
                              optionValue,
                          )
                      : {
                          ...selectedObject,
                          [optionValue]:
                            checked,
                        };

                  setFormState(
                    (prev) =>
                      set(
                        prev,
                        fieldPath,
                        nextValue,
                      ),
                  );

                  helpers.clearFieldError(
                    field,
                  );

                }}

              />

            </Col>
          );
        })}

      </Row>

    </div>
  );
}
