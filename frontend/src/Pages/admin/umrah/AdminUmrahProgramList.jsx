import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Badge } from "react-bootstrap";
import { toast } from "react-toastify";

import {
  fetchUmrahPrograms,
  createUmrahProgram,
  updateUmrahProgram,
  deleteUmrahProgram,
  toggleUmrahProgramStatus,
  setPage,
  setLimit,
} from "../../../redux/umrah/umrahProgramSlice";

import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";

// import { umrahProgramFormConfig } from "../../../Components/common/ModalForms/umrah/umrahProgramFormConfig";
import { umrahProgramFormConfig } from "../../../Components/common/umrah/umrahProgramFormConfig";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";

export default function AdminUmrahProgramList() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    umrahProgramsList = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.umrahPrograms || {});

  const [showModal, setShowModal] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formErrors, setFormErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);

  const navigate = useNavigate();

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sort: "createdAt_desc",
  });
  const [showDetails, setShowDetails] = useState(false);

  const memoizedConfig = useMemo(() => umrahProgramFormConfig(), []);

  useEffect(() => {
    const query = buildQuery(filters, pagination);
    dispatch(fetchUmrahPrograms(query));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  const openCreatePage = () => {
    navigate("/admin/umrah-program/create");
  };

  const openEditPage = (program) => {
    navigate(`/admin/umrah-program/edit/${program._id}`);
  };

  const openClonePage = (program) => {
    navigate(`/admin/umrah-program/clone/${program._id}`);
  };

  const handleSave = createHandleSave({
    dispatch,
    createAction: createUmrahProgram,
    updateAction: updateUmrahProgram,
    fetchAction: fetchUmrahPrograms,
    getId: (item) => item._id,
    formConfig: memoizedConfig,
    toast,
    lang,
    closeModal: () => setShowModal(false),
    resetItem: () => setCurrentProgram(null),
    resetMode: () => setFormMode("create"),
    setLoading: setLoadingSave,
    setFormErrors,
  });

  const formatPrice = (amount, currency = "SAR") =>
    `${Number(amount || 0).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} ${currency}`;

  const getServiceName = (item) =>
    lang === "ar"
      ? item.nameAr || item.name || item.nameEn || "-"
      : item.nameEn || item.name || item.nameAr || "-";

  const getServiceDescription = (item) =>
    lang === "ar"
      ? item.descriptionAr || item.description || item.descriptionEn || ""
      : item.descriptionEn || item.description || item.descriptionAr || "";

  const getServiceExtraDetails = (item) => {
    const snapshot = item.productSnapshot || {};
    const ignoredKeys = new Set([
      "_id",
      "id",
      "__v",
      "name",
      "nameAr",
      "nameEn",
      "description",
      "descriptionAr",
      "descriptionEn",
      "images",
      "image",
      "mainImage",
      "price",
      "basePrice",
      "pricing",
      "currency",
      "createdAt",
      "updatedAt",
      "isDeleted",
    ]);

    return Object.entries(snapshot)
      .filter(([key, value]) => {
        if (ignoredKeys.has(key)) return false;
        if (value === null || value === undefined || value === "") return false;
        if (typeof value === "object") return false;
        return true;
      })
      .slice(0, 8);
  };

  // const renderSelectedServices = () => {
  //   if (!currentProgram?.items?.length) {
  //     return lang === "ar" ? "لا توجد خدمات" : "No services";
  //   }

  //   return (
  //     <div className="d-flex flex-column gap-3">
  //       {currentProgram.items.map((item, index) => {
  //         const currency = item.currency || "SAR";
  //         const unitPrice = Number(item.priceAtTime || 0);
  //         const quantity = Number(item.quantity || 1);
  //         const extraDetails = getServiceExtraDetails(item);

  //         return (
  //           <div
  //             key={`${item.productId || index}-${item.category || ""}`}
  //             className="border rounded bg-white p-3"
  //           >
  //             <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
  //               <div>
  //                 <Badge bg="info" className="mb-2">
  //                   {item.categoryLabel || item.category || "-"}
  //                 </Badge>
  //                 <div className="fw-bold">{getServiceName(item)}</div>
  //                 {getServiceDescription(item) && (
  //                   <div className="text-muted small mt-1">
  //                     {getServiceDescription(item)}
  //                   </div>
  //                 )}
  //               </div>

  //               <div className="text-end">
  //                 <div>{formatPrice(unitPrice, currency)}</div>
  //                 <small className="text-muted">
  //                   {lang === "ar" ? "الكمية" : "Qty"}: {quantity}
  //                 </small>
  //                 <div className="fw-bold text-success">
  //                   {formatPrice(unitPrice * quantity, currency)}
  //                 </div>
  //               </div>
  //             </div>

  //             <div className="row g-2 mt-2 small">
  //               <div className="col-md-6">
  //                 <span className="text-muted">
  //                   {lang === "ar" ? "النوع" : "Type"}:
  //                 </span>{" "}
  //                 {item.category || "-"}
  //               </div>
  //               <div className="col-md-6">
  //                 <span className="text-muted">
  //                   {lang === "ar" ? "معرّف المنتج" : "Product ID"}:
  //                 </span>{" "}
  //                 {item.productId || "-"}
  //               </div>

  //               {extraDetails.map(([key, value]) => (
  //                 <div className="col-md-6" key={key}>
  //                   <span className="text-muted">{key}:</span> {String(value)}
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         );
  //       })}
  //     </div>
  //   );
  // };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteUmrahProgram(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم حذف البرنامج" : "Program deleted");
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ أثناء الحذف" : "Delete failed");
    } finally {
      setDeleteModal({ show: false, id: null, name: "" });
    }
  };

  const columns = [
    {
      header: lang === "ar" ? "الرقم" : "No",
      align: "center",
      width: "60px",
      render: (_, index) => <span className="fw-bold">{index + 1}</span>,
    },
    {
      header: lang === "ar" ? "الصور" : "Images",
      align: "center",
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    {
      header: lang === "ar" ? "اسم البرنامج" : "Program Name",
      accessor: ["nameAr", "nameEn"],
    },
    {
      header: lang === "ar" ? "تاريخ البداية" : "Start Date",
      render: (row) =>
        row.startDate
          ? new Date(row.startDate).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US",
            )
          : "-",
    },
    {
      header: lang === "ar" ? "تاريخ النهاية" : "End Date",
      render: (row) =>
        row.endDate
          ? new Date(row.endDate).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US",
            )
          : "-",
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      render: (row) => {
        const price = row.pricing?.basePrice || 0;
        const currency = row.pricing?.currency || "SAR";
        return (
          <span className="fw-bold text-success">
            {price} {currency}
          </span>
        );
      },
    },
    {
      header: lang === "ar" ? "المقاعد" : "Seats",
      align: "center",
      render: (row) => (
        <span>
          {row.capacity?.availableSeats ?? 0} / {row.capacity?.totalSeats ?? 0}
        </span>
      ),
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      align: "center",
      render: (row) => {
        const statusLabels = {
          draft: lang === "ar" ? "مسودة" : "Draft",
          active: lang === "ar" ? "نشط" : "Active",
          inactive: lang === "ar" ? "غير نشط" : "Inactive",
          sold_out: lang === "ar" ? "مكتمل العدد" : "Sold Out",
          expired: lang === "ar" ? "منتهي" : "Expired",
        };

        const statusVariants = {
          draft: "warning",
          active: "success",
          inactive: "secondary",
          sold_out: "danger",
          expired: "dark",
        };

        return (
          <Badge bg={statusVariants[row.status] || "secondary"}>
            {statusLabels[row.status] || row.status || "-"}
          </Badge>
        );
      },
    },
    {
      header: lang === "ar" ? "الإجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <div className="d-flex justify-content-center gap-1">
          <ActionButton action="edit" onClick={() => openEditPage(row)} />
          <ActionButton action="clone" onClick={() => openClonePage(row)} />
          <ActionButton
            action={row.status === "active" ? "hide" : "show"}
            onClick={() =>
              dispatch(
                toggleUmrahProgramStatus({
                  id: row._id,
                  status: row.status === "active" ? "inactive" : "active",
                }),
              )
            }
          />
          <ActionButton
            action="view"
            onClick={() => {
              setCurrentProgram(row);
              setShowDetails(true);
            }}
          />
          <ActionButton
            action="delete"
            onClick={() =>
              setDeleteModal({
                show: true,
                id: row._id,
                name: lang === "ar" ? row.nameAr : row.nameEn,
              })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-2">
      <PageHeader
        subtitleAr="إدارة برامج وباقات العمرة"
        subtitleEn="Manage Umrah Programs and Packages"
      />
      {/* Action Buttons Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Action Buttons */}
        <div className="w-100 d-flex justify-content-center">
          <div className="d-inline-flex align-items-center gap-2">
            <ActionButton
              size="md"
              action="add"
              label={lang === "ar" ? "إضافة برنامج عمرة" : "Add Umrah Program"}
              onClick={openCreatePage}
            />
          </div>
        </div>
        <ExportTableButtons
          data={umrahProgramsList}
          columns={columns}
          lang={lang}
          filename="Packages List"
          title={lang === "ar" ? "قائمة البرامج" : "Packages List"}
        />
      </div>

      <LoadingOverlay show={loading} />

      <EntityDetailsModal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        title={lang === "ar" ? "تفاصيل برنامج العمرة" : "Umrah Program Details"}
        images={currentProgram?.images || []}
        fields={[
          {
            label: lang === "ar" ? "اسم البرنامج بالعربية" : "Arabic Name",
            value: currentProgram?.nameAr || "غير متوفر",
          },
          {
            label: lang === "ar" ? "اسم البرنامج بالإنجليزية" : "English Name",
            value: currentProgram?.nameEn || "غير متوفر",
          },
          {
            label: lang === "ar" ? "الوصف المختصر" : "Short Description",
            value:
              lang === "ar"
                ? currentProgram?.shortDescriptionAr || "غير متوفر"
                : currentProgram?.shortDescriptionEn || "N/A",
          },
          {
            label: lang === "ar" ? "الوصف التفصيلي" : "Detailed Description",
            value:
              lang === "ar"
                ? currentProgram?.descriptionAr || "غير متوفر"
                : currentProgram?.descriptionEn || "N/A",
          },
          {
            label: lang === "ar" ? "تاريخ البداية" : "Start Date",
            value: currentProgram?.startDate
              ? new Date(currentProgram.startDate).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "تاريخ النهاية" : "End Date",
            value: currentProgram?.endDate
              ? new Date(currentProgram.endDate).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "عدد الأيام" : "Duration Days",
            value: currentProgram?.durationDays ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "درجة الخدمة" : "Service Level",
            value:
              {
                economy: lang === "ar" ? "اقتصادي" : "Economy",
                deluxe: lang === "ar" ? "ديلوكس" : "Deluxe",
                premium: lang === "ar" ? "بريميوم" : "Premium",
                vip: "VIP",
              }[currentProgram?.serviceLevel] ||
              (lang === "ar" ? "غير متوفر" : "Not Available"),
          },
          {
            label: lang === "ar" ? "الحالة" : "Status",
            value:
              {
                draft: lang === "ar" ? "مسودة" : "Draft",
                active: lang === "ar" ? "نشط" : "Active",
                inactive: lang === "ar" ? "غير نشط" : "Inactive",
                sold_out: lang === "ar" ? "مكتمل العدد" : "Sold Out",
              }[currentProgram?.status] || "غير متوفر",
          },
          {
            label: lang === "ar" ? "إجمالي المقاعد" : "Total Seats",
            value: currentProgram?.capacity?.totalSeats ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "المقاعد المتاحة" : "Available Seats",
            value: currentProgram?.capacity?.availableSeats ?? "غير متوفر",
          },
          {
            label: lang === "ar" ? "السعر الأساسي" : "Base Price",
            value: currentProgram?.pricing?.basePrice
              ? `${currentProgram.pricing.basePrice} ${
                  currentProgram.pricing.currency || "SAR"
                }`
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "الإجمالي قبل الخصم" : "Total Price",
            value: currentProgram?.pricing?.totalPrice
              ? `${currentProgram.pricing.totalPrice} ${
                  currentProgram.pricing.currency || "SAR"
                }`
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "السعر النهائي" : "Final Price",
            value: currentProgram?.pricing?.finalPrice
              ? `${currentProgram.pricing.finalPrice} ${
                  currentProgram.pricing.currency || "SAR"
                }`
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "الخدمات المختارة" : "Selected Services",
            col: "col-12",
            value: currentProgram?.items?.length ? (
              <div className="d-flex flex-column gap-3">
                {currentProgram.items.map((item, index) => (
                  <div key={index} className="border rounded-3 p-3 bg-white">
                    <h6 className="fw-bold mb-2">
                      {lang === "ar"
                        ? item.nameAr || item.name || "خدمة بدون اسم"
                        : item.nameEn || item.name || "Unnamed Service"}
                    </h6>

                    <div className="row g-2 small">
                      <div className="col-md-3">
                        <strong>{lang === "ar" ? "النوع:" : "Type:"}</strong>{" "}
                        {item.category || "-"}
                      </div>

                      <div className="col-md-3">
                        <strong>{lang === "ar" ? "السعر:" : "Price:"}</strong>{" "}
                        {item.priceAtTime || 0} {item.currency || "SAR"}
                      </div>

                      <div className="col-md-3">
                        <strong>
                          {lang === "ar" ? "الكمية:" : "Quantity:"}
                        </strong>{" "}
                        {item.quantity || 1}
                      </div>

                      <div className="col-md-3">
                        <strong>
                          {lang === "ar" ? "الإجمالي:" : "Total:"}
                        </strong>{" "}
                        {(
                          Number(item.priceAtTime || 0) *
                          Number(item.quantity || 1)
                        ).toLocaleString(
                          lang === "ar" ? "ar-SA" : "en-US",
                        )}{" "}
                        {item.currency || "SAR"}
                      </div>
                    </div>

                    {item.details && (
                      <pre className="bg-light rounded p-2 mt-2 small mb-0">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : lang === "ar" ? (
              "لا توجد خدمات"
            ) : (
              "No services"
            ),
          },
          {
            label: lang === "ar" ? "تاريخ الإنشاء" : "Created At",
            value: currentProgram?.createdAt
              ? new Date(currentProgram.createdAt).toLocaleString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "آخر تحديث" : "Updated At",
            value: currentProgram?.updatedAt
              ? new Date(currentProgram.updatedAt).toLocaleString(
                  lang === "ar" ? "ar-SA" : "en-US",
                )
              : "غير متوفر",
          },
        ]}
      />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          search: {
            type: "text",
            col: 4,
            placeholder:
              lang === "ar" ? "ابحث باسم البرنامج" : "Search by program name",
          },
          status: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "الحالة" : "Status",
            options: [
              { value: "draft", labelAr: "مسودة", labelEn: "Draft" },
              { value: "active", labelAr: "نشط", labelEn: "Active" },
              { value: "inactive", labelAr: "غير نشط", labelEn: "Inactive" },
              {
                value: "sold_out",
                labelAr: "مكتمل العدد",
                labelEn: "Sold Out",
              },
              { value: "expired", labelAr: "منتهي", labelEn: "Expired" },
            ],
          },
          sort: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "الترتيب" : "Sort",
            options: [
              {
                value: "createdAt_desc",
                labelAr: "الأحدث أولاً",
                labelEn: "Newest First",
              },
              {
                value: "createdAt_asc",
                labelAr: "الأقدم أولاً",
                labelEn: "Oldest First",
              },
              {
                value: "pricing.basePrice_asc",
                labelAr: "السعر من الأقل للأعلى",
                labelEn: "Price Low to High",
              },
              {
                value: "pricing.basePrice_desc",
                labelAr: "السعر من الأعلى للأقل",
                labelEn: "Price High to Low",
              },
            ],
          },
        }}
      />
      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={(data) =>
          handleSave(data, {
            formMode,
            currentItem: currentProgram,
          })
        }
        config={memoizedConfig}
        initialData={currentProgram}
        titleAr={
          formMode === "edit" ? "تعديل برنامج العمرة" : "إضافة برنامج عمرة"
        }
        titleEn={
          formMode === "edit" ? "Edit Umrah Program" : "Add Umrah Program"
        }
        errors={formErrors}
        loading={loadingSave}
      />

      <PaginationComponent
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => dispatch(setPage(newPage))}
        onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
      />

      <UniversalTable
        columns={columns}
        data={umrahProgramsList}
        lang={lang}
        emptyMessage={
          lang === "ar" ? "لا توجد برامج عمرة" : "No Umrah programs found"
        }
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "حذف برنامج العمرة؟" : "Delete Umrah Program?"}
        message={
          <span>
            {lang === "ar"
              ? "هل أنت متأكد من حذف البرنامج: "
              : "Are you sure you want to delete: "}
            <strong>{deleteModal.name}</strong>
          </span>
        }
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="delete"
      />
    </div>
  );
}
