/*
useComputedFields الحسابات
*/
export default function ComputedField(props) {

  const {
    field,
    formState,
    computedValues,
  } = props;

  // حماية من undefined
  if (!field) {
    return null;
  }

  const value =
    computedValues?.[
      field.name
    ];

  return (
    <div className="p-3 bg-light rounded border">

      {typeof field.display ===
      "function"
        ? field.display(
            value,
            formState,
          )
        : (
          <span className="fw-bold">

            {value}

          </span>
        )}

    </div>
  );
}