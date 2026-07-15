import { useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import {
  upsertInventoryPeriod,
  updateInventory,
  deleteInventory,
  setPage,
  setLimit,
  fetchInventoryPeriods,
} from "../../../redux/inventory/inventorySlice";

import { fetchRoomTypes } from "../../../redux/hotels/roomtypeSlice";
import { fetchTrips } from "../../../redux/transports/tripSlice";
import { fetchTransports } from "../../../redux/transports/transportSlice";
import { fetchVehicleRentals } from "../../../redux/transports/vehicleRentalSlice";
import { fetchExtraServices } from "../../../redux/extraServices/extraServiceSlice";
import { fetchVisas } from "../../../redux/visas/visaSlice";

import { inventoryFormConfig } from "../../../Components/common/ModalForms/inventory/inventoryFormConfig";

import { buildQuery } from "../../../Utils/buildQuery";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";

import PageHeader from "../../../Components/layout/PageHeader";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PaginationComponent from "../../../Components/common/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmModal";

export default function AdminInventoryList() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";

  const {
    inventoryList = [],
    loading,
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = useSelector((state) => state.inventory || {});

  const { roomTypesList = [] } = useSelector((state) => state.roomTypes || {});

  const { tripList = [] } = useSelector((state) => state.trip || {});
  const { transportList = [] } = useSelector((state) => state.transport || {});
  const { list: visasList = [] } = useSelector((state) => state.visas || {});

  const { vehicleRentalsList = [] } = useSelector(
    (state) => state.vehicleRentals || {},
  );
  const { extraServicesList = [] } = useSelector(
    (state) => state.extraServices || {},
  );

  const [showModal, setShowModal] = useState(false);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formErrors, setFormErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
  });

  const [filters, setFilters] = useState({
    inventoryType: "",
    itemId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    dispatch(fetchRoomTypes({ page: 1, limit: 1000 }));
    dispatch(fetchTrips({ page: 1, limit: 1000 }));
    dispatch(fetchTransports({ page: 1, limit: 1000 }));
    dispatch(fetchVehicleRentals({ page: 1, limit: 1000 }));
    dispatch(fetchExtraServices({ page: 1, limit: 1000 }));
    dispatch(fetchVisas({ page: 1, limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    const query = buildQuery(filters, pagination);
    dispatch(fetchInventoryPeriods(query));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  const memoizedConfig = useMemo(
    () =>
      inventoryFormConfig({
        roomTypes: roomTypesList,
        trips: tripList,
        transports: transportList,
        vehicleRentals: vehicleRentalsList,
        extraServices: extraServicesList,
        visas: visasList,
      }),
    [
      roomTypesList,
      tripList,
      transportList,
      vehicleRentalsList,
      extraServicesList,
      visasList,
    ],
  );

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentInventory({
      inventoryType: "roomType",
      itemId: "",
      startDate: "",
      endDate: "",
      total: 1,
      reserved: 0,
      blocked: 0,
      notes: "",
      isActive: true,
    });

    setFormErrors({});
    setShowModal(true);
  };


  const openEditModal = (item) => {
    setFormMode("edit");
    setCurrentInventory(normalizeForForm(item, memoizedConfig));
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = createHandleSave({
    dispatch,
    createAction: upsertInventoryPeriod,
    updateAction: updateInventory,
    fetchAction: fetchInventoryPeriods,
    getId: (item) => item._id,
    formConfig: memoizedConfig,
    toast,
    lang,
    closeModal: () => setShowModal(false),
    resetItem: () => setCurrentInventory(null),
    resetMode: () => setFormMode("create"),
    setLoading: setLoadingSave,
    setFormErrors,
    useFormData: false,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteInventory(deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم حذف المخزون" : "Inventory deleted");
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ أثناء الحذف" : "Delete failed");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const typeLabel = (type) => {
    const labels = {
      roomType: lang === "ar" ? "نوع غرفة" : "Room Type",
      trip: lang === "ar" ? "رحلة" : "Trip",
      transport: lang === "ar" ? "وسيلة نقل" : "Transport",
      vehicleRental: lang === "ar" ? "تأجير نقل" : "Vehicle Rental",
      extraService: lang === "ar" ? "خدمة إضافية" : "Extra Service",
      visa: lang === "ar" ? "تأشيرة" : "Visa",
    };

    return labels[type] || type;
  };

  const columns = [
    {
      header: lang === "ar" ? "النوع" : "Type",
      render: (row) => typeLabel(row.inventoryType),
    },
    {
      header: lang === "ar" ? "المنتج" : "Product",
      // render: (row) => row.itemId || "-",
      render: (row) => {
        const item = row.itemId;

        if (!item) return "-";

        if (typeof item === "object") {
          return (
            item.nameAr ||
            item.nameEn ||
            item.titleAr ||
            item.titleEn ||
            item._id ||
            "-"
          );
        }

        return item;
      },
    },
    // {
    //   header: lang === "ar" ? "التاريخ" : "Date",
    //   render: (row) =>
    //     row.date
    //       ? new Date(row.date).toLocaleDateString(
    //           lang === "ar" ? "ar-SA" : "en-US",
    //         )
    //       : "-",
    // },
    {
  header: lang === "ar" ? "الفترة" : "Period",
  render: (row) => {
    const start = row.startDate
      ? new Date(row.startDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")
      : "-";

    const end = row.endDate
      ? new Date(row.endDate).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")
      : "-";

    return `${start} - ${end}`;
  },
},
{
  header: lang === "ar" ? "عدد الأيام" : "Days",
  render: (row) => row.daysCount ?? 0,
},
    {
      header: lang === "ar" ? "الإجمالي" : "Total",
      render: (row) => row.total ?? 0,
    },
    {
      header: lang === "ar" ? "المحجوز" : "Reserved",
      render: (row) => row.reserved ?? 0,
    },
    {
      header: lang === "ar" ? "الموقوف" : "Blocked",
      render: (row) => row.blocked ?? 0,
    },
    {
      header: lang === "ar" ? "المتاح" : "Available",
      render: (row) => (
        <Badge bg={(row.available ?? 0) > 0 ? "success" : "danger"}>
          {row.available ?? 0}
        </Badge>
      ),
    },
    {
      header: lang === "ar" ? "الحالة" : "Status",
      render: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive
            ? lang === "ar"
              ? "نشط"
              : "Active"
            : lang === "ar"
              ? "غير نشط"
              : "Inactive"}
        </Badge>
      ),
    },
    {
      header: lang === "ar" ? "الإجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          <ActionButton action="edit" onClick={() => openEditModal(row)} />
          <ActionButton
            action="delete"
            onClick={() => setDeleteModal({ show: true, id: row._id })}
          />
        </div>
      ),
    },
  ];
  return (
    <div className="container py-2">
      <PageHeader
        subtitleAr="إدارة مخزون المنتجات والخدمات"
        subtitleEn="Manage Inventory"
      />

      <div className="d-flex justify-content-center mb-4">
        <ActionButton
          action="add"
          label={lang === "ar" ? "إضافة مخزون لفترة" : "Add Inventory Period"}
          onClick={openCreateModal}
        />
      </div>

      <LoadingOverlay show={loading} />

      <EntityFilter
        filters={filters}
        setFilters={setFilters}
        config={{
          inventoryType: {
            type: "select",
            col: 3,
            placeholder: lang === "ar" ? "نوع المخزون" : "Inventory Type",
            options: [
              { value: "roomType", labelAr: "نوع غرفة", labelEn: "Room Type" },
              { value: "trip", labelAr: "رحلة", labelEn: "Trip" },
              {
                value: "transport",
                labelAr: "وسيلة نقل",
                labelEn: "Transport",
              },
              {
                value: "vehicleRental",
                labelAr: "تأجير نقل",
                labelEn: "Vehicle Rental",
              },
              {
                value: "extraService",
                labelAr: "خدمة إضافية",
                labelEn: "Extra Service",
              },
              { value: "visa", labelAr: "تأشيرة", labelEn: "Visa" },
            ],
          },
          startDate: {
            type: "date",
            col: 3,
            placeholder: lang === "ar" ? "من تاريخ" : "From Date",
          },
          endDate: {
            type: "date",
            col: 3,
            placeholder: lang === "ar" ? "إلى تاريخ" : "To Date",
          },
        }}
      />

      <UniversalFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={(data) =>
          handleSave(data?.formState || data, {
            formMode,
            currentItem: currentInventory,
          })
        }
        config={memoizedConfig}
        initialData={currentInventory}
        titleAr="إضافة مخزون لفترة"
        titleEn="Add Inventory Period"
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
        data={inventoryList}
        lang={lang}
        emptyMessage={lang === "ar" ? "لا يوجد مخزون" : "No inventory found"}
      />

      <ConfirmDialog
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null })}
        onConfirm={confirmDelete}
        title={lang === "ar" ? "حذف المخزون؟" : "Delete Inventory?"}
        message={lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?"}
        confirmText={lang === "ar" ? "نعم، احذف" : "Yes, Delete"}
        cancelText={lang === "ar" ? "إلغاء" : "Cancel"}
        variant="delete"
      />
    </div>
  );
}
