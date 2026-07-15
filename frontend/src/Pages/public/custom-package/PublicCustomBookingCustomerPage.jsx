import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  Check,
  CreditCard,
  FileText,
  User,
  Users,
} from "lucide-react";

import PublicPageLayout from "../../../Components/layout/PublicPageLayout";
import PageHeader from "../../../Components/layout/PageHeader";
import Loader from "../../../Components/common/Loader";
import ErrorOverlay from "../../../Components/common/feedback/ErrorOverlay";

import BookingProgressTimeline from "../../../Components/shared/booking/BookingProgressTimeline";
import ConfigFieldsRenderer from "../../../Components/shared/forms/ConfigFieldsRenderer";

import {
  fetchPublicDraftBookingById,
  updatePublicDraftBooking,
} from "../../../redux/public/bookingSlice";

const customerFields = [
  {
    name: "name",
    labelAr: "اسم العميل",
    labelEn: "Customer Name",
    type: "text",
    required: true,
  },
  {
    name: "phone",
    labelAr: "رقم الجوال",
    labelEn: "Phone Number",
    type: "text",
    required: true,
  },
  {
    name: "email",
    labelAr: "البريد الإلكتروني",
    labelEn: "Email",
    type: "email",
    required: true,
  },
  {
    name: "nationality",
    labelAr: "الجنسية",
    labelEn: "Nationality",
    type: "text",
    required: true,
  },
];

const customBookingSteps = [
  {
    key: "customer_info",
    labelAr: "بيانات العميل",
    labelEn: "Customer",
    icon: User,
  },
  {
    key: "travelers",
    labelAr: "المعتمرون",
    labelEn: "Travelers",
    icon: Users,
  },
  {
    key: "review",
    labelAr: "المراجعة",
    labelEn: "Review",
    icon: FileText,
  },
  {
    key: "payment",
    labelAr: "الدفع",
    labelEn: "Payment",
    icon: CreditCard,
  },
  {
    key: "success",
    labelAr: "التأكيد",
    labelEn: "Confirmation",
    icon: Check,
  },
];

export default function PublicCustomBookingCustomerPage() {
  const { draftId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { draftBooking, loading, submitLoading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (draftId) {
      dispatch(fetchPublicDraftBookingById(draftId));
    }
  }, [dispatch, draftId]);

  /*
  يتم تعبئة النموذج مرة واحدة من بيانات المسودة.

  لا يتم إرسال PATCH هنا.
  */
  useEffect(() => {
    if (!draftBooking?.customer) return;

    setFormData({
      name: draftBooking.customer.name || "",
      phone: draftBooking.customer.phone || "",
      email: draftBooking.customer.email || "",
      nationality: draftBooking.customer.nationality || "",
    });
  }, [draftBooking?._id]);

  const fields = useMemo(() => {
    return customerFields.map((field) => ({
      ...field,
      label: isArabic ? field.labelAr : field.labelEn,
    }));
  }, [isArabic]);

  const handleChange = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setLocalError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = t(
        "customerNameRequired",
        "اسم العميل مطلوب",
      );
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = t(
        "phoneRequired",
        "رقم الجوال مطلوب",
      );
    }

    if (!formData.email.trim()) {
      nextErrors.email = t(
        "emailRequired",
        "البريد الإلكتروني مطلوب",
      );
    }

    if (!formData.nationality.trim()) {
      nextErrors.nationality = t(
        "nationalityRequired",
        "الجنسية مطلوبة",
      );
    }

    setValidationErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    try {
      setLocalError("");

      await dispatch(
        updatePublicDraftBooking({
          draftId,
          data: {
            customer: formData,
            currentStep: "pilgrims",
          },
        }),
      ).unwrap();

      navigate(`/booking/custom/${draftId}/travelers`);
    } catch (updateError) {
      setLocalError(
        updateError?.message ||
          updateError ||
          t(
            "customerSaveFailed",
            "تعذر حفظ بيانات العميل",
          ),
      );
    }
  };

  if (loading) {
    return (
      <PublicPageLayout>
        <Loader />
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <PageHeader
        eyebrowAr="برنامج مخصص"
        eyebrowEn="Custom Package"
        titleAr="بيانات العميل"
        titleEn="Customer Information"
        subtitleAr="أدخل بيانات صاحب الحجز ثم انتقل إلى بيانات المعتمرين."
        subtitleEn="Enter the booking owner details, then continue to travelers."
        actions={
          <button
            type="button"
            onClick={() => navigate("/custom-package-builder")}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t("back", "رجوع")}
          </button>
        }
      />

      <BookingProgressTimeline
        currentStep="customer_info"
        isArabic={isArabic}
        steps={customBookingSteps}
      />

      <ErrorOverlay show={Boolean(error)} message={error} />
      <ErrorOverlay show={Boolean(localError)} message={localError} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="lg:col-span-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {t("customerInfo", "بيانات العميل")}
            </h2>

            <ConfigFieldsRenderer
              fields={fields}
              isArabic={isArabic}
              getValue={(name) => formData[name]}
              errors={validationErrors}
              onChange={handleChange}
            />
          </section>
        </main>

        <aside>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {t("nextStep", "الخطوة التالية")}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              {t(
                "customerStepDescription",
                "بعد حفظ بيانات العميل سيتم الانتقال لإضافة بيانات المعتمرين.",
              )}
            </p>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitLoading}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitLoading
                ? t("saving", "جاري الحفظ...")
                : t("saveAndContinue", "حفظ والمتابعة")}
            </button>
          </section>
        </aside>
      </div>
    </PublicPageLayout>
  );
}
