/*
ArrayField.jsx

هنا ننقل:

addArrayItem
removeArrayItem
toggleArrayCheckboxGroup
shouldShowArraySubField

إدارة المصفوفات
إدارة array fields
*/
/*
ArrayField.jsx

مكون عام لإدارة الحقول من نوع Array
يدعم:

✅ إضافة عناصر جديدة
✅ حذف العناصر
✅ الحقول الديناميكية
✅ الشروط condition
✅ select
✅ checkbox
✅ checkbox-group
✅ textarea
✅ nested values
✅ validation
✅ أي config ديناميكي

يعمل مع أي موديل:
- فنادق
- رحلات
- غرف
- أسعار
- مواصفات
- مواسم
- مميزات
- إلخ
*/

import React from "react";

import { Row, Col, Form, Button } from "react-bootstrap";

import Select from "react-select";

import { get, set } from "../utils/objectPath";

import { createArrayItem } from "../utils/arrayHelpers";

export default function ArrayField({
  field,
  formState,
  setFormState,
  isArabic,
  helpers,
  fieldErrors = {},
}) {
  const { getFieldStatePath, clearFieldError } = helpers;

  /*
  =========================
  current items
  =========================
  */

  const fieldPath = getFieldStatePath(field);

  const items = get(formState, fieldPath) || [];

  /*
  =========================
  validation
  =========================
  */

  const getFieldError = (path) => {
    return fieldErrors?.[path] || "";
  };

  /*
  =========================
  conditional fields
  =========================
  */

  const shouldShowSubField = (item, subField) => {
    if (!subField.condition) {
      return true;
    }

    const currentValue = get(item, subField.condition.field);

    const expectedValue = subField.condition.value;

    // array condition
    if (Array.isArray(expectedValue)) {
      return expectedValue.includes(currentValue);
    }

    // single value
    return currentValue === expectedValue;
  };

  /*
  =========================
  add item
  =========================
  */

  const handleAddItem = () => {
    const newItem = createArrayItem(field);

    setFormState((prev) => set(prev, fieldPath, [...items, newItem]));

    clearFieldError(field);
  };

  /*
  =========================
  remove item
  =========================
  */

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);

    setFormState((prev) => set(prev, fieldPath, updated));

    clearFieldError(field);
  };

  /*
  =========================
  change value
  =========================
  */

  const handleChange = (index, subField, rawValue) => {
    const path = `${fieldPath}.${index}.${subField.name}`;

    let value = rawValue;

    // normalize number
    if (subField.type === "number") {
      value = rawValue === "" ? "" : Number(rawValue);
    }

    setFormState((prev) => set(prev, path, value));
  };

  /*
  =========================
  checkbox group
  =========================
  */

  const handleCheckboxGroup = (index, subField, optionKey, checked) => {
    const path = `${fieldPath}.${index}.${subField.name}`;

    const current = get(formState, path) || [];

    let updated = [];

    if (checked) {
      updated = [...new Set([...current, optionKey])];
    } else {
      updated = current.filter((x) => x !== optionKey);
    }

    setFormState((prev) => set(prev, path, updated));
  };

  const getLabel = (item) =>
    (isArabic ? item.labelAr : item.labelEn) || item.label || "";

  /*
  =========================
  render
  =========================
  */

  return (
    <div className="border rounded-4 p-4 bg-light">
      {/* title */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="fw-bold text-secondary">
          {isArabic ? field.labelAr : field.labelEn}
        </div>

        <Button variant="primary" size="sm" onClick={handleAddItem}>
          {isArabic ? "إضافة" : "Add"}
        </Button>
      </div>

      {/* items */}

      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white border rounded-4 p-4 mb-4 shadow-sm"
        >
          {/* header */}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="fw-bold text-secondary">
              {isArabic ? `#${index + 1} الفترة` : `period #${index + 1}`}
            </div>

            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleRemoveItem(index)}
            >
              {isArabic ? "حذف" : "Remove"}
            </Button>
          </div>

          {/* fields */}

          <Row className="g-4">
            {(field.fields || [])

              .filter((subField) => {
                // لا يوجد شرط
                if (!subField.condition) {
                  return true;
                }

                // القيمة الحالية للحقل المرتبط
                const currentValue = item?.[subField.condition.field];

                const expectedValue = subField.condition.value;

                // condition array
                if (Array.isArray(expectedValue)) {
                  return expectedValue.includes(currentValue);
                }

                // single value
                return currentValue === expectedValue;
              })

              .map((subField) => {
                const subPath = `${fieldPath}.${index}.${subField.name}`;

                const value = get(formState, subPath);

                const error = getFieldError(subPath);

                return (
                  <Col xs={12} md={subField.col || 6} key={subField.name}>
                    {/* label */}

                    {subField.type !== "checkbox" && (
                      <Form.Label className="fw-semibold small text-secondary mb-2">
                        {getLabel(subField)}

                        {subField.required && (
                          <span className="text-danger ms-1">*</span>
                        )}
                      </Form.Label>
                    )}

                    {/* select */}

                    {subField.type === "select" ? (
                      <Form.Select
                        value={value ?? ""}
                        onChange={(e) =>
                          handleChange(index, subField, e.target.value)
                        }
                        isInvalid={!!error}
                        size="lg"
                      >
                        <option value="">
                          {isArabic ? "اختر..." : "Select..."}
                        </option>

                        {(subField.options || []).map((opt, i) => (
                          <option key={opt.value || i} value={opt.value}>
                            {getLabel(opt)}
                          </option>
                        ))}
                      </Form.Select>
                    ) : subField.type === "textarea" ? (
                      <Form.Control
                        as="textarea"
                        rows={subField.rows || 4}
                        value={value ?? ""}
                        onChange={(e) =>
                          handleChange(index, subField, e.target.value)
                        }
                        isInvalid={!!error}
                      />
                    ) : subField.type === "checkbox" ? (
                      <Form.Check
                        type="checkbox"
                        label={getLabel(subField)}
                        checked={!!value}
                        onChange={(e) =>
                          handleChange(index, subField, e.target.checked)
                        }
                      />
                    ) : subField.type === "checkbox-group" ? (
                      <div className="border rounded-3 p-3 bg-light">
                        <Row className="g-2">
                          {(subField.options || []).map((opt) => {
                            const optionValue =
                              opt.value ?? opt.key;

                            return (
                              <Col md={4} key={optionValue}>
                                <Form.Check
                                  label={getLabel(opt)}
                                  checked={(value || []).includes(optionValue)}
                                  onChange={(e) =>
                                    handleCheckboxGroup(
                                      index,
                                      subField,
                                      optionValue,
                                      e.target.checked,
                                    )
                                  }
                                />
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    ) : subField.type === "searchable-select" ? (
                      <Select
                        value={(subField.options || []).find(
                          (x) => x.value === value,
                        )}
                        options={subField.options || []}
                        onChange={(selected) =>
                          handleChange(index, subField, selected?.value)
                        }
                      />
                    ) : (
                      <Form.Control
                        type={subField.type || "text"}
                        value={value ?? ""}
                        onChange={(e) =>
                          handleChange(index, subField, e.target.value)
                        }
                        isInvalid={!!error}
                        size="lg"
                      />
                    )}

                    {/* validation */}

                    {error && (
                      <Form.Control.Feedback
                        type="invalid"
                        style={{
                          display: "block",
                        }}
                      >
                        {error}
                      </Form.Control.Feedback>
                    )}
                  </Col>
                );
              })}
          </Row>
        </div>
      ))}
    </div>
  );
}
