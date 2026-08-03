/*
SearchableSelectField.jsx

وظيفته:

حقول البحث.

يعتمد على react-select
*/
import Select from "react-select";

export default function SearchableSelectField(props) {
  const {
    field,
    loadingCities,
    getLocationOptions,
    getSelectedLocationOption,
    handleLocationSelectChange,
    isArabic,
    fieldErrors,
    helpers,
  } = props;

  const hasError = Boolean(
    fieldErrors?.[
      helpers.getFieldStatePath(
        field,
      )
    ],
  );

  return (
    <Select
      styles={{
        control: (base) => ({
          ...base,
          minHeight: "48px",
          boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
          borderColor: hasError
            ? "#dc3545"
            : base.borderColor,
        }),
      }}
      value={getSelectedLocationOption(field)}
      options={getLocationOptions(field)}
      onChange={(selected) => handleLocationSelectChange(selected, field)}
      isLoading={field.optionsSource === "cities" && loadingCities}
      placeholder={isArabic ? "ابحث واختر..." : "Search..."}
      isSearchable
      aria-invalid={hasError}
    />
  );
}
