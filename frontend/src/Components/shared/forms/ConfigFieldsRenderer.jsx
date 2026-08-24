import { Row } from "react-bootstrap";
import FieldRenderer from "./FieldRenderer";

export default function ConfigFieldsRenderer({
  fields = [],
  isArabic = true,
  getValue,
  values = {},
  errors = {},
  onChange,
}) {
  const resolveValue =
    typeof getValue === "function" ? getValue : (name) => values?.[name];

  return (
    <Row className="g-4">
      {[...fields]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            isArabic={isArabic}
            value={resolveValue(field.name)}
            error={errors[field.name]}
            onChange={(value) => onChange?.(field.name, value)}
          />
        ))}
    </Row>
  );
}
