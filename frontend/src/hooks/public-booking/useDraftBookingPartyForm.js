import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { updatePublicDraftBooking } from "../../redux/public/bookingSlice";
import { apiUploadDraftDocument } from "../../services/api/public/bookingApi";
import { validateBookingParty } from "../../Utils/publicBookingValidation";
import { getProgramAvailableSeats } from "../../Components/shared/booking-wizard/bookingPricing";
import {
  getBookingRequirementKey,
  getBookingRequirements,
  isRequirementVisible,
} from "../../config/public-booking/bookingRequirements";

const createEmptyTraveler = () => ({
  fullName: "", passportNumber: "", nationality: "", birthDate: "", gender: "male",
  givenName: "", familyName: "", email: "", phoneNumber: "",
  title: "", firstName: "", middleName: "", lastName: "",
  documentType: "PASSPORT", documentNumber: "", documentIssuingCountry: "",
  passengerCategory: "adult", passportExpiryDate: "",
  passportIssuingCountryCode: "", responsibleAdultTravelerId: "",
  passportImage: "", passportFiles: [], whatsapp: "",
  personalPhoto: "", personalPhotoFiles: [],
  vaccinationCertificate: "", vaccinationCertificateFiles: [],
  visaAttachment: "", visaAttachmentFiles: [], hostId: "",
});

const emptyCustomer = { name: "", phone: "", email: "", nationality: "" };
const storedFile = (value) => value ? [{ url: value }] : [];
const getNewFile = (files = []) => files.find((item) => item instanceof File);

export default function useDraftBookingPartyForm({
  draftId,
  draftBooking,
  submitLoading = false,
  isArabic = true,
}) {
  const dispatch = useDispatch();
  const hydratedDraftIdRef = useRef("");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [travelers, setTravelers] = useState([createEmptyTraveler()]);
  const [hosts, setHosts] = useState([]);
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const bookingType = getBookingRequirementKey(draftBooking);
  const requirements = getBookingRequirements(draftBooking);
  const isExternalFlight = bookingType === "FLIGHT";
  const serviceType = String(
    draftBooking?.serviceType || draftBooking?.data?.serviceType || "",
  ).toUpperCase();
  const externalSlices = draftBooking?.trip?.external?.slices || [];
  const firstExternalSegment = externalSlices[0]?.segments?.[0];
  const finalExternalSlice = externalSlices[externalSlices.length - 1];
  const finalExternalSegment = finalExternalSlice?.segments?.[
    (finalExternalSlice?.segments?.length || 1) - 1
  ];
  const travelEndsAt = finalExternalSegment?.arrivalAt ||
    draftBooking?.trip?.arrivalAt ||
    draftBooking?.trip?.departureAt ||
    null;
  const travelStartsAt = firstExternalSegment?.departureAt ||
    draftBooking?.trip?.departureAt ||
    null;
  const initialTravelerCount = useMemo(() => {
    if (!isRequirementVisible(requirements.travelers)) return 0;

    if (serviceType === "ACCOMMODATION") {
      return Math.max(
        1,
        Number(draftBooking?.hotel?.adults || 0) +
          Number(draftBooking?.hotel?.children || 0),
      );
    }

    return Math.max(1, Number(
      draftBooking?.data?.travelersCount ??
        draftBooking?.data?.pilgrimsCount ??
        draftBooking?.data?.searchCriteria?.travelersCount ?? 1,
    ));
  }, [draftBooking, requirements.travelers, serviceType]);

  const availableSeats = useMemo(() => {
    const packageType = String(draftBooking?.data?.packageType || "").toUpperCase();
    if (packageType !== "READY_PACKAGE") return null;
    return getProgramAvailableSeats(draftBooking?.data?.selectedPackage);
  }, [draftBooking]);

  useEffect(() => {
    if (!draftBooking?._id || hydratedDraftIdRef.current === draftBooking._id) return;
    const savedTravelers = Array.isArray(draftBooking.travelers) ? draftBooking.travelers : [];
    const firstAdult = savedTravelers.find(
      (traveler) => (traveler.passengerCategory || "adult") === "adult",
    );
    const firstAdultId = firstAdult?._id || firstAdult?.id || "";

    setCustomer({ ...emptyCustomer, ...(draftBooking.customer || {}) });
    setHosts(Array.isArray(draftBooking.hosts) ? draftBooking.hosts.map((host) => ({
      ...host,
      idFiles: storedFile(host.idImage),
      nationalAddressFiles: storedFile(host.nationalAddressImage),
    })) : []);
    const hydratedTravelerCount = Math.max(initialTravelerCount, savedTravelers.length);
    setTravelers(Array.from({ length: hydratedTravelerCount }, (_, index) => {
      const traveler = savedTravelers[index] || {};
      return {
        ...createEmptyTraveler(), ...traveler,
        title: ["child", "infant_without_seat"].includes(traveler.passengerCategory)
          ? "CHILD"
          : (traveler.title || ""),
        firstName: traveler.firstName || traveler.givenName || "",
        lastName: traveler.lastName || traveler.familyName || "",
        documentType: traveler.documentType || "PASSPORT",
        documentNumber: traveler.documentNumber || traveler.passportNumber || "",
        documentIssuingCountry:
          traveler.documentIssuingCountry ||
          traveler.passportIssuingCountryCode ||
          "",
        responsibleAdultTravelerId:
          traveler.responsibleAdultTravelerId ||
          (traveler.passengerCategory === "infant_without_seat"
            ? String(firstAdultId)
            : ""),
        passportFiles: storedFile(traveler.passportImage),
        personalPhotoFiles: storedFile(traveler.personalPhoto),
        vaccinationCertificateFiles: storedFile(traveler.vaccinationCertificate),
        visaAttachmentFiles: storedFile(traveler.visaAttachment),
      };
    }));
    hydratedDraftIdRef.current = draftBooking._id;
  }, [draftBooking, initialTravelerCount]);

  const clearError = useCallback((key) => setErrors((previous) => ({ ...previous, [key]: "" })), []);
  const handleCustomerChange = useCallback((name, value) => {
    setCustomer((previous) => ({ ...previous, [name]: value }));
    clearError(`customer.${name}`);
  }, [clearError]);
  const handleTravelerChange = useCallback((index, name, value) => {
    const aliases = {
      firstName: "givenName",
      lastName: "familyName",
      documentNumber: "passportNumber",
      documentIssuingCountry: "passportIssuingCountryCode",
    };
    setTravelers((previous) => previous.map((traveler, travelerIndex) => {
      if (travelerIndex !== index) return traveler;
      return {
        ...traveler,
        [name]: value,
        ...(aliases[name] ? { [aliases[name]]: value } : {}),
      };
    }));
    clearError(`travelers.${index}.${name}`);
  }, [clearError]);
  const handleHostsChange = useCallback((nextHosts) => {
    setHosts(nextHosts);
    setErrors((previous) => Object.fromEntries(
      Object.entries(previous).filter(([key]) => !key.startsWith("hosts.")),
    ));
  }, []);
  const canAddTraveler = availableSeats === null
    ? travelers.length < initialTravelerCount
    : travelers.length < availableSeats;
  const addTraveler = useCallback(() => {
    if (!canAddTraveler) return;
    setTravelers((previous) => [...previous, createEmptyTraveler()]);
  }, [canAddTraveler]);
  const removeTraveler = useCallback((index) => setTravelers(
    (previous) => previous.filter((_, itemIndex) => itemIndex !== index),
  ), []);

  const validateForm = () => {
    const nextErrors = validateBookingParty({
      customer,
      travelers,
      hosts,
      isArabic,
      requirements,
      travelStartsAt,
      travelEndsAt,
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const requestSaveConfirmation = () => {
    if (validateForm()) setShowSaveConfirmation(true);
  };

  const uploadDocument = async ({ files, currentValue }) => {
    const file = getNewFile(files);
    if (!file) return currentValue || "";
    const response = await apiUploadDraftDocument({ draftId, file });
    return response?.data?.url || currentValue || "";
  };

  const prepareTraveler = async (traveler) => {
    const [passportImage, personalPhoto, vaccinationCertificate, visaAttachment] = await Promise.all([
      uploadDocument({ files: traveler.passportFiles, currentValue: traveler.passportImage }),
      uploadDocument({ files: traveler.personalPhotoFiles, currentValue: traveler.personalPhoto }),
      uploadDocument({ files: traveler.vaccinationCertificateFiles, currentValue: traveler.vaccinationCertificate }),
      uploadDocument({ files: traveler.visaAttachmentFiles, currentValue: traveler.visaAttachment }),
    ]);
    const { passportFiles, personalPhotoFiles, vaccinationCertificateFiles, visaAttachmentFiles, ...travelerData } = traveler;
    return { ...travelerData, passportImage, personalPhoto, vaccinationCertificate, visaAttachment };
  };

  const prepareHost = async (host) => {
    const [idImage, nationalAddressImage] = await Promise.all([
      uploadDocument({ files: host.idFiles, currentValue: host.idImage }),
      uploadDocument({ files: host.nationalAddressFiles, currentValue: host.nationalAddressImage }),
    ]);
    const { idFiles, nationalAddressFiles, ...hostData } = host;
    return { ...hostData, idImage, nationalAddressImage };
  };

  const savePartyDetails = async () => {
    if (!validateForm()) return false;
    setShowSaveConfirmation(false);
    setLocalError("");
    setUploading(true);
    try {
      const [normalizedTravelers, normalizedHosts] = await Promise.all([
        isRequirementVisible(requirements.travelers)
          ? Promise.all(travelers.map(prepareTraveler))
          : [],
        isRequirementVisible(requirements.hosts)
          ? Promise.all(hosts.map(prepareHost))
          : [],
      ]);
      await dispatch(updatePublicDraftBooking({
        draftId,
        data: { customer, travelers: normalizedTravelers, hosts: normalizedHosts, currentStep: "review" },
      })).unwrap();
      return true;
    } catch (saveError) {
      setLocalError(saveError?.response?.data?.message || saveError?.message || saveError ||
        (isArabic ? "تعذر حفظ البيانات" : "Unable to save details"));
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    customer, travelers, hosts, errors, localError,
    uploading, saving: uploading || submitLoading,
    canAddTraveler,
    availableSeats,
    travelersCount: travelers.length,
    showSaveConfirmation,
    isExternalFlight,
    bookingType,
    requirements,
    serviceType,
    closeSaveConfirmation: () => !uploading && !submitLoading && setShowSaveConfirmation(false),
    requestSaveConfirmation,
    handleCustomerChange, handleTravelerChange, handleHostsChange,
    addTraveler, removeTraveler, validateForm, savePartyDetails,
  };
}
