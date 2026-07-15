// /*
// Schema Driven UI
// */

// import React, { useEffect, useMemo, useState } from "react";
// import { Modal, Form, Button, Row, Col, Tabs, Tab } from "react-bootstrap";
// import { useTranslation } from "react-i18next";
// import Select from "react-select";
// import ImageUploader from "../ImageUploader";
// import { useLocationSelect } from "../../../hooks/useLocationSelect";
// import FileAttachmentUploader from "../FileAttachmentUploader";
// export default function UniversalFormModal({
//   show,
//   onHide,
//   onSave,
//   config = {},
//   initialData = {},
//   titleAr = "إضافة",
//   titleEn = "Create",
//   errors = {},
// }) {
//   const { i18n } = useTranslation();
//   const lang = i18n.language || "ar";

//   const [formState, setFormState] = useState({});
//   const [imageState, setImageState] = useState({});
//   const [activeTab, setActiveTab] = useState("basic");
//   const isArabic = lang === "ar";

//   const [fieldErrors, setFieldErrors] = useState({});
//   const {
//     loadingCities,
//     handleLocationSelectChange,
//     getLocationOptions,
//     getSelectedLocationOption,
//   } = useLocationSelect(formState, setFormState, isArabic);

//   // ====================== Helpers ======================
//   const get = (obj, path) => path?.split(".").reduce((o, k) => o?.[k], obj);

//   const isArrayIndex = (key) => /^\d+$/.test(key);

//   const set = (obj, path, value) => {
//     const keys = path.split(".");
//     const root = Array.isArray(obj) ? [...obj] : { ...obj };
//     let current = root;
//     for (let i = 0; i < keys.length - 1; i++) {
//       const k = keys[i];
//       const nextKey = keys[i + 1];
//       const existing = current[k];
//       if (Array.isArray(existing)) {
//         current[k] = [...existing];
//       } else if (existing && typeof existing === "object") {
//         current[k] = { ...existing };
//       } else {
//         current[k] = isArrayIndex(nextKey) ? [] : {};
//       }
//       current = current[k];
//     }
//     current[keys.at(-1)] = value;
//     return root;
//   };
//   const getFieldStatePath = (field) => {
//     // إذا الحقل عنده path كامل استخدمه
//     if (field.path) {
//       return field.path;
//     }

//     // specs
//     if (field.isSpec) {
//       return `specs.${field.name}`;
//     }

//     return field.name;
//   };

//   // const getFieldStatePath = (field) =>
//   //   field.isSpec ? `specs.${field.name}` : field.name;

//   const getFieldValue = (field) => get(formState, getFieldStatePath(field));

//   const clearFieldError = (field) => {
//     const errorKey = getFieldStatePath(field);
//     setFieldErrors((prev) => ({
//       ...prev,
//       [errorKey]: "",
//     }));
//   };

//   // ====================== Compute active fields ======================
//   const conditionKey = config.conditionKey;
//   const conditionValue = conditionKey
//     ? (get(formState, conditionKey) ?? "")
//     : "";

//   const activeFields = useMemo(
//     () =>
//       [
//         ...(config.commonFields || []),
//         ...(conditionKey && conditionValue
//           ? config.conditionalFields?.[conditionValue] || []
//           : []),
//       ].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
//     [config, conditionKey, conditionValue],
//   );

//   // ====================== Initialize form state ======================
//   useEffect(() => {
//     if (!show) return;

//     const initialConditionKey = config.conditionKey;
//     const initialConditionValue = initialConditionKey
//       ? (get(initialData, initialConditionKey) ?? "")
//       : "";

//     const initial = {
//       ...(initialConditionKey
//         ? { [initialConditionKey]: initialConditionValue }
//         : {}),
//       specs: initialData?.specs || {},
//       attachments: initialData?.attachments || [],
//       deleteAttachments: [],
//     };

//     const initialActiveFields = [
//       ...(config.commonFields || []),
//       ...(initialConditionKey && initialConditionValue
//         ? config.conditionalFields?.[initialConditionValue] || []
//         : []),
//     ].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

//     initialActiveFields.forEach((field) => {
//       if (field.name === "images") return;

//       const initialValue = get(initialData, getFieldStatePath(field));

//       const value =
//         initialValue !== undefined && initialValue !== null
//           ? initialValue
//           : field.defaultValue !== undefined
//             ? field.defaultValue
//             : field.type === "checkbox"
//               ? false
//               : field.name === "isActive"
//                 ? true
//                 : "";

//       if (field.isSpec) {
//         initial.specs = {
//           ...initial.specs,
//           [field.name]: value,
//         };
//       } else {
//         Object.assign(initial, set(initial, field.name, value));
//       }
//     });

//     setFormState(initial);
//     setImageState({});
//   }, [show, initialData, config]);
//   // ====================== Computed Values الحسابات التلقائية للحقول======================
//   const [computedValues, setComputedValues] = useState({});

//   useEffect(() => {
//     const newComputed = {};

//     activeFields.forEach((field) => {
//       if (field.type === "computed" && field.compute) {
//         newComputed[field.name] = field.compute(formState, newComputed);
//       }
//     });

//     setComputedValues(newComputed);
//   }, [formState, activeFields]);

//   // ===================== helper error handling ======================
//   useEffect(() => {
//     //console.log("FORM ERRORS:", errors);

//     setFieldErrors(errors || {});
//   }, [errors]);

//   const getFieldError = (field) => {
//     const errorKey = getFieldStatePath(field);

//     // console.log("SEARCH ERROR:", errorKey, fieldErrors[errorKey]);

//     return fieldErrors?.[errorKey] || "";
//   };
//   const renderValidation = (field) => {
//     const error = getFieldError(field);

//     if (!error) return null;

//     return (
//       <Form.Control.Feedback type="invalid" style={{ display: "block" }}>
//         {error}
//       </Form.Control.Feedback>
//     );
//   };

//   const createArrayItem = (field) =>
//     (field.fields || []).reduce((item, subField) => {
//       const value =
//         subField.defaultValue !== undefined
//           ? subField.defaultValue
//           : subField.type === "checkbox"
//             ? false
//             : subField.type === "checkbox-group"
//               ? {}
//               : "";

//       return set(item, subField.name, value);
//     }, {});

//   const addArrayItem = (field) => {
//     const path = getFieldStatePath(field);
//     const items = get(formState, path);
//     setFormState((prev) =>
//       set(prev, path, [
//         ...(Array.isArray(items) ? items : []),
//         createArrayItem(field),
//       ]),
//     );
//     clearFieldError(field);
//   };

//   const removeArrayItem = (field, index) => {
//     const path = getFieldStatePath(field);
//     const items = get(formState, path);
//     setFormState((prev) =>
//       set(
//         prev,
//         path,
//         (Array.isArray(items) ? items : []).filter((_, i) => i !== index),
//       ),
//     );
//     clearFieldError(field);
//   };

//   const shouldShowArraySubField = (item, subField) => {
//     if (!subField.condition) return true;

//     const currentValue = get(item, subField.condition.field);
//     const expectedValue = subField.condition.value;

//     return Array.isArray(expectedValue)
//       ? expectedValue.includes(currentValue)
//       : currentValue === expectedValue;
//   };

//   const handleArraySubFieldChange = (field, index, subField, rawValue) => {
//     const path = `${getFieldStatePath(field)}.${index}.${subField.name}`;
//     const value =
//       subField.type === "number"
//         ? rawValue === ""
//           ? ""
//           : Number(rawValue)
//         : rawValue;

//     setFormState((prev) => set(prev, path, value));
//     clearFieldError(field);
//   };

//   const toggleArrayCheckboxGroup = (
//     field,
//     index,
//     subField,
//     optionKey,
//     checked,
//   ) => {
//     const path = `${getFieldStatePath(field)}.${index}.${subField.name}`;
//     const currentValue = get(formState, path);
//     const currentKeys = Array.isArray(currentValue)
//       ? currentValue
//       : Object.entries(currentValue || {})
//           .filter(([, enabled]) => enabled)
//           .map(([key]) => key);

//     setFormState((prev) =>
//       set(
//         prev,
//         path,
//         checked
//           ? Array.from(new Set([...currentKeys, optionKey]))
//           : currentKeys.filter((key) => key !== optionKey),
//       ),
//     );
//     clearFieldError(field);
//   };

//   // ====================== Conditional Options ======================
//   const getConditionalOptions = (fieldName, defaultOptions = []) => {
//     const conditionKey = config.conditionKey;
//     const condValue = conditionKey ? (get(formState, conditionKey) ?? "") : "";
//     const condField = config.conditionalFields?.[condValue]?.find(
//       (f) => f.name === fieldName,
//     );
//     return condField?.options || defaultOptions;
//   };

//   // ====================== Change Handler ======================
//   const handleSearchableSelectChange = (selected, field) => {
//     handleLocationSelectChange(selected, field);
//     clearFieldError(field);
//   };

//   const handleChange = (e, field) => {
//     const { name, value, checked, files } = e.target;

//     if (field.type === "checkbox-group") {
//       setFormState((prev) =>
//         set(prev, field.name, {
//           ...(get(prev, field.name) || {}),
//           [value]: checked,
//         }),
//       );
//       clearFieldError(field);
//       return;
//     }

//     if (field.type === "checkbox") {
//       setFormState((prev) => set(prev, getFieldStatePath(field), checked));
//       // setFormState((prev) => set(prev, field.name, checked));
//       clearFieldError(field);
//       return;
//     }

//     if (field.isSpec) {
//       setFormState((prev) => set(prev, `specs.${name}`, value));
//       clearFieldError(field);
//       return;
//     }

//     const normalizedValue =
//       field.type === "numeric-text" ? value.replace(/\D/g, "") : value;

//     const newValue = files
//       ? field.multiple
//         ? files
//         : files[0]
//       : field.type === "number"
//         ? normalizedValue === ""
//           ? ""
//           : Number(normalizedValue)
//         : normalizedValue;

//     const fieldPath = getFieldStatePath(field);

//     setFormState((prev) => set(prev, fieldPath, newValue));

//     // setFormState((prev) => set(prev, field.name, newValue));

//     clearFieldError(field);
//   };

//   // ====================== Submit Handler ======================
//   const handleSubmit = () => {
//     // دمج formState مع computedValues
//     const finalData = {
//       ...formState,
//       ...computedValues, // ← أضف هذا
//     };

//     const hasImages = Object.values(imageState || {}).some(
//       (img) => img?.newImages?.length || img?.deletedOldImages?.length,
//     );

//     if (hasImages) {
//       onSave({
//         formState: finalData, // ← استخدم finalData
//         imageState,
//       });
//     } else {
//       onSave(finalData); // ← استخدم finalData
//     }
//   };

//   return (
//     <Modal
//       show={show}
//       onHide={onHide}
//       size="xl"
//       centered
//       fullscreen="sm-down"
//       scrollable
//       dir={lang === "ar" ? "rtl" : "ltr"} // ← مهم جداً
//       backdrop="static" // ← هذا يمنع الإغلاق عند النقر خارج المودال
//     >
//       <Modal.Header closeButton className="bg-light border-bottom py-3">
//         <Modal.Title className="fw-bold fs-5">
//           {isArabic ? titleAr : titleEn}
//         </Modal.Title>
//         <style jsx>{`
//           .modal-header .btn-close {
//             background-color: #dc3545 !important;
//             opacity: 1;
//             filter: none;
//           }
//         `}</style>
//       </Modal.Header>

//       <Modal.Body className="p-4 p-md-5">
//         <Tabs
//           activeKey={activeTab}
//           onSelect={(k) => setActiveTab(k)}
//           className="mb-4"
//           fill
//         >
//           <Tab
//             eventKey="basic"
//             title={isArabic ? "المعلومات الأساسية" : "Basic Information"}
//           >
//             <Form>
//               <Row className="g-4">
//                 {activeFields.map((field) => {
//                   if (
//                     field.type === "checkbox-group-options" ||
//                     field.type === "hidden"
//                   ) {
//                     return null;
//                   }

//                   const colSize =
//                     field.col ||
//                     (field.type === "textarea" ||
//                     field.name.toLowerCase().includes("description")
//                       ? 12
//                       : 6);

//                   return (
//                     <Col md={colSize} key={field.name}>
//                       <Form.Group className="h-100">
//                         {field.type !== "checkbox" && (
//                           <Form.Label className="fw-semibold text-secondary small mb-1 d-block">
//                             {isArabic ? field.labelAr : field.labelEn}
//                             {field.required && (
//                               <span className="text-danger ms-1">*</span>
//                             )}
//                           </Form.Label>
//                         )}
//                         {/* ✅  نضيف computed قبل البقية */}
//                         {field.type === "computed" ? (
//                           <>
//                             <div className="p-3 bg-light rounded border">
//                               {field.display ? (
//                                 field.display(
//                                   computedValues[field.name] ??
//                                     field.compute?.(formState, computedValues),
//                                   formState,
//                                 )
//                               ) : (
//                                 <span className="fs-4 fw-bold text-primary">
//                                   {computedValues[field.name]}
//                                 </span>
//                               )}
//                             </div>
//                           </>
//                         ) : field.type === "array" ? (
//                           <>
//                             <div className="border rounded-3 p-3 bg-light">
//                               {(Array.isArray(getFieldValue(field))
//                                 ? getFieldValue(field)
//                                 : []
//                               ).map((item, index) => (
//                                 <div
//                                   key={index}
//                                   className="bg-white border rounded-3 p-3 mb-3"
//                                 >
//                                   <div className="d-flex justify-content-between align-items-center mb-3">
//                                     <strong className="text-secondary">
//                                       {isArabic ? "فترة" : "Period"} #
//                                       {index + 1}
//                                     </strong>
//                                     <Button
//                                       variant="outline-danger"
//                                       size="sm"
//                                       onClick={() =>
//                                         removeArrayItem(field, index)
//                                       }
//                                     >
//                                       {isArabic ? "حذف" : "Remove"}
//                                     </Button>
//                                   </div>

//                                   <Row className="g-3">
//                                     {(field.fields || [])
//                                       .filter((subField) =>
//                                         shouldShowArraySubField(item, subField),
//                                       )
//                                       .map((subField) => {
//                                         const subPath = `${getFieldStatePath(
//                                           field,
//                                         )}.${index}.${subField.name}`;
//                                         const subValue = get(
//                                           formState,
//                                           subPath,
//                                         );
//                                         const label = isArabic
//                                           ? subField.labelAr || subField.label
//                                           : subField.labelEn || subField.label;

//                                         return (
//                                           <Col
//                                             md={subField.col || 6}
//                                             key={subField.name}
//                                           >
//                                             {subField.type !== "checkbox" && (
//                                               <Form.Label className="fw-semibold text-secondary small mb-1 d-block">
//                                                 {label}
//                                                 {subField.required && (
//                                                   <span className="text-danger ms-1">
//                                                     *
//                                                   </span>
//                                                 )}
//                                               </Form.Label>
//                                             )}

//                                             {subField.type === "select" ? (
//                                               <Form.Select
//                                                 value={subValue ?? ""}
//                                                 onChange={(e) =>
//                                                   handleArraySubFieldChange(
//                                                     field,
//                                                     index,
//                                                     subField,
//                                                     e.target.value,
//                                                   )
//                                                 }
//                                                 size="lg"
//                                                 className="shadow-sm"
//                                               >
//                                                 <option value="" disabled>
//                                                   {isArabic
//                                                     ? "اختر..."
//                                                     : "Select..."}
//                                                 </option>
//                                                 {(subField.options || []).map(
//                                                   (opt, optIndex) => (
//                                                     <option
//                                                       key={
//                                                         opt.value ||
//                                                         opt.key ||
//                                                         optIndex
//                                                       }
//                                                       value={
//                                                         opt.value || opt.key
//                                                       }
//                                                     >
//                                                       {isArabic
//                                                         ? opt.labelAr
//                                                         : opt.labelEn}
//                                                     </option>
//                                                   ),
//                                                 )}
//                                               </Form.Select>
//                                             ) : subField.type ===
//                                               "checkbox-group" ? (
//                                               <div className="border rounded-3 p-3 bg-light">
//                                                 <Row className="g-2">
//                                                   {(subField.options || []).map(
//                                                     (opt) => (
//                                                       <Col
//                                                         md={4}
//                                                         sm={6}
//                                                         xs={12}
//                                                         key={opt.key}
//                                                       >
//                                                         <Form.Check
//                                                           label={
//                                                             isArabic
//                                                               ? opt.labelAr
//                                                               : opt.labelEn
//                                                           }
//                                                           checked={
//                                                             Array.isArray(
//                                                               subValue,
//                                                             )
//                                                               ? subValue.includes(
//                                                                   opt.key,
//                                                                 )
//                                                               : !!get(
//                                                                   formState,
//                                                                   `${subPath}.${opt.key}`,
//                                                                 )
//                                                           }
//                                                           onChange={(e) =>
//                                                             toggleArrayCheckboxGroup(
//                                                               field,
//                                                               index,
//                                                               subField,
//                                                               opt.key,
//                                                               e.target.checked,
//                                                             )
//                                                           }
//                                                         />
//                                                       </Col>
//                                                     ),
//                                                   )}
//                                                 </Row>
//                                               </div>
//                                             ) : subField.type === "checkbox" ? (
//                                               <Form.Check
//                                                 type="checkbox"
//                                                 label={label}
//                                                 checked={!!subValue}
//                                                 onChange={(e) =>
//                                                   handleArraySubFieldChange(
//                                                     field,
//                                                     index,
//                                                     subField,
//                                                     e.target.checked,
//                                                   )
//                                                 }
//                                               />
//                                             ) : (
//                                               <Form.Control
//                                                 type={subField.type || "text"}
//                                                 value={subValue ?? ""}
//                                                 onChange={(e) =>
//                                                   handleArraySubFieldChange(
//                                                     field,
//                                                     index,
//                                                     subField,
//                                                     e.target.value,
//                                                   )
//                                                 }
//                                                 size="lg"
//                                                 className="shadow-sm"
//                                               />
//                                             )}
//                                           </Col>
//                                         );
//                                       })}
//                                   </Row>
//                                 </div>
//                               ))}

//                               <Button
//                                 variant="outline-primary"
//                                 onClick={() => addArrayItem(field)}
//                               >
//                                 {isArabic ? "إضافة فترة" : "Add Period"}
//                               </Button>
//                             </div>

//                             {renderValidation(field)}
//                           </>
//                         ) : field.type === "searchable-select" ? (
//                           <>
//                             <Select
//                               value={getSelectedLocationOption(field)}
//                               onChange={(selected) =>
//                                 handleSearchableSelectChange(selected, field)
//                               }
//                               options={getLocationOptions(field)}
//                               isClearable={false}
//                               isSearchable
//                               isLoading={
//                                 field.optionsSource === "cities" &&
//                                 loadingCities
//                               }
//                               isDisabled={
//                                 field.optionsSource === "cities" &&
//                                 !get(formState, field.dependsOn)
//                               }
//                               placeholder={
//                                 isArabic ? "ابحث واختر..." : "Search..."
//                               }
//                               noOptionsMessage={() =>
//                                 isArabic ? "لا توجد نتائج" : "No results"
//                               }
//                               filterOption={(candidate, input) =>
//                                 candidate.data.searchText
//                                   .toLowerCase()
//                                   .includes(input.toLowerCase())
//                               }
//                               classNamePrefix="form-search-select"
//                               styles={{
//                                 control: (base, state) => ({
//                                   ...base,
//                                   minHeight: "48px",
//                                   borderColor: getFieldError(field)
//                                     ? "#dc3545"
//                                     : state.isFocused
//                                       ? "#86b7fe"
//                                       : base.borderColor,
//                                   boxShadow: state.isFocused
//                                     ? "0 0 0 .25rem rgba(13,110,253,.25)"
//                                     : "0 .125rem .25rem rgba(0,0,0,.075)",
//                                   direction: isArabic ? "rtl" : "ltr",
//                                 }),
//                                 menu: (base) => ({
//                                   ...base,
//                                   direction: isArabic ? "rtl" : "ltr",
//                                   zIndex: 1060,
//                                 }),
//                               }}
//                             />

//                             {renderValidation(field)}
//                           </>
//                         ) : field.type === "select" ? (
//                           <>
//                             <Form.Select
//                               value={getFieldValue(field) ?? ""}
//                               onChange={(e) => handleChange(e, field)}
//                               isInvalid={!!getFieldError(field)}
//                               size="lg"
//                               className="shadow-sm"
//                             >
//                               <option value="" disabled>
//                                 {isArabic ? "اختر..." : "Select..."}
//                               </option>

//                               {(field.options || []).map((opt, index) => (
//                                 <option
//                                   key={opt.code || opt.value || index}
//                                   value={opt.code || opt.value}
//                                 >
//                                   {isArabic
//                                     ? opt.nameAr || opt.labelAr
//                                     : opt.nameEn || opt.labelEn}
//                                 </option>
//                               ))}
//                             </Form.Select>

//                             {renderValidation(field)}
//                           </>
//                         ) : field.type === "textarea" ? (
//                           <>
//                             <Form.Control
//                               as="textarea"
//                               rows={field.rows || 4}
//                               value={getFieldValue(field) ?? ""}
//                               onChange={(e) => handleChange(e, field)}
//                               isInvalid={!!getFieldError(field)}
//                               className="shadow-sm"
//                             />

//                             {renderValidation(field)}
//                           </>
//                         ) : field.type === "checkbox" ? (
//                           <Form.Check
//                             type="checkbox"
//                             label={isArabic ? field.labelAr : field.labelEn}
//                             checked={!!getFieldValue(field)}
//                             onChange={(e) => handleChange(e, field)}
//                             className="mt-2"
//                           />
//                         ) : field.type === "checkbox-group" ? (
//                           <>
//                             <div className="border rounded-3 p-3 bg-light">
//                               <Row className="g-2">
//                                 {getConditionalOptions(
//                                   field.name,
//                                   field.options,
//                                 ).map((opt) => (
//                                   <Col md={4} sm={6} xs={12} key={opt.key}>
//                                     <Form.Check
//                                       key={opt.key}
//                                       label={
//                                         isArabic ? opt.labelAr : opt.labelEn
//                                       }
//                                       checked={
//                                         !!get(
//                                           formState,
//                                           `${field.name}.${opt.key}`,
//                                         )
//                                       }
//                                       onChange={(e) =>
//                                         setFormState((prev) =>
//                                           set(
//                                             prev,
//                                             `${field.name}.${opt.key}`,
//                                             e.target.checked,
//                                           ),
//                                         )
//                                       }
//                                       className="mb-2"
//                                     />
//                                   </Col>
//                                 ))}
//                               </Row>
//                             </div>

//                             {renderValidation(field)}
//                           </>
//                         ) : field.type === "file" ? (
//                           <>
//                             <ImageUploader
//                               initialImages={
//                                 Array.isArray(initialData?.[field.name])
//                                   ? initialData[field.name]
//                                   : initialData?.[field.name]
//                                     ? [initialData[field.name]]
//                                     : []
//                               }
//                               multiple={field.multiple || false}
//                               onChange={(data) =>
//                                 setImageState((prev) => ({
//                                   ...prev,
//                                   [field.name]: {
//                                     newImages: data.newImages,
//                                     deletedOldImages: data.deletedOldImages,
//                                   },
//                                 }))
//                               }
//                             />

//                             {renderValidation(field)}
//                           </>
//                         ) : field.type === "file-attachment" ? (
//                           <>
//                             <FileAttachmentUploader
//                               key={`${field.name}-${initialData?._id || "new"}`} // منع انتقال المرفق من منتج الى اخر ة
//                               name={field.name}
//                               multiple={field.multiple !== false}
//                               maxFiles={field.maxFiles || 8}
//                               maxSizeMB={field.maxSizeMB || 15}
//                               initialFiles={getFieldValue(field) || []}
//                               onChange={(newAttachments) => {
//                                 setFormState((prev) =>
//                                   set(
//                                     prev,
//                                     getFieldStatePath(field),
//                                     newAttachments,
//                                   ),
//                                 );
//                                 clearFieldError(field);
//                               }}
//                               onDeleteExisting={(file) => {
//                                 // إضافة الملف المحذوف إلى قائمة الحذف وإزالته من المصفوفة الحالية
//                                 setFormState((prev) => {
//                                   const current =
//                                     get(prev, getFieldStatePath(field)) || [];
//                                   const remaining = current.filter(
//                                     (item) => item?.url !== file?.url,
//                                   );
//                                   const deleted = Array.isArray(
//                                     prev.deleteAttachments,
//                                   )
//                                     ? [
//                                         ...prev.deleteAttachments,
//                                         file?.url || file,
//                                       ]
//                                     : [file?.url || file];

//                                   return set(
//                                     set(
//                                       prev,
//                                       getFieldStatePath(field),
//                                       remaining,
//                                     ),
//                                     "deleteAttachments",
//                                     deleted,
//                                   );
//                                 });
//                               }}
//                             />

//                             {renderValidation(field)}
//                           </>
//                         ) : (
//                           <>
//                             <Form.Control
//                               type={
//                                 field.type === "numeric-text"
//                                   ? "text"
//                                   : field.type || "text"
//                               }
//                               inputMode={
//                                 field.type === "numeric-text"
//                                   ? "numeric"
//                                   : undefined
//                               }
//                               value={getFieldValue(field) ?? ""}
//                               onChange={(e) => handleChange(e, field)}
//                               isInvalid={!!getFieldError(field)}
//                               size="lg"
//                               className="shadow-sm"
//                             />

//                             {renderValidation(field)}
//                           </>
//                         )}
//                       </Form.Group>
//                     </Col>
//                   );
//                 })}
//               </Row>
//             </Form>
//           </Tab>

//           {/* يمكنك إضافة تبويبات إضافية لاحقاً (صور، مواصفات، أسعار...) */}
//         </Tabs>
//       </Modal.Body>

//       <Modal.Footer className="bg-light border-top py-3 px-4">
//         <div className={`d-flex  gap-3`}>
//           <Button variant="danger" onClick={onHide} className="px-4 py-2">
//             {isArabic ? "إلغاء" : "Cancel"}
//           </Button>

//           <Button
//             variant="primary"
//             onClick={handleSubmit}
//             className="px-5 py-2"
//           >
//             {isArabic ? "حفظ" : "Save"}
//           </Button>
//         </div>
//       </Modal.Footer>
//     </Modal>
//   );
// }
