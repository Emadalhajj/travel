/*
بدل if/else الطويل:

field.type === "select"
field.type === "textarea"
field.type === "checkbox"
field.type === "file"
نعمل Renderer مركزي.

اختيار نوع الحقل
وظيفته 
تحديد أي component يتم عرضه.

*/
import { memo } from "react";
import { Form } from "react-bootstrap";

import ArrayField from "./ArrayField";
import ComputedField from "./ComputedField";
import SearchableSelectField from "./SearchableSelectField";
import CheckboxGroupField from "./CheckboxGroupField";
import FileField from "./FileField";
import DefaultField from "./DefaultField";

import { getNestedValue } from "../../../Utils/formHelpers";

function FieldRenderer(props) {
  const { field, isArabic, fieldErrors = {} } = props;

  if (!field) return null;

  const directError = fieldErrors?.[field.name];

  const nestedError = getNestedValue(fieldErrors, field.name);

  const fieldError = directError || nestedError;

  const errorMessage =
    typeof fieldError === "object"
      ? fieldError?.message
      : fieldError;

  const renderField = () => {
    switch (field.type) {
      case "array":
        return <ArrayField {...props} />;

      case "computed":
        return <ComputedField {...props} />;

      case "searchable-select":
        return <SearchableSelectField {...props} />;

      case "checkbox-group":
        return <CheckboxGroupField {...props} />;

      case "file":
      case "file-attachment":
        return <FileField {...props} />;

      default:
        return <DefaultField {...props} />;
    }
  };

  return (
    <Form.Group className="h-100">
      {/* label */}
      {field.type !== "checkbox" && (
        <Form.Label className="fw-semibold text-secondary small mb-2 d-block">
          {isArabic ? field.labelAr : field.labelEn}

          {field.required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}

      {renderField()}

      {errorMessage && (
        <div className="text-danger small mt-1">
          {errorMessage}
        </div>
      )}

      {!errorMessage && (isArabic ? field.helpTextAr : field.helpTextEn) && (
        <div className="text-muted small mt-1">
          {isArabic ? field.helpTextAr : field.helpTextEn}
        </div>
      )}
    </Form.Group>
  );
}

const alwaysRenderTypes = new Set(["array", "computed", "searchable-select"]);

function areFieldRendererPropsEqual(previous, next) {
  if (
    previous.field !== next.field ||
    previous.isArabic !== next.isArabic ||
    previous.loading !== next.loading ||
    alwaysRenderTypes.has(next.field?.type) ||
    typeof next.field?.options === "function"
  ) return false;

  const fieldName = next.field?.path || (next.field?.isSpec
    ? `specs.${next.field.name}`
    : next.field?.name);
  if (!fieldName) return false;

  return (
    getNestedValue(previous.formState, fieldName) === getNestedValue(next.formState, fieldName) &&
    getNestedValue(previous.fieldErrors, fieldName) === getNestedValue(next.fieldErrors, fieldName) &&
    previous.fieldErrors?.[fieldName] === next.fieldErrors?.[fieldName] &&
    previous.fieldErrors?.[next.field.name] === next.fieldErrors?.[next.field.name] &&
    previous.imageState?.[fieldName] === next.imageState?.[fieldName] &&
    previous.imageState?.[next.field.name] === next.imageState?.[next.field.name] &&
    previous.initialData === next.initialData
  );
}

export default memo(FieldRenderer, areFieldRendererPropsEqual);


/*


import { Form } from "react-bootstrap";

import ArrayField from "./ArrayField";
import ComputedField from "./ComputedField";
import SearchableSelectField from "./SearchableSelectField";
import CheckboxGroupField from "./CheckboxGroupField";
import FileField from "./FileField";
import DefaultField from "./DefaultField";


export default function FieldRenderer(props) {
  const { field, isArabic } = props;

  if (!field) return null;

  const renderField = () => {
    switch (field.type) {
      case "array":
        return <ArrayField {...props} />;

      case "computed":
        return <ComputedField {...props} />;

      case "searchable-select":
        return <SearchableSelectField {...props} />;

      case "checkbox-group":
        return <CheckboxGroupField {...props} />;

      case "file":
      case "file-attachment":
        return <FileField {...props} />;

      default:
        return <DefaultField {...props} />;
    }
  };

  return (
    <Form.Group className="h-100">
*/
// /*
//       {/* label */}
//       {field.type !== "checkbox" && (
//         <Form.Label className="fw-semibold text-secondary small mb-2 d-block">

//           {isArabic
//             ? field.labelAr
//             : field.labelEn}

//           {field.required && (
//             <span className="text-danger ms-1">*</span>
//           )}

//         </Form.Label>
//       )}

//       {renderField()}

//     </Form.Group>
//   );
//   */
