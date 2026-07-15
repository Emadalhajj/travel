// src/Components/common/FileAttachmentUploader.jsx
// src/Components/common/FileAttachmentUploader.jsx
import React, { useState, useEffect } from "react";
import { Form, Button, ListGroup, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FaUpload, FaTrash, FaFilePdf, FaFileWord } from "react-icons/fa";

const FileAttachmentUploader = ({
  labelAr = "الملفات المرفقة",
  labelEn = "Attachments",
  name = "attachments",
  multiple = true,
  acceptedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxFiles = 8,
  maxSizeMB = 15,
  initialFiles = [],
  onChange,
  onDeleteExisting,
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [newFiles, setNewFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  // تحديث الملفات عند تغيير initialFiles (مهم جداً)
  useEffect(() => {
    if (!Array.isArray(initialFiles)) {
      return;
    }

    const existing = initialFiles.filter((f) => !(f instanceof File));

    const newOnes = initialFiles.filter((f) => f instanceof File);

    // منع التكرار
    const uniqueExisting = existing.filter(
      (file, index, self) =>
        index === self.findIndex((f) => f?.url === file?.url),
    );

    const uniqueNew = newOnes.filter(
      (file, index, self) =>
        index ===
        self.findIndex((f) => f.name === file.name && f.size === file.size),
    );

    setExistingFiles(uniqueExisting);
    setNewFiles(uniqueNew);
  }, [initialFiles]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // التحقق من الحجم
    const oversized = selectedFiles.find(
      (file) => file.size > maxSizeMB * 1024 * 1024,
    );
    if (oversized) {
      alert(
        isArabic
          ? `الحد الأقصى لحجم الملف ${maxSizeMB} ميجا`
          : `Maximum file size is ${maxSizeMB}MB`,
      );
      return;
    }

    const uniqueNewFiles = selectedFiles.filter(
      (file) =>
        !newFiles.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size,
        ),
    );

    if (
      existingFiles.length + newFiles.length + uniqueNewFiles.length >
      maxFiles
    ) {
      alert(
        isArabic
          ? `يمكن رفع ${maxFiles} ملفات كحد أقصى`
          : `Maximum ${maxFiles} files allowed`,
      );
      return;
    }

    const updatedNewFiles = [...newFiles, ...uniqueNewFiles];
    setNewFiles(updatedNewFiles);

    // إرسال كل الملفات (الموجودة + الجديدة)
    onChange?.([...existingFiles, ...updatedNewFiles]);
  };

  const removeNewFile = (index) => {
    const updated = newFiles.filter((_, i) => i !== index);
    setNewFiles(updated);
    onChange?.([...existingFiles, ...updated]);
  };

  const removeExistingFile = (index, file) => {
    const updatedExisting = existingFiles.filter((_, i) => i !== index);
    setExistingFiles(updatedExisting);
    onChange?.([...updatedExisting, ...newFiles]);
    onDeleteExisting?.(file);
  };

  const getFileIcon = (file) => {
    const fileName = file.name || file.originalName || file.url || "";
    if (fileName.toLowerCase().endsWith(".pdf"))
      return <FaFilePdf className="text-danger" />;
    if (fileName.toLowerCase().match(/\.(doc|docx)$/))
      return <FaFileWord className="text-primary" />;
    return <FaUpload className="text-muted" />;
  };

  const formatFileSize = (file) => {
    const size = file.size || 0;
    return (size / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-semibold">
        {isArabic ? labelAr : labelEn}
      </Form.Label>

      <div className="border rounded-3 p-3 bg-light">
        <Form.Control
          type="file"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleFileChange}
        />

        {/* Existing Files */}
        {existingFiles.length > 0 && (
          <div className="mt-3">
            <p className="fw-semibold text-muted small mb-2">
              {isArabic ? "الملفات الموجودة:" : "Existing Files:"}
            </p>
            <ListGroup>
              {existingFiles.map((file, index) => (
                <ListGroup.Item
                  key={`exist-${index}`}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1">
                    {getFileIcon(file)}
                    <span
                      className="text-truncate"
                      style={{ maxWidth: "280px" }}
                    >
                      {file.originalName || file.url || file}
                    </span>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeExistingFile(index, file)}
                  >
                    <FaTrash />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* New Files */}
        {newFiles.length > 0 && (
          <div className="mt-3">
            <p className="fw-semibold text-muted small mb-2">
              {isArabic ? "الملفات الجديدة:" : "New Files:"}
            </p>
            <ListGroup>
              {newFiles.map((file, index) => (
                <ListGroup.Item
                  key={`new-${index}`}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1">
                    {getFileIcon(file)}
                    <span
                      className="text-truncate"
                      style={{ maxWidth: "280px" }}
                    >
                      {file.name}
                    </span>
                    <Badge bg="secondary" className="ms-2">
                      {formatFileSize(file)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeNewFile(index)}
                  >
                    <FaTrash />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </div>
    </Form.Group>
  );
};

export default FileAttachmentUploader;

// import React, { useState, useEffect } from "react";
// import { Form, Button, ListGroup, Badge } from "react-bootstrap";
// import { useTranslation } from "react-i18next";
// import { FaUpload, FaTrash, FaFilePdf, FaFileWord } from "react-icons/fa";

// const FileAttachmentUploader = ({
//   labelAr = "الملفات المرفقة",
//   labelEn = "Attachments",
//   name = "attachments",
//   multiple = true,
//   acceptedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
//   maxFiles = 5,
//   maxSizeMB = 10,
//   initialFiles = [],
//   onChange,
//   onDeleteExisting,
// }) => {
//     const [newFiles, setNewFiles] = useState([]);
//   const [existingFiles, setExistingFiles] = useState([]);

//   const { i18n } = useTranslation();
//   const isArabic = i18n.language === "ar";

//   const [files, setFiles] = useState(
//     initialFiles.filter((f) => f instanceof File) || [],
//   );
// //   const [existingFiles, setExistingFiles] = useState(
// //     initialFiles.filter((f) => !(f instanceof File)) || [],
// //   );
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const newFiles = initialFiles.filter((f) => f instanceof File) || [];
//     const newExisting = initialFiles.filter((f) => !(f instanceof File)) || [];
//     setFiles(newFiles);
//     setExistingFiles(newExisting);
//   }, [initialFiles]);

// //   const { i18n } = useTranslation();
// //   const isArabic = i18n.language === "ar";

//   const handleFileChange = (e) => {
//     const selectedFiles = Array.from(e.target.files);
//     setError("");

//     // التحقق من عدد الملفات
//     if (existingFiles.length + files.length + selectedFiles.length > maxFiles) {
//       setError(
//         isArabic
//           ? `يمكن رفع ${maxFiles} ملفات فقط`
//           : `Maximum ${maxFiles} files allowed`,
//       );
//       return;
//     }

//     // التحقق من الحجم
//     const oversized = selectedFiles.find(
//       (file) => file.size > maxSizeMB * 1024 * 1024,
//     );
//     if (oversized) {
//       setError(
//         isArabic
//           ? `حجم الملف يجب أن لا يتجاوز ${maxSizeMB} ميجا`
//           : `File size must not exceed ${maxSizeMB}MB`,
//       );
//       return;
//     }

//     const newFiles = [...files, ...selectedFiles];
//     setFiles(newFiles);
//     onChange?.([...existingFiles, ...newFiles]);
//   };

//   const removeFile = (index) => {
//     const updatedFiles = files.filter((_, i) => i !== index);
//     setFiles(updatedFiles);
//     onChange?.([...existingFiles, ...updatedFiles]);
//   };

//   const removeExistingFile = (index, file) => {
//     const updatedExisting = existingFiles.filter((_, i) => i !== index);
//     setExistingFiles(updatedExisting);
//     onChange?.([...updatedExisting, ...files]);
//     onDeleteExisting?.(file);
//   };

//   const getFileIcon = (file) => {
//     const fileName = file.name || file.originalName || "";
//     if (fileName.toLowerCase().endsWith(".pdf"))
//       return <FaFilePdf className="text-danger" />;
//     if (fileName.toLowerCase().match(/\.(doc|docx)$/))
//       return <FaFileWord className="text-primary" />;
//     return <FaUpload />;
//   };

//   const formatFileSize = (file) => {
//     if (file.size) {
//       return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
//     }
//     return "Unknown size";
//   };

//   return (
//     <Form.Group className="mb-3">
//       <Form.Label className="fw-semibold">
//         {isArabic ? labelAr : labelEn}
//       </Form.Label>

//       <div className="border rounded p-3 bg-light">
//         <Form.Control
//           type="file"
//           multiple={multiple}
//           accept={acceptedTypes}
//           onChange={handleFileChange}
//         />

//         {error && <p className="text-danger small mt-2">{error}</p>}

//         {/* Existing files from database */}
//         {existingFiles.length > 0 && (
//           <div className="mt-3">
//             <p className="fw-semibold text-muted small">
//               {isArabic ? "الملفات الموجودة:" : "Existing Files:"}
//             </p>
//             <ListGroup>
//               {existingFiles.map((file, index) => (
//                 <ListGroup.Item
//                   key={`existing-${index}`}
//                   className="d-flex justify-content-between align-items-center bg-warning-light"
//                 >
//                   <div className="d-flex align-items-center gap-2">
//                     {getFileIcon(file)}
//                     <span
//                       className="text-truncate"
//                       style={{ maxWidth: "300px" }}
//                     >
//                       {file.originalName || file.fileName}
//                     </span>
//                     <Badge bg="info" className="ms-2">
//                       {isArabic ? "موجود" : "Existing"}
//                     </Badge>
//                   </div>
//                   <Button
//                     variant="outline-warning"
//                     size="sm"
//                     onClick={() => removeExistingFile(index, file)}
//                   >
//                     <FaTrash />
//                   </Button>
//                 </ListGroup.Item>
//               ))}
//             </ListGroup>
//           </div>
//         )}

//         {/* New uploaded files */}
//         {files.length > 0 && (
//           <ListGroup className="mt-3">
//             {files.map((file, index) => (
//               <ListGroup.Item
//                 key={index}
//                 className="d-flex justify-content-between align-items-center"
//               >
//                 <div className="d-flex align-items-center gap-2">
//                   {getFileIcon(file)}
//                   <span className="text-truncate" style={{ maxWidth: "300px" }}>
//                     {file.name}
//                   </span>
//                   <Badge bg="success" className="ms-2">
//                     {isArabic ? "جديد" : "New"}
//                   </Badge>
//                   <Badge bg="secondary" className="ms-2">
//                     {formatFileSize(file)}
//                   </Badge>
//                 </div>
//                 <Button
//                   variant="outline-danger"
//                   size="sm"
//                   onClick={() => removeFile(index)}
//                 >
//                   <FaTrash />
//                 </Button>
//               </ListGroup.Item>
//             ))}
//           </ListGroup>
//         )}
//       </div>
//     </Form.Group>
//   );
// };

// export default FileAttachmentUploader;
