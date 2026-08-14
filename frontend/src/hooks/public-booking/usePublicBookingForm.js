import { useMemo, useState } from "react";
import { calculateBookingPricing } from "../../Components/shared/booking-wizard/bookingPricing";

const emptyTraveler = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  birthDate: "",
  gender: "male",
  passportImage: "",
  passportFiles: [],
};

const initialFormData = {
  customer: {
    name: "",
    email: "",
    phone: "",
    nationality: "",
  },
  travelers: [{ ...emptyTraveler }],
};

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const setNestedValue = (obj, path, value) => {
  const keys = path.split(".");
  const copy = structuredClone(obj);

  let current = copy;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = current[key] || {};
      current = current[key];
    }
  });

  return copy;
};

export default function usePublicBookingForm({ selectedProgram }) {
  const [formData, setFormData] = useState(initialFormData);

  const pricing = useMemo(() => {
    return calculateBookingPricing({
      selectedPackage: selectedProgram,
      travelers: formData.travelers || [],
      selectedProducts: [],
      fallbackPricing: {
        discount: Number(selectedProgram?.discount?.amount || 0),
        currency: selectedProgram?.pricing?.currency || "SAR",
      },
    });
  }, [selectedProgram, formData.travelers]);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => setNestedValue(prev, name, value));
  };

  const handleTravelerChange = (index, name, value) => {
    setFormData((prev) => {
      const travelers = [...prev.travelers];

      travelers[index] = {
        ...travelers[index],
        [name]: value,
      };

      return {
        ...prev,
        travelers,
      };
    });
  };

  const handleCustomerChange = (name, value) => {
    handleFieldChange(`customer.${name}`, value);
  };

  const addTraveler = () => {
    setFormData((prev) => ({
      ...prev,
      travelers: [...prev.travelers, { ...emptyTraveler }],
    }));
  };

  const removeTraveler = (index) => {
    setFormData((prev) => {
      if (prev.travelers.length === 1) return prev;

      return {
        ...prev,
        travelers: prev.travelers.filter((_, i) => i !== index),
      };
    });
  };

  const buildDraftCreatePayload = () => ({
    customer: formData.customer,
    currentStep: "customer_info",
  });

  const buildDraftUpdatePayload = () => ({
    customer: formData.customer,

    travelers: formData.travelers,

    program: {
      programId: selectedProgram?._id || null,
      nameAr: selectedProgram?.nameAr || selectedProgram?.name?.ar || "",
      nameEn: selectedProgram?.nameEn || selectedProgram?.name?.en || "",
      startDate: selectedProgram?.startDate || null,
      endDate: selectedProgram?.endDate || null,
    },

    pricing,

    currentStep: "review",
    data: {
      selectedPackage: selectedProgram || null,
      selectedProducts: [],
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    pricing,

    getValue: (name) => getNestedValue(formData, name),

    handleFieldChange,
    handleCustomerChange,
    handleTravelerChange,

    addTraveler,
    removeTraveler,

    buildDraftCreatePayload,
    buildDraftUpdatePayload,

    resetForm,
  };
}
