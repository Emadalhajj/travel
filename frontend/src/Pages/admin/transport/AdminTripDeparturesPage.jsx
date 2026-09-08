import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Card } from "react-bootstrap";

import {
  cancelTripDeparture, completeTripDeparture, createTripDeparture,
  deleteTripDeparture, fetchTripDepartures, scheduleTripDeparture,
  toggleTripDeparture, updateTripDeparture,
  selectTripDepartureError, selectTripDepartureListLoading,
  selectTripDepartureMutationLoading, selectTripDeparturePagination,
  selectTripDepartures,
} from "../../../redux/transports/tripDepartureSlice";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { handleApiError } from "../../../Utils/handleApiError";
import { tripDepartureFormConfig } from "../../../Components/common/ModalForms/transport/tripDepartureFormConfig";
import PageHeader from "../../../Components/layout/PageHeader";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import PaginationComponent from "../../../Components/common/Pagination";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import useAdminLookups from "../../../hooks/admin/useAdminLookups";
import { getTripById } from "../../../services/api/admin/trips";
import { buildTripSegments, formatTripRoute, getTripLabel } from "../../../constants/trips/trip.constants";

const statusOptions = ["DRAFT", "SCHEDULED", "CANCELLED", "COMPLETED"].map((value) => ({ value, labelAr: value, labelEn: value }));
const toLocalDateTime = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";

export default function AdminTripDeparturesPage() {
  const { tripId } = useParams();
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const items = useSelector(selectTripDepartures);
  const pagination = useSelector(selectTripDeparturePagination);
  const loading = useSelector(selectTripDepartureListLoading);
  const mutationLoading = useSelector(selectTripDepartureMutationLoading);
  const error = useSelector(selectTripDepartureError);
  const [parentTrip, setParentTrip] = useState(null);
  const [parentTripLoading, setParentTripLoading] = useState(true);
  const [parentTripError, setParentTripError] = useState(null);
  const { lookups, loadLookup } = useAdminLookups();
  const [filters, setFilters] = useState({ search: "", status: "", departureFrom: "", departureTo: "", isActive: "" });
  const [operation, setOperation] = useState(null);
  const config = useMemo(() => tripDepartureFormConfig(lookups.transport || []), [lookups.transport]);
  const query = useMemo(() => ({
    tripId, page: pagination.page, limit: pagination.limit,
    status: filters.status || undefined,
    startDate: filters.departureFrom || undefined,
    endDate: filters.departureTo || undefined,
    isActive: filters.isActive || undefined,
  }), [filters, pagination.limit, pagination.page, tripId]);

  useEffect(() => { dispatch(fetchTripDepartures(query)); }, [dispatch, query]);
  useEffect(() => { loadLookup("transport"); }, [loadLookup]);
  useEffect(() => {
    let active = true;

    const loadParentTrip = async () => {
      setParentTripLoading(true);
      setParentTripError(null);

      try {
        const response = await getTripById(tripId);
        if (active) setParentTrip(response.data?.trip || response.data?.data || null);
      } catch (requestError) {
        if (active) {
          setParentTripError(
            requestError?.response?.data?.message ||
              (lang === "ar" ? "تعذر تحميل بيانات الرحلة" : "Unable to load trip details"),
          );
        }
      } finally {
        if (active) setParentTripLoading(false);
      }
    };

    if (tripId) loadParentTrip();
    return () => { active = false; };
  }, [lang, tripId]);

  const parentTripName = parentTrip
    ? (lang === "ar" ? parentTrip.nameAr || parentTrip.nameEn : parentTrip.nameEn || parentTrip.nameAr)
    : "";
  const parentTripClassification = parentTrip
    ? [parentTrip.type, parentTrip.scope, parentTrip.subtype]
      .map((value) => getTripLabel(value, lang))
      .filter((value) => value && value !== "-")
      .join(" • ")
    : "";
  const crud = useAdminEntityCrudState({
    prepareForForm: (item) => ({
      ...item,
      departureAt: toLocalDateTime(item.departureAt),
      arrivalAt: toLocalDateTime(item.arrivalAt),
      segments: (item.segments || []).map((segment) => ({ ...segment, departureAt: toLocalDateTime(segment.departureAt), arrivalAt: toLocalDateTime(segment.arrivalAt), transportId: segment.transportId?._id || segment.transportId || "" })),
    }),
  });

  const openCreateDeparture = () => crud.openCreate({
    pricing: {
      basePrice: parentTrip?.pricing?.basePrice ?? 0,
      discountPrice: parentTrip?.pricing?.discountPrice ?? 0,
      currency: parentTrip?.pricing?.currency || "SAR",
    },
    segments: buildTripSegments(parentTrip),
  });

  const save = createHandleSave({
    dispatch, createAction: createTripDeparture, updateAction: updateTripDeparture,
    fetchAction: () => fetchTripDepartures(query), getId: (item) => item._id,
    formConfig: config, toast, lang, closeModal: crud.closeForm, resetItem: crud.resetForm,
    setLoading: crud.setLoadingSave, setFormErrors: crud.setFormErrors,
    extraPayload: () => ({ tripId }), useFormData: false,
  });

  const operations = {
    schedule: scheduleTripDeparture,
    cancel: cancelTripDeparture,
    complete: completeTripDeparture,
    delete: deleteTripDeparture,
  };
  const confirmOperation = async () => {
    if (!operation) return;
    try {
      await dispatch(operations[operation.action](operation.item._id)).unwrap();
      toast.success(lang === "ar" ? "تمت العملية بنجاح" : "Operation completed");
      dispatch(fetchTripDepartures(query));
    } catch (requestError) {
      toast.error(handleApiError(requestError, (message) => message, lang));
    } finally { setOperation(null); }
  };
  const toggle = async (item) => {
    try { await dispatch(toggleTripDeparture(item._id)).unwrap(); dispatch(fetchTripDepartures(query)); }
    catch (requestError) { toast.error(handleApiError(requestError, (message) => message, lang)); }
  };

  const columns = [
    { header: lang === "ar" ? "المغادرة" : "Departure", render: (row) => new Date(row.departureAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB") },
    { header: lang === "ar" ? "الوصول" : "Arrival", render: (row) => row.arrivalAt ? new Date(row.arrivalAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB") : "-" },
    { header: lang === "ar" ? "الحالة" : "Status", render: (row) => <StatusBadge value={row.status} type="departure" isArabic={lang === "ar"} /> },
    { header: lang === "ar" ? "السعة" : "Capacity", render: (row) => row.inventory?.total ?? row.capacity?.totalSeats ?? 0 },
    { header: lang === "ar" ? "المحجوز" : "Reserved", render: (row) => row.inventory?.reserved ?? 0 },
    { header: lang === "ar" ? "مؤقت" : "Blocked", render: (row) => row.inventory?.blocked ?? 0 },
    { header: lang === "ar" ? "المتاح" : "Available", render: (row) => row.inventory?.available ?? (row.status === "DRAFT" ? "-" : 0) },
    { header: lang === "ar" ? "الإجراءات" : "Actions", render: (row) => <div className="d-flex gap-1 flex-wrap">
      {row.status === "DRAFT" && <><ActionButton action="edit" onClick={() => crud.openEdit(row)} /><ActionButton action="schedule" onClick={() => setOperation({ action: "schedule", item: row })} /><ActionButton action="cancel" onClick={() => setOperation({ action: "cancel", item: row })} /><ActionButton action="delete" onClick={() => setOperation({ action: "delete", item: row })} /></>}
      {row.status === "SCHEDULED" && <><ActionButton action="edit" onClick={() => crud.openEdit(row)} /><ActionButton action={row.isActive ? "deactivate" : "activate"} onClick={() => toggle(row)} /><ActionButton action="complete" onClick={() => setOperation({ action: "complete", item: row })} /><ActionButton action="cancel" onClick={() => setOperation({ action: "cancel", item: row })} /></>}
      {["CANCELLED", "COMPLETED"].includes(row.status) && <ActionButton action="view" onClick={() => crud.openDetails(row)} />}
    </div> },
  ];

  const operationText = {
    schedule: ["جدولة المغادرة وإنشاء مخزونها؟", "Schedule this departure and create its inventory?"],
    cancel: ["إلغاء المغادرة؟ لا يمكن الإلغاء عند وجود مقاعد محجوزة أو مؤقتة.", "Cancel this departure? Consumed seats prevent cancellation."],
    complete: ["إكمال المغادرة وإيقاف بيعها؟", "Complete this departure and stop selling it?"],
    delete: ["حذف مسودة المغادرة؟", "Delete this departure draft?"],
  };

  return <div className="container py-3">
    <PageHeader
      titleAr={parentTripName ? `إدارة مغادرات الرحلة: ${parentTripName}` : "إدارة مغادرات الرحلة"}
      titleEn={parentTripName ? `Trip Departures: ${parentTripName}` : "Trip Departures"}
      subtitleAr="المواعيد والسعة التشغيلية والمخزون"
      subtitleEn="Schedules, capacity and inventory"
      actions={<AdminPageActions><ActionButton action="back" /><ActionButton action="add" label={lang === "ar" ? "إضافة مغادرة" : "Add Departure"} onClick={openCreateDeparture} disabled={!parentTrip || parentTripLoading} /></AdminPageActions>}
    />
    <LoadingOverlay show={parentTripLoading} />
    <ErrorOverlay show={Boolean(parentTripError)} message={parentTripError} />
    {parentTrip && <Card className="mb-3 border-0 shadow-sm">
      <Card.Body>
        <h2 className="h5 mb-2">{parentTripName}</h2>
        <div className="text-muted mb-1">{parentTripClassification}</div>
        <div>{formatTripRoute(parentTrip)}</div>
      </Card.Body>
    </Card>}
    <EntityFilter filters={filters} setFilters={setFilters} config={{
      search: { type: "label", label: lang === "ar" ? "تصفية المغادرات" : "Filter departures" },
      status: { type: "select", options: statusOptions },
      departureFrom: { type: "date" }, departureTo: { type: "date" },
      isActive: { type: "select", options: [{ value: "true", labelAr: "نشط", labelEn: "Active" }, { value: "false", labelAr: "غير نشط", labelEn: "Inactive" }] },
    }} />
    <LoadingOverlay show={loading} /><ErrorOverlay show={Boolean(error)} message={error} />
    <UniversalTable columns={columns} data={items} lang={lang} emptyMessage={lang === "ar" ? "لا توجد مغادرات" : "No departures"} />
    <PaginationComponent {...pagination} onPageChange={(page) => dispatch(fetchTripDepartures({ ...query, page }))} onLimitChange={(limit) => dispatch(fetchTripDepartures({ ...query, page: 1, limit }))} />
    <UniversalFormModal show={crud.showModal} onHide={crud.closeForm} onSave={(data) => save(data, { formMode: crud.formMode, currentItem: crud.currentItem })} config={config} initialData={crud.currentItem} errors={crud.formErrors} loading={crud.loadingSave} titleAr={crud.formMode === "edit" ? "تعديل المغادرة" : "إضافة مغادرة"} titleEn={crud.formMode === "edit" ? "Edit Departure" : "Add Departure"} />
    <EntityDetailsModal show={crud.showDetails} onHide={crud.closeDetails} title={lang === "ar" ? "تفاصيل المغادرة" : "Departure Details"} entity={crud.currentItem} fields={[
      { label: lang === "ar" ? "الحالة" : "Status", value: crud.currentItem?.status || "-" },
      { label: lang === "ar" ? "المغادرة" : "Departure", value: crud.currentItem?.departureAt ? new Date(crud.currentItem.departureAt).toLocaleString() : "-" },
      { label: lang === "ar" ? "السعة" : "Capacity", value: crud.currentItem?.inventory?.total ?? crud.currentItem?.capacity?.totalSeats ?? 0 },
      { label: lang === "ar" ? "المتاح" : "Available", value: crud.currentItem?.inventory?.available ?? "-" },
    ]} />
    <ConfirmDialog show={Boolean(operation)} onHide={() => setOperation(null)} onConfirm={confirmOperation} loading={mutationLoading} title={lang === "ar" ? "تأكيد العملية" : "Confirm operation"} message={operation ? operationText[operation.action][lang === "ar" ? 0 : 1] : ""} variant={operation?.action === "delete" || operation?.action === "cancel" ? "delete" : "warning"} />
  </div>;
}
