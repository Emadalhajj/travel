import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ActionButton from "../../../Components/common/buttons/ActionButton";
import ConfirmDialog from "../../../Components/common/ConfirmModal";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";
import LoadingOverlay from "../../../Components/common/feedback/LoadingOverlay";
import UniversalTable from "../../../Components/common/tables/UniversalTable";
import PageHeader from "../../../Components/layout/PageHeader";
import UniversalFormModal from "../../../Components/forms/UniversalFormModal";
import useAdminLookups from "../../../hooks/admin/useAdminLookups";
import { couponFormConfig } from "../../../Components/common/ModalForms/pricing/couponFormConfig";
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  selectCouponError,
  selectCouponLoading,
  selectCouponMutationLoading,
  selectCoupons,
  updateCoupon,
} from "../../../redux/pricing/couponSlice";

export default function AdminCouponsPage() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const isArabic = (i18n.language || "ar") === "ar";
  const items = useSelector(selectCoupons);
  const loading = useSelector(selectCouponLoading);
  const saving = useSelector(selectCouponMutationLoading);
  const error = useSelector(selectCouponError);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { lookups, loadLookup } = useAdminLookups();
  useEffect(() => {
    void Promise.allSettled(
      ["roomType", "transport", "vehicleRental", "extraService", "visa", "umrahProgram"]
        .map((type) => loadLookup(type)),
    );
  }, [loadLookup]);
  const productOptions = useMemo(() => [
    ["roomType", "ROOM_TYPE"], ["transport", "TRANSPORT"],
    ["vehicleRental", "VEHICLE_RENTAL"], ["extraService", "EXTRA_SERVICE"],
    ["visa", "VISA"], ["umrahProgram", "PROGRAM"],
  ].flatMap(([type, label]) => (lookups[type] || [])
    .filter((item) => item.couponEligible)
    .map((item) => ({
      value: String(item._id),
      labelAr: `${label} — ${item.nameAr || item.nameEn || item._id}`,
      labelEn: `${label} — ${item.nameEn || item.nameAr || item._id}`,
    }))), [lookups]);
  const config = useMemo(() => couponFormConfig({ productOptions }), [productOptions]);
  const formInitialData = useMemo(() => editing ? {
    ...editing,
  } : null, [editing]);

  const reload = () => dispatch(fetchCoupons({ page: 1, limit: 100 }));
  useEffect(() => { reload(); }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (data) => {
    try {
      const payload = {
        ...data,
        applicableTo: {
          scope: data.applicableTo?.scope || "ALL",
          serviceTypes: data.applicableTo?.serviceTypes || [],
          productIds: data.applicableTo?.productIds || [],
        },
      };
      if (editing?._id) await dispatch(updateCoupon({ id: editing._id, data: payload })).unwrap();
      else await dispatch(createCoupon(payload)).unwrap();
      setShowForm(false);
      setEditing(null);
      reload();
      toast.success(isArabic ? "تم حفظ الكوبون" : "Coupon saved");
    } catch (saveError) { toast.error(saveError?.message || String(saveError)); }
  };

  const columns = [
    { header: isArabic ? "الرمز" : "Code", accessor: "code" },
    { header: isArabic ? "الخصم" : "Discount", render: (row) => `${row.value} ${row.discountType === "PERCENTAGE" ? "%" : ""}` },
    { header: isArabic ? "الاستخدام" : "Usage", render: (row) => `${row.usageCount || 0} / ${row.usageLimit || "∞"}` },
    { header: isArabic ? "الحالة" : "Status", render: (row) => row.isActive ? (isArabic ? "نشط" : "Active") : (isArabic ? "متوقف" : "Inactive") },
    { header: isArabic ? "الإجراءات" : "Actions", render: (row) => <div className="d-flex gap-2 justify-content-center"><ActionButton action="edit" onClick={() => { setEditing(row); setShowForm(true); }} /><ActionButton action="delete" onClick={() => setDeleting(row)} /></div> },
  ];

  return <div className="container-fluid py-3">
    <PageHeader titleAr="إدارة كوبونات الخصم" titleEn="Coupon Management" actions={<ActionButton action="add" onClick={() => { setEditing(null); setShowForm(true); }} />} />
    <LoadingOverlay show={loading} />
    <ErrorOverlay show={Boolean(error)} message={error} />
    <UniversalTable columns={columns} data={items} lang={isArabic ? "ar" : "en"} />
    <UniversalFormModal show={showForm} onHide={() => setShowForm(false)} onSave={save} config={config} initialData={formInitialData} loading={saving} titleAr={editing ? "تعديل كوبون" : "إضافة كوبون"} titleEn={editing ? "Edit Coupon" : "Add Coupon"} />
    <ConfirmDialog show={Boolean(deleting)} onHide={() => setDeleting(null)} onConfirm={async () => { await dispatch(deleteCoupon(deleting._id)).unwrap(); setDeleting(null); reload(); }} title={isArabic ? "حذف الكوبون" : "Delete Coupon"} message={isArabic ? "هل تريد حذف الكوبون؟" : "Delete this coupon?"} />
  </div>;
}
