import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createNewTrip, deleteTrip, fetchTrips, setLimit, setPage, updateExistingTrip,
  selectTripItems, selectTripPagination, selectTripListLoading, selectTripError,
} from "../../../redux/transports/tripSlice";
import { buildQuery } from "../../../Utils/buildQuery";
import { createHandleSave } from "../../../Utils/formData/createHandleSave";
import { normalizeForForm } from "../../../Utils/formData/normalize";
import { handleApiError } from "../../../Utils/handleApiError";
import { formatPrice } from "../../../Utils/roundPrice";
import { tripFormConfig } from "../../../Components/common/ModalForms/transport/tripFormConfig";
import DuffelFlightSearchPanel from "../../../Components/common/ModalForms/transport/DuffelFlightSearchPanel";
import {
  formatTripRoute, getTripLabel, getTripSubtypeOptions,
  TRIP_SCOPE_OPTIONS, TRIP_SOURCE_OPTIONS, TRIP_TYPE_OPTIONS,
} from "../../../constants/trips/trip.constants";
import PageHeader from "../../../Components/layout/PageHeader";
import AdminPageActions from "../../../Components/layout/AdminPageActions";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ExportTableButtons from "../../../Components/common/buttons/ExportTableButtons";
import EntityFilter from "../../../Components/common/EntityFilter";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import ImagePreviewCell from "../../../Components/common/tables/ImagePreviewCell";
import PaginationComponent from "../../../Components/common/Pagination";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import EntityDetailsModal from "../../../Components/common/cards/EntityDetailsModal";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import StatusBadge from "../../../Components/shared/common/StatusBadge";
import useAdminEntityCrudState from "../../../hooks/admin/useAdminEntityCrudState";
import useAdminLookups from "../../../hooks/admin/useAdminLookups";

const EMPTY = [];

export default function TransportTrips() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const trips = useSelector(selectTripItems);
  const pagination = useSelector(selectTripPagination);
  const loading = useSelector(selectTripListLoading);
  const error = useSelector(selectTripError);
  const { lookups, loadLookup } = useAdminLookups();
  const transports = lookups.transport || EMPTY;
  const [activeType, setActiveType] = useState("");
  const [filters, setFilters] = useState({ search: "", scope: "", subtype: "", source: "", origin: "", destination: "", isActive: "" });
  const [loadedTransport, setLoadedTransport] = useState(false);
  const [tripFormState, setTripFormState] = useState({});

  const formConfig = useMemo(() => tripFormConfig(transports), [transports]);
  const listQuery = useMemo(() => buildQuery(
    { ...filters, type: activeType || undefined },
    { page: pagination.page, limit: pagination.limit },
  ), [activeType, filters, pagination.page, pagination.limit]);

  useEffect(() => { dispatch(fetchTrips(listQuery)); }, [dispatch, listQuery]);

  const prepareForForm = (trip) => ({
    ...normalizeForForm(trip, formConfig),
    transportId: typeof trip.transportId === "object" ? trip.transportId?._id || "" : trip.transportId || "",
  });
  const crud = useAdminEntityCrudState({
    prepareForForm,
    prepareClone: (trip, normalized) => ({ ...normalized, _id: null, nameAr: `${trip.nameAr} (نسخة)`, nameEn: `${trip.nameEn} (Copy)` }),
  });

  const ensureTransportLookup = useCallback(async () => {
    if (!loadedTransport) { await loadLookup("transport"); setLoadedTransport(true); }
  }, [loadLookup, loadedTransport]);
  const openCreate = () => { setTripFormState({}); crud.openCreate(); };
  const openEdit = async (trip) => { if (trip.type === "LAND") await ensureTransportLookup(); crud.openEdit(trip); };
  const openClone = async (trip) => { if (trip.type === "LAND") await ensureTransportLookup(); crud.openClone(trip); };

  const handleSave = createHandleSave({
    dispatch, createAction: createNewTrip, updateAction: updateExistingTrip,
    fetchAction: () => fetchTrips(listQuery), getId: (item) => item._id,
    formConfig, toast, lang, closeModal: crud.closeForm, resetItem: crud.resetForm,
    setLoading: crud.setLoadingSave, setFormErrors: crud.setFormErrors,
  });

  const confirmDelete = async () => {
    try {
      await dispatch(deleteTrip(crud.deleteModal.id)).unwrap();
      toast.success(lang === "ar" ? "تم حذف الرحلة" : "Trip deleted");
      dispatch(fetchTrips(listQuery));
    } catch (requestError) {
      toast.error(handleApiError(requestError, (message) => message, lang));
    } finally { crud.closeDelete(); }
  };

  const handleTripFormStateChange = useCallback((state) => {
    setTripFormState(state);
    if (state.type === "LAND") ensureTransportLookup();
  }, [ensureTransportLookup]);

  const isExternalFlightSearch =
    tripFormState.type === "AIR" && tripFormState.source === "API";

  const columns = [
    { header: lang === "ar" ? "الصورة" : "Image", render: (row) => <ImagePreviewCell images={row.images} />, exportable: false },
    { header: lang === "ar" ? "الاسم" : "Name", render: (row) => lang === "ar" ? row.nameAr : row.nameEn },
    { header: lang === "ar" ? "النوع" : "Type", render: (row) => getTripLabel(row.type, lang) },
    { header: lang === "ar" ? "النطاق" : "Scope", render: (row) => getTripLabel(row.scope, lang) },
    { header: lang === "ar" ? "التصنيف" : "Subtype", render: (row) => getTripLabel(row.subtype, lang) },
    { header: lang === "ar" ? "المسار" : "Route", render: formatTripRoute },
    { header: lang === "ar" ? "المصدر" : "Source", render: (row) => getTripLabel(row.source, lang) },
    { header: lang === "ar" ? "السعر" : "Base Price", render: (row) => formatPrice(row.pricing?.basePrice, row.pricing?.currency || "SAR") },
    { header: lang === "ar" ? "المغادرات" : "Departures", align: "center", render: (row) => row.departuresCount ?? 0 },
    { header: lang === "ar" ? "الحالة" : "Active", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} type="user" isArabic={lang === "ar"} /> },
    { header: lang === "ar" ? "الإجراءات" : "Actions", exportable: false, render: (row) => (
      <div className="d-flex gap-1 flex-wrap">
        <ActionButton action="departures" onClick={() => navigate(`/admin/trips/${row._id}/departures`)} />
        <ActionButton action="edit" onClick={() => openEdit(row)} />
        <ActionButton action="clone" onClick={() => openClone(row)} />
        <ActionButton action="view" onClick={() => crud.openDetails(row)} />
        <ActionButton action="delete" onClick={() => crud.openDelete(row, lang === "ar" ? row.nameAr : row.nameEn)} />
      </div>
    ) },
  ];

  const details = crud.currentItem;
  return <div className="container py-3">
    <PageHeader titleAr="إدارة الرحلات" titleEn="Trips Management" subtitleAr="تعريف الرحلات الجوية والبرية والبحرية" subtitleEn="Manage air, land and sea trip definitions" actions={<AdminPageActions>
      <ActionButton action="add" size="md" label={lang === "ar" ? "إضافة رحلة" : "Add Trip"} onClick={openCreate} />
      <ExportTableButtons data={trips} columns={columns} fileName="trips" lang={lang} title={lang === "ar" ? "الرحلات" : "Trips"} />
    </AdminPageActions>} />

    <ButtonGroup className="mb-3">
      {[{ value: "", labelAr: "الكل", labelEn: "All" }, ...TRIP_TYPE_OPTIONS].map((option) =>
        <Button key={option.value || "all"} variant={activeType === option.value ? "primary" : "outline-primary"} onClick={() => { setActiveType(option.value); dispatch(setPage(1)); }}>
          {lang === "ar" ? option.labelAr : option.labelEn}
        </Button>)}
    </ButtonGroup>

    <EntityFilter filters={filters} setFilters={setFilters} config={{
      search: { type: "text", col: 3, placeholder: lang === "ar" ? "بحث بالاسم" : "Search" },
      scope: { type: "select", options: TRIP_SCOPE_OPTIONS },
      subtype: { type: "select", options: activeType ? getTripSubtypeOptions(activeType) : [] },
      source: { type: "select", options: TRIP_SOURCE_OPTIONS },
      origin: { type: "text", placeholder: lang === "ar" ? "نقطة الانطلاق" : "Origin" },
      destination: { type: "text", placeholder: lang === "ar" ? "الوجهة" : "Destination" },
      isActive: { type: "select", options: [{ value: "true", labelAr: "نشط", labelEn: "Active" }, { value: "false", labelAr: "غير نشط", labelEn: "Inactive" }] },
    }} />
    <LoadingOverlay show={loading} /><ErrorOverlay show={Boolean(error)} message={error} />
    <UniversalTable columns={columns} data={trips} lang={lang} emptyMessage={lang === "ar" ? "لا توجد رحلات" : "No trips"} />
    <PaginationComponent {...pagination} onPageChange={(page) => dispatch(setPage(page))} onLimitChange={(limit) => dispatch(setLimit(limit))} />

    <UniversalFormModal show={crud.showModal} onHide={crud.closeForm} onSave={(data) => handleSave(data, { formMode: crud.formMode, currentItem: crud.currentItem })} config={formConfig} initialData={crud.currentItem} errors={crud.formErrors} loading={crud.loadingSave}
      onFormStateChange={handleTripFormStateChange}
      afterFormContent={isExternalFlightSearch ? <DuffelFlightSearchPanel /> : null}
      hideSaveAction={isExternalFlightSearch}
      titleAr={crud.formMode === "edit" ? "تعديل الرحلة" : "إضافة رحلة"} titleEn={crud.formMode === "edit" ? "Edit Trip" : "Add Trip"} />
    <EntityDetailsModal show={crud.showDetails} onHide={crud.closeDetails} title={lang === "ar" ? "تفاصيل الرحلة" : "Trip Details"} images={details?.images || []} entity={details} fields={[
      { label: lang === "ar" ? "الاسم" : "Name", value: lang === "ar" ? details?.nameAr : details?.nameEn },
      { label: lang === "ar" ? "النوع" : "Type", value: getTripLabel(details?.type, lang) },
      { label: lang === "ar" ? "المسار" : "Route", value: formatTripRoute(details) },
      { label: lang === "ar" ? "السعر" : "Price", value: formatPrice(details?.pricing?.basePrice, details?.pricing?.currency || "SAR") },
    ]} />
    <ConfirmDialog show={crud.deleteModal.show} onHide={crud.closeDelete} onConfirm={confirmDelete} title={lang === "ar" ? "حذف الرحلة" : "Delete Trip"} message={lang === "ar" ? `هل تريد حذف ${crud.deleteModal.name}؟` : `Delete ${crud.deleteModal.name}?`} variant="delete" />
  </div>;
}
