/*
وظيفة التعديل

أصبح BookingProvider الآن مسؤولًا عن:

1- إدارة بيانات الحجز محليًا
2- تجهيز Payload مناسب للباك إند
3- إنشاء Draft Booking إذا لم يكن موجودًا
4- تحديث Draft Booking إذا كان موجودًا
5- إكمال Draft Booking
6- إلغاء Draft Booking
*/

import { createContext, useEffect, useMemo, useReducer } from "react";

import useDraftBooking from "../../../../hooks/public-booking/useDraftBooking";

import { bookingInitialState } from "./bookingInitialState";
import { bookingReducer } from "./bookingReducer";
import { validateBookingWizardStep } from "../bookingWizardValidation";
import {
  calculateBookingPricing,
  getProgramAvailableSeats,
} from "../bookingPricing";

export const BookingContext = createContext(null);

export default function BookingProvider({ children, initialData = {} }) {
  const [state, dispatch] = useReducer(bookingReducer, {
    ...bookingInitialState,
    ...initialData,
  });

  const {
    draftBooking,
    finalBooking,
    loading,
    submitLoading,
    error,
    createDraft,
    updateDraft,
    completeDraft,
    cancelDraft,
    clearError,
    fetchDraft,
  } = useDraftBooking();

  const setLoading = (value) => {
    dispatch({ type: "SET_LOADING", payload: value });
  };

  const setError = (message) => {
    dispatch({ type: "SET_ERROR", payload: message });
  };

  const selectPackage = (program) => {
    dispatch({ type: "SET_SELECTED_PACKAGE", payload: program });
  };

  const updateCustomer = (payload) => {
    dispatch({ type: "SET_CUSTOMER", payload });
  };

  const setTravelers = (travelers) => {
    dispatch({ type: "SET_TRAVELERS", payload: travelers });
  };

  const getTravelerCapacityMessage = (
    nextCount = (state.travelers || []).length + 1,
  ) => {
    const availableSeats = getProgramAvailableSeats(state.selectedPackage);

    if (availableSeats === null || nextCount <= availableSeats) return "";

    return `عدد المعتمرين في هذا البرنامج استكمل العدد المتوفر لديه. المتاح فقط ${availableSeats} معتمر.`;
  };

  const addTraveler = (traveler) => {
    const message = getTravelerCapacityMessage();

    if (message) {
      setValidationErrors({
        ...(state.validationErrors || {}),
        travelersCapacity: message,
      });
      setError(message);
      return false;
    }

    dispatch({ type: "ADD_TRAVELER", payload: traveler });
    setError(null);
    clearValidationErrors();
    return true;
  };

  const removeTraveler = (index) => {
    dispatch({ type: "REMOVE_TRAVELER", payload: index });
  };

  const addProduct = (product) => {
    dispatch({ type: "ADD_PRODUCT", payload: product });
  };

  const removeProduct = (productId) => {
    dispatch({ type: "REMOVE_PRODUCT", payload: productId });
  };

  const updatePricing = (payload) => {
    dispatch({ type: "SET_PRICING", payload });
  };

  const currentPricing = useMemo(
    () =>
      calculateBookingPricing({
        selectedPackage: state.selectedPackage,
        travelers: state.travelers || [],
        selectedProducts: state.selectedProducts || [],
        fallbackPricing: state.pricing || {},
      }),
    [state.selectedPackage, state.travelers, state.selectedProducts, state.pricing],
  );

  useEffect(() => {
    const pricing = state.pricing || {};

    if (
      Number(pricing.subtotal || 0) === currentPricing.subtotal &&
      Number(pricing.tax || 0) === currentPricing.tax &&
      Number(pricing.discount || 0) === currentPricing.discount &&
      Number(pricing.total || 0) === currentPricing.total &&
      Number(pricing.taxRate || 15) === currentPricing.taxRate &&
      pricing.currency === currentPricing.currency
    ) {
      return;
    }

    dispatch({ type: "SET_PRICING", payload: currentPricing });
  }, [currentPricing, state.pricing]);

  const updatePayment = (payload) => {
    dispatch({ type: "SET_PAYMENT", payload });
  };

  const setDraftBooking = (draft) => {
    dispatch({ type: "SET_DRAFT_BOOKING", payload: draft });
  };

  const setFinalBooking = (booking) => {
    dispatch({ type: "SET_FINAL_BOOKING", payload: booking });
  };

  const resetBooking = () => {
    dispatch({ type: "RESET_BOOKING" });
  };

  const setValidationErrors = (errors) => {
    dispatch({
      type: "SET_VALIDATION_ERRORS",
      payload: errors,
    });
  };

  const clearValidationErrors = () => {
    dispatch({
      type: "CLEAR_VALIDATION_ERRORS",
    });
  };

  const validateStep = (stepKey) => {
    const result = validateBookingWizardStep(stepKey, state);

    if (!result.isValid) {
      setValidationErrors(result.errors);
      return false;
    }

    clearValidationErrors();
    return true;
  };

  const getNameAr = (item) => {
    return item?.nameAr || item?.name?.ar || item?.hotel?.nameAr || "";
  };

  const getNameEn = (item) => {
    return item?.nameEn || item?.name?.en || item?.hotel?.nameEn || "";
  };

  const hydrateBookingFromDraft = (draft) => {
    if (!draft) return;

    dispatch({
      type: "HYDRATE_FROM_DRAFT",
      payload: draft,
    });
  };

  const loadDraftBooking = async (draftId) => {
    const draft = await fetchDraft(draftId);
    hydrateBookingFromDraft(draft);
    return draft;
  };

  const buildDraftPayload = (currentStep = "customer_info") => {
    const hotelProduct = state.selectedProducts?.find(
      (item) => item.type === "hotel" || item.type === "roomType",
    );

    const transportProduct = state.selectedProducts?.find(
      (item) => item.type === "transport",
    );

    return {
      customer: {
        name: state.customer?.name || "",
        email: state.customer?.email || "",
        phone: state.customer?.phone || "",
        nationality: state.customer?.nationality || "",
      },

      travelers: (state.travelers || []).map((traveler) => ({
        fullName: traveler.fullName || "",
        passportNumber: traveler.passportNumber || "",
        nationality: traveler.nationality || "",
        birthDate: traveler.birthDate || null,
        gender: traveler.gender || undefined,
      })),

      program: state.selectedPackage
        ? {
            programId: state.selectedPackage._id || state.selectedPackage.id,
            nameAr: getNameAr(state.selectedPackage),
            nameEn: getNameEn(state.selectedPackage),
            startDate: state.selectedPackage.startDate || null,
            endDate: state.selectedPackage.endDate || null,
          }
        : null,

      hotel: hotelProduct
        ? {
            hotelId:
              hotelProduct.hotelId ||
              hotelProduct.hotel?._id ||
              hotelProduct._id ||
              null,
            nameAr: getNameAr(hotelProduct),
            nameEn: getNameEn(hotelProduct),
            roomType:
              hotelProduct.roomType ||
              hotelProduct.roomTypeName ||
              hotelProduct.nameAr ||
              "",
            nights: Number(hotelProduct.nights || 0),
          }
        : null,

      transport: transportProduct
        ? {
            transportId:
              transportProduct.transportId || transportProduct._id || null,
            type: transportProduct.transportType || transportProduct.type || "",
            pickupLocation: transportProduct.pickupLocation || "",
            dropoffLocation: transportProduct.dropoffLocation || "",
          }
        : null,

      pricing: {
        subtotal: Number(currentPricing.subtotal || 0),
        tax: Number(currentPricing.tax || 0),
        taxRate: Number(currentPricing.taxRate || 15),
        discount: Number(currentPricing.discount || 0),
        total: Number(currentPricing.total || 0),
        currency: currentPricing.currency || "SAR",
      },

      currentStep,

      data: {
        selectedProducts: state.selectedProducts || [],
        payment: {
          paymentMethod: state.payment?.paymentMethod || "cash",
          paidAmount: Number(state.payment?.paidAmount || 0),
          transactionId: state.payment?.transactionId || "",
          
        },
        selectedPackage: state.selectedPackage || null,
        documents: state.documents || {},
      },
    };
  };

  const syncDraftBooking = async (currentStep) => {
    const payload = buildDraftPayload(currentStep);

    let savedDraft;

    if (draftBooking?._id || draftBooking?.id || state.draftBooking?._id) {
      savedDraft = await updateDraft(
        payload,
        draftBooking?._id || draftBooking?.id || state.draftBooking?._id,
      );
    } else {
      savedDraft = await createDraft(payload);
    }

    setDraftBooking(savedDraft);

    return savedDraft;
  };

  const completeCurrentDraft = async () => {
    const result = await completeDraft(
      draftBooking?._id || draftBooking?.id || state.draftBooking?._id,
    );

    if (result?.booking || result?.finalBooking) {
      setFinalBooking(result.booking || result.finalBooking);
    }

    return result;
  };

  const cancelCurrentDraft = async () => {
    const result = await cancelDraft(
      draftBooking?._id || draftBooking?.id || state.draftBooking?._id,
    );

    setDraftBooking(result);

    return result;
  };

  // رفع المستندات إلى حالة الحجز
  const updateDocuments = (payload) => {
  dispatch({
    type: "SET_DOCUMENTS",
    payload,
  });
};

  const value = {
    ...state,

    validationErrors: state.validationErrors || {},
    travelerCapacityMessage: getTravelerCapacityMessage(),
    canAddTraveler: !getTravelerCapacityMessage(),
    pricing: currentPricing,

    draftBooking: draftBooking || state.draftBooking,
    finalBooking: finalBooking || state.finalBooking,

    loading: loading || state.loading,
    submitLoading,
    error: error || state.error,

    setLoading,
    setError,
    clearError,

    setValidationErrors,
    clearValidationErrors,
    validateStep,

    selectPackage,
    updateCustomer,

    setTravelers,
    addTraveler,
    removeTraveler,

    addProduct,
    removeProduct,

    updatePricing,
    updatePayment,

    setDraftBooking,
    setFinalBooking,

    buildDraftPayload,
    syncDraftBooking,
    completeCurrentDraft,
    cancelCurrentDraft,

    resetBooking,

    hydrateBookingFromDraft,
    loadDraftBooking,
    updateDocuments,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}
