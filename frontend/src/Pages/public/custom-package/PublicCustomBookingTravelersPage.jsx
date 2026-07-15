import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  PackageCheck,
  User,
  Users,
} from "lucide-react";

import api from "../../../services/api/api";

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

/*
=====================================================
خطوات إنشاء البرنامج المخصص
=====================================================

صفحة المعتمرين هي الخطوة الرابعة:

1- التواريخ
2- الخدمات
3- بيانات العميل
4- المعتمرون
5- المراجعة
6- الدفع
7- التأكيد
=====================================================
*/

const customBookingSteps = [
  {
    key: "dates",
    labelAr: "التواريخ",
    labelEn: "Dates",
    icon: CalendarDays,
  },
  {
    key: "services",
    labelAr: "الخدمات",
    labelEn: "Services",
    icon: PackageCheck,
  },
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

/*
=====================================================
إنشاء معتمر فارغ
=====================================================
*/

const createEmptyTraveler = () => ({
  fullName: "",
  passportNumber: "",
  nationality: "",
  birthDate: "",
  gender: "male",

  mobile: "",
  whatsapp: "",

  passportImage: null,
  personalPhoto: null,
  vaccinationCertificate: null,
  visaAttachment: null,
});

export default function PublicCustomBookingTravelersPage() {
  const { draftId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const { draftBooking, loading, submitLoading, error } = useSelector(
    (state) => state.publicBooking,
  );

  const [travelers, setTravelers] = useState([createEmptyTraveler()]);
  const [validationErrors, setValidationErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);

  /*
  =====================================================
  جلب المسودة
  =====================================================

  لا يوجد أي PATCH هنا.
  =====================================================
  */

  useEffect(() => {
    if (draftId) {
      dispatch(fetchPublicDraftBookingById(draftId));
    }
  }, [dispatch, draftId]);

  /*
  =====================================================
  تعبئة بيانات المعتمرين المحفوظة

  يتم التنفيذ عند تغير رقم المسودة فقط، وليس مع كل render.
  =====================================================
  */

  useEffect(() => {
    if (!draftBooking?._id) return;

    const savedTravelers = Array.isArray(draftBooking.travelers)
      ? draftBooking.travelers
      : [];

    if (!savedTravelers.length) {
      setTravelers([createEmptyTraveler()]);
      return;
    }

    setTravelers(
      savedTravelers.map((traveler) => ({
        _id: traveler._id,

        fullName: traveler.fullName || "",
        passportNumber: traveler.passportNumber || "",
        nationality: traveler.nationality || "",
        birthDate: formatDateForInput(traveler.birthDate),
        gender: traveler.gender || "male",

        mobile: traveler.mobile || "",
        whatsapp: traveler.whatsapp || "",

        passportImage: traveler.passportImage || null,
        personalPhoto: traveler.personalPhoto || null,
        vaccinationCertificate:
          traveler.vaccinationCertificate || null,
        visaAttachment: traveler.visaAttachment || null,
      })),
    );
  }, [draftBooking?._id]);

  /*
  =====================================================
  العدد المطلوب من المعتمرين
  =====================================================
  */

  const requiredTravelersCount = useMemo(() => {
    const value = Number(
      draftBooking?.data?.travelersCount ??
        draftBooking?.data?.pilgrimsCount ??
        draftBooking?.data?.searchCriteria?.travelersCount ??
        draftBooking?.travelersCount ??
        1,
    );

    return Number.isFinite(value) && value > 0 ? value : 1;
  }, [draftBooking]);

  /*
  =====================================================
  حقول المعتمر

  صورة الجواز والصورة الشخصية مطلوبتان لتأشيرة العمرة.
  شهادة التطعيم ومرفق التأشيرة اختياريان حاليًا.
  =====================================================
  */

  const travelerFields = useMemo(
    () => [
      {
        name: "fullName",
        label: t("fullName", "الاسم الكامل"),
        type: "text",
        required: true,
      },
      {
        name: "passportNumber",
        label: t("passportNumber", "رقم الجواز"),
        type: "text",
        required: true,
      },
      {
        name: "nationality",
        label: t("nationality", "الجنسية"),
        type: "text",
        required: true,
      },
      {
        name: "birthDate",
        label: t("birthDate", "تاريخ الميلاد"),
        type: "date",
        required: true,
      },
      {
        name: "gender",
        label: t("gender", "الجنس"),
        type: "select",
        required: true,
        options: [
          {
            label: t("male", "ذكر"),
            value: "male",
          },
          {
            label: t("female", "أنثى"),
            value: "female",
          },
        ],
      },
      {
        name: "mobile",
        label: t("mobile", "رقم الجوال"),
        type: "text",
      },
      {
        name: "whatsapp",
        label: t("whatsapp", "رقم الواتساب"),
        type: "text",
      },
      {
        name: "passportImage",
        label: t("passportImage", "صورة الجواز"),
        type: "file",
        accept: "image/*,.pdf",
        required: true,
      },
      {
        name: "personalPhoto",
        label: t("personalPhoto", "الصورة الشخصية"),
        type: "file",
        accept: "image/*",
        required: true,
      },
      {
        name: "vaccinationCertificate",
        label: t(
          "vaccinationCertificate",
          "شهادة التطعيم",
        ),
        type: "file",
        accept: "image/*,.pdf",
      },
      {
        name: "visaAttachment",
        label: t("visaAttachment", "مرفق التأشيرة"),
        type: "file",
        accept: "image/*,.pdf",
      },
    ],
    [t],
  );

  /*
  =====================================================
  تعديل قيمة حقل معتمر
  =====================================================
  */

  const handleTravelerChange = (index, name, value) => {
    setTravelers((previous) =>
      previous.map((traveler, travelerIndex) =>
        travelerIndex === index
          ? {
              ...traveler,
              [name]: value,
            }
          : traveler,
      ),
    );

    setValidationErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors[`${index}.${name}`];
      return nextErrors;
    });

    setLocalError("");
  };

  /*
  =====================================================
  إضافة معتمر
  =====================================================
  */

  const handleAddTraveler = () => {
    if (travelers.length >= requiredTravelersCount) {
      setLocalError(
        t(
          "travelersCountCompleted",
          `تم الوصول إلى العدد المحدد للمعتمرين (${requiredTravelersCount}).`,
        ),
      );

      return;
    }

    setTravelers((previous) => [
      ...previous,
      createEmptyTraveler(),
    ]);

    setLocalError("");
  };

  /*
  =====================================================
  حذف معتمر
  =====================================================
  */

  const handleRemoveTraveler = (index) => {
    if (travelers.length <= 1) {
      setLocalError(
        t(
          "atLeastOneTravelerRequired",
          "يجب أن يوجد معتمر واحد على الأقل.",
        ),
      );

      return;
    }

    setTravelers((previous) =>
      previous.filter((_, travelerIndex) => travelerIndex !== index),
    );

    setValidationErrors({});
    setLocalError("");
  };

  /*
  =====================================================
  التحقق من بيانات المعتمرين
  =====================================================
  */

  const validateTravelers = () => {
    const nextErrors = {};

    travelers.forEach((traveler, index) => {
      if (!traveler.fullName?.trim()) {
        nextErrors[`${index}.fullName`] = t(
          "fullNameRequired",
          "الاسم الكامل مطلوب",
        );
      }

      if (!traveler.passportNumber?.trim()) {
        nextErrors[`${index}.passportNumber`] = t(
          "passportRequired",
          "رقم الجواز مطلوب",
        );
      }

      if (!traveler.nationality?.trim()) {
        nextErrors[`${index}.nationality`] = t(
          "nationalityRequired",
          "الجنسية مطلوبة",
        );
      }

      if (!traveler.birthDate) {
        nextErrors[`${index}.birthDate`] = t(
          "birthDateRequired",
          "تاريخ الميلاد مطلوب",
        );
      }

      if (!traveler.gender) {
        nextErrors[`${index}.gender`] = t(
          "genderRequired",
          "الجنس مطلوب",
        );
      }

      if (!traveler.passportImage) {
        nextErrors[`${index}.passportImage`] = t(
          "passportImageRequired",
          "صورة الجواز مطلوبة",
        );
      }

      if (!traveler.personalPhoto) {
        nextErrors[`${index}.personalPhoto`] = t(
          "personalPhotoRequired",
          "الصورة الشخصية مطلوبة",
        );
      }
    });

    setValidationErrors(nextErrors);

    if (travelers.length !== requiredTravelersCount) {
      setLocalError(
        t(
          "travelersCountMismatch",
          `يجب إدخال بيانات ${requiredTravelersCount} معتمر.`,
        ),
      );

      return false;
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalError(
        t(
          "completeTravelerRequiredFields",
          "يرجى استكمال البيانات والمستندات المطلوبة لجميع المعتمرين.",
        ),
      );

      return false;
    }

    setLocalError("");
    return true;
  };

  /*
  =====================================================
  رفع ملف واحد

  يجب أن يكون لديك endpoint يستقبل:
  multipart/form-data

  المسار المقترح:
  POST /api/uploads/draft-bookings

  ويعيد:
  {
    success: true,
    data: {
      url: "/uploads/draft-bookings/file.jpg"
    }
  }

  إذا كان لديك مسار رفع مختلف، غيّر المسار فقط.
  =====================================================
  */

  const uploadAttachment = async ({
    file,
    travelerIndex,
    fieldName,
  }) => {
    if (!(file instanceof File)) {
      return file || null;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("draftId", draftId);
    formData.append("travelerIndex", String(travelerIndex));
    formData.append("fieldName", fieldName);

    const response = await api.post(
      "/uploads/draft-bookings",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return (
      response?.data?.data?.url ||
      response?.data?.url ||
      null
    );
  };

  /*
  =====================================================
  رفع مستندات جميع المعتمرين
  =====================================================
  */

  const uploadTravelerAttachments = async () => {
    const attachmentFields = [
      "passportImage",
      "personalPhoto",
      "vaccinationCertificate",
      "visaAttachment",
    ];

    const uploadedTravelers = [];

    for (let index = 0; index < travelers.length; index += 1) {
      const traveler = travelers[index];
      const nextTraveler = { ...traveler };

      for (const fieldName of attachmentFields) {
        const value = traveler[fieldName];

        if (value instanceof File) {
          const uploadedUrl = await uploadAttachment({
            file: value,
            travelerIndex: index,
            fieldName,
          });

          if (!uploadedUrl) {
            throw new Error(
              t(
                "attachmentUploadFailed",
                `تعذر رفع المرفق: ${fieldName}`,
              ),
            );
          }

          nextTraveler[fieldName] = uploadedUrl;
        }
      }

      uploadedTravelers.push(nextTraveler);
    }

    return uploadedTravelers;
  };

  /*
  =====================================================
  حفظ المعتمرين والانتقال للمراجعة

  لا يتم إرسال PATCH إلا عند الضغط على الزر.
  =====================================================
  */

  const handleNext = async () => {
    if (!validateTravelers()) return;

    try {
      setUploading(true);
      setLocalError("");

      const travelersWithUploadedFiles =
        await uploadTravelerAttachments();

      const normalizedTravelers =
        travelersWithUploadedFiles.map((traveler) => ({
          ...(traveler._id ? { _id: traveler._id } : {}),

          fullName: traveler.fullName.trim(),
          passportNumber: traveler.passportNumber.trim(),
          nationality: traveler.nationality.trim(),
          birthDate: traveler.birthDate,
          gender: traveler.gender,

          mobile: traveler.mobile?.trim() || "",
          whatsapp: traveler.whatsapp?.trim() || "",

          passportImage: traveler.passportImage || null,
          personalPhoto: traveler.personalPhoto || null,

          vaccinationCertificate:
            traveler.vaccinationCertificate || null,

          visaAttachment:
            traveler.visaAttachment || null,
        }));

      await dispatch(
        updatePublicDraftBooking({
          draftId,
          data: {
            travelers: normalizedTravelers,
            currentStep: "review",
          },
        }),
      ).unwrap();

      navigate(`/draft-booking/${draftId}`);
    } catch (updateError) {
      setLocalError(
        updateError?.response?.data?.message ||
          updateError?.message ||
          updateError ||
          t(
            "travelersSaveFailed",
            "تعذر حفظ بيانات المعتمرين.",
          ),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate(`/booking/custom/${draftId}/customer`);
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
        titleAr="بيانات المعتمرين"
        titleEn="Travelers Information"
        subtitleAr="أدخل بيانات جميع المعتمرين وأرفق المستندات المطلوبة لتأشيرة العمرة."
        subtitleEn="Enter all travelers' details and attach the required Umrah visa documents."
        actions={
          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {t(
              "backToCustomerInfo",
              "العودة لبيانات العميل",
            )}
          </button>
        }
      />

      <BookingProgressTimeline
        currentStep="travelers"
        isArabic={isArabic}
        steps={customBookingSteps}
      />

      <ErrorOverlay
        show={Boolean(error)}
        message={error}
      />

      <ErrorOverlay
        show={Boolean(localError)}
        message={localError}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("travelers", "المعتمرون")}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {t(
                    "requiredTravelersCount",
                    `العدد المطلوب: ${requiredTravelersCount}`,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddTraveler}
                disabled={
                  travelers.length >= requiredTravelersCount ||
                  uploading ||
                  submitLoading
                }
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                + {t("addTraveler", "إضافة معتمر")}
              </button>
            </div>

            {travelers.length >= requiredTravelersCount && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                {t(
                  "travelersCountSatisfied",
                  "تم إدخال العدد المطلوب من المعتمرين، ولا يمكن إضافة معتمر جديد.",
                )}
              </div>
            )}

            <div className="space-y-6">
              {travelers.map((traveler, index) => {
                const travelerErrors = {};

                travelerFields.forEach((field) => {
                  travelerErrors[field.name] =
                    validationErrors[
                      `${index}.${field.name}`
                    ];
                });

                return (
                  <section
                    key={
                      traveler._id ||
                      `traveler-${index}`
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-slate-900">
                        {t("traveler", "معتمر")} {index + 1}
                      </h3>

                      {travelers.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveTraveler(index)
                          }
                          disabled={
                            uploading || submitLoading
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t(
                            "removeTraveler",
                            "حذف المعتمر",
                          )}
                        </button>
                      )}
                    </div>

                    <ConfigFieldsRenderer
                      fields={travelerFields}
                      isArabic={isArabic}
                      getValue={(name) =>
                        traveler[name]
                      }
                      errors={travelerErrors}
                      onChange={(name, value) =>
                        handleTravelerChange(
                          index,
                          name,
                          value,
                        )
                      }
                    />
                  </section>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {t(
                "travelersSummary",
                "ملخص المعتمرين",
              )}
            </h2>

            <div className="mt-5 space-y-4">
              <SummaryRow
                label={t(
                  "requiredCount",
                  "العدد المطلوب",
                )}
                value={requiredTravelersCount}
              />

              <SummaryRow
                label={t(
                  "enteredCount",
                  "العدد المدخل",
                )}
                value={travelers.length}
              />

              <SummaryRow
                label={t(
                  "remainingCount",
                  "المتبقي",
                )}
                value={Math.max(
                  0,
                  requiredTravelersCount -
                    travelers.length,
                )}
              />
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                submitLoading ||
                uploading ||
                travelers.length !== requiredTravelersCount
              }
              className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {uploading
                ? t(
                    "uploadingAttachments",
                    "جاري رفع المستندات...",
                  )
                : submitLoading
                  ? t("saving", "جاري الحفظ...")
                  : t(
                      "saveAndReview",
                      "حفظ والانتقال للمراجعة",
                    )}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={submitLoading || uploading}
              className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {t(
                "previousStep",
                "الخطوة السابقة",
              )}
            </button>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-blue-900">
              {t(
                "requiredVisaDocuments",
                "المستندات المطلوبة",
              )}
            </h3>

            <div className="mt-3 space-y-2 text-sm leading-6 text-blue-800">
              <p>• {t("passportImage", "صورة الجواز")}</p>
              <p>• {t("personalPhoto", "الصورة الشخصية")}</p>
              <p>
                •{" "}
                {t(
                  "vaccinationCertificateOptional",
                  "شهادة التطعيم — عند الحاجة",
                )}
              </p>
              <p>
                •{" "}
                {t(
                  "visaAttachmentOptional",
                  "مرفق التأشيرة — إذا كانت صادرة",
                )}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </PublicPageLayout>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}