import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  fetchUmrahPrograms,
  deleteUmrahProgram,
  toggleUmrahProgramStatus,
  setPage,
  setLimit,
} from "../../../redux/umrah/umrahProgramSlice";

import { buildQuery } from "../../../Utils/buildQuery";
import { formatDate } from "../../../Utils/dateUtils";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatPrice } from "../../../Utils/roundPrice";

import PageHeader from "../../../Components/layout/PageHeader";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";

export default function AdminUmrahProgramList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    umrahProgramsList = [],
    loading,
    error,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.umrahPrograms || {});

  const navigate = useNavigate();
  const {
    currentItem: currentProgram,
    showDetails,
    deleteModal,
    openDetails,
    openDelete,
    closeDetails,
    closeDelete,
  } = useAdminEntityCrudState();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sort: "createdAt_desc",
  });
  const currentPage = pagination.page;
  const currentLimit = pagination.limit;

  useEffect(() => {
    const query = buildQuery(filters, { page: currentPage, limit: currentLimit });
    dispatch(fetchUmrahPrograms(query));
  }, [currentLimit, currentPage, dispatch, filters]);

  const openCreatePage = () => {
    navigate("/admin/umrah-program/create");
  };

  const openEditPage = (program) => {
    navigate(`/admin/umrah-program/edit/${program._id}`);
  };

  const openClonePage = (program) => {
    navigate(`/admin/umrah-program/clone/${program._id}`);
  };


  const confirmDelete = async () => {
    try {
      await dispatch(deleteUmrahProgram(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم حذف البرنامج" : "Program deleted");
      await dispatch(fetchUmrahPrograms(buildQuery(filters, pagination))).unwrap();
    } catch (deleteError) {
      toast.error(handleApiError(deleteError, (message) => message, lang));
    } finally {
      closeDelete();
    }
  };

  const toggleStatus = async (row) => {
    try {
      await dispatch(toggleUmrahProgramStatus({
        id: row._id,
        status: row.status === "active" ? "inactive" : "active",
      })).unwrap();
    } catch (toggleError) {
      toast.error(handleApiError(toggleError, (message) => message, lang));
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
      exportImageAccessor: "images",
      pdfWidth: 52,
      render: (row) => <ImagePreviewCell images={row.images} />,
    },
    {
      header: lang === "ar" ? "اسم البرنامج" : "Program Name",
      accessor: ["nameAr", "nameEn"],
    },
    {
      header: lang === "ar" ? "تاريخ البداية" : "Start Date",
      render: (row) => formatDate(row.startDate, { isArabic: lang === "ar" }),
    },
    {
      header: lang === "ar" ? "تاريخ النهاية" : "End Date",
      render: (row) => formatDate(row.endDate, { isArabic: lang === "ar" }),
    },
    {
      header: lang === "ar" ? "السعر" : "Price",
      align: "center",
      excelValue: (row) => row.pricing?.basePrice ?? 0,
      pdfValue: (row) => row.pricing?.basePrice ?? 0,
      excelType: "number",
      render: (row) => {
        const price = row.pricing?.basePrice || 0;
        const currency = row.pricing?.currency || "SAR";
        return <span className="fw-bold text-success">{formatPrice(price, currency)}</span>;
      },
    },
    // {
    //   header: lang === "ar" ? "العملة" : "Currency",
    //   accessor: "pricing.currency",
    //   align: "center",
    // },
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
      render: (row) => (
        <StatusBadge value={row.status} type="program" isArabic={lang === "ar"} />
      ),
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
            onClick={() => toggleStatus(row)}
          />
          <ActionButton
            action="view"
            onClick={() => openDetails(row)}
          />
          <ActionButton
            action="delete"
            onClick={() => openDelete(row, lang === "ar" ? row.nameAr : row.nameEn)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-2">
      <PageHeader
        titleAr="إدارة برامج العمرة"
        titleEn="Umrah Programs Management"
        subtitleAr="إدارة برامج وباقات العمرة"
        subtitleEn="Manage Umrah Programs and Packages"
        actions={
          <AdminPageActions>
            <ActionButton
              size="md"
              action="add"
              label={lang === "ar" ? "إضافة برنامج عمرة" : "Add Umrah Program"}
              onClick={openCreatePage}
            />
            <ExportTableButtons data={umrahProgramsList} columns={columns} lang={lang} fileName="Packages List" title={lang === "ar" ? "قائمة البرامج" : "Packages List"} />
          </AdminPageActions>
        }
      />

      <LoadingOverlay show={loading} />
      <ErrorOverlay show={!loading && Boolean(error)} message={error} />

      <EntityDetailsModal
        show={showDetails}
        onHide={closeDetails}
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
            value: formatDate(currentProgram?.startDate, {
              isArabic: lang === "ar",
              fallback: lang === "ar" ? "غير متوفر" : "Not available",
            }),
          },
          {
            label: lang === "ar" ? "تاريخ النهاية" : "End Date",
            value: formatDate(currentProgram?.endDate, {
              isArabic: lang === "ar",
              fallback: lang === "ar" ? "غير متوفر" : "Not available",
            }),
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
            value: currentProgram?.pricing?.basePrice != null
              ? formatPrice(currentProgram.pricing.basePrice, currentProgram.pricing.currency || "SAR")
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "الإجمالي قبل الخصم" : "Total Price",
            value: currentProgram?.pricing?.totalPrice != null
              ? formatPrice(currentProgram.pricing.totalPrice, currentProgram.pricing.currency || "SAR")
              : "غير متوفر",
          },
          {
            label: lang === "ar" ? "السعر النهائي" : "Final Price",
            value: currentProgram?.pricing?.finalPrice != null
              ? formatPrice(currentProgram.pricing.finalPrice, currentProgram.pricing.currency || "SAR")
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
                        {formatPrice(item.priceAtTime || 0, item.currency || "SAR")}
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
                        {formatPrice(
                          Number(item.priceAtTime || 0) * Number(item.quantity || 1),
                          item.currency || "SAR",
                        )}
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
            value: formatDate(currentProgram?.createdAt, {
              isArabic: lang === "ar",
              fallback: lang === "ar" ? "غير متوفر" : "Not available",
            }),
          },
          {
            label: lang === "ar" ? "آخر تحديث" : "Updated At",
            value: formatDate(currentProgram?.updatedAt, {
              isArabic: lang === "ar",
              fallback: lang === "ar" ? "غير متوفر" : "Not available",
            }),
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
      {!error && (
        <UniversalTable
          columns={columns}
          data={umrahProgramsList}
          lang={lang}
          emptyMessage={lang === "ar" ? "لا توجد برامج عمرة" : "No Umrah programs found"}
        />
      )}

      {!error && (
        <PaginationComponent
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => dispatch(setPage(newPage))}
          onLimitChange={(newLimit) => dispatch(setLimit(newLimit))}
        />
      )}

      <ConfirmDialog
        show={deleteModal.show}
        onHide={closeDelete}
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
