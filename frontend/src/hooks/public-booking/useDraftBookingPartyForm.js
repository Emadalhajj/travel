import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { updatePublicDraftBooking } from "../../redux/public/bookingSlice";
import { apiUploadDraftDocument } from "../../services/api/public/bookingApi";
import { validateBookingParty } from "../../Utils/publicBookingValidation";
import { getProgramAvailableSeats } from "../../Components/shared/booking-wizard/bookingPricing";

const createEmptyTraveler = () => ({
  fullName: "", passportNumber: "", nationality: "", birthDate: "", gender: "male",
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

  const initialTravelerCount = useMemo(() => Math.max(1, Number(
    draftBooking?.data?.travelersCount ??
      draftBooking?.data?.pilgrimsCount ??
      draftBooking?.data?.searchCriteria?.travelersCount ?? 1,
  )), [draftBooking]);

  const availableSeats = useMemo(() => {
    const packageType = String(draftBooking?.data?.packageType || "").toUpperCase();
    if (packageType !== "READY_PACKAGE") return null;
    return getProgramAvailableSeats(draftBooking?.data?.selectedPackage);
  }, [draftBooking]);

  useEffect(() => {
    if (!draftBooking?._id || hydratedDraftIdRef.current === draftBooking._id) return;
    const savedTravelers = Array.isArray(draftBooking.travelers) ? draftBooking.travelers : [];

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
        passportFiles: storedFile(traveler.passportImage),
        personalPhotoFiles: storedFile(traveler.personalPhoto),
        vaccinationCertificateFiles: storedFile(traveler.vaccinationCertificate),
        visaAttachmentFiles: storedFile(traveler.visaAttachment),
      };
    }));
    hydratedDraftIdRef.current = draftBooking._id;
  }, [draftBooking, initialTravelerCount]);

  const clearError = (key) => setErrors((previous) => ({ ...previous, [key]: "" }));
  const handleCustomerChange = (name, value) => {
    setCustomer((previous) => ({ ...previous, [name]: value }));
    clearError(`customer.${name}`);
  };
  const handleTravelerChange = (index, name, value) => {
    setTravelers((previous) => previous.map((traveler, travelerIndex) =>
      travelerIndex === index ? { ...traveler, [name]: value } : traveler));
    clearError(`travelers.${index}.${name}`);
  };
  const handleHostsChange = (nextHosts) => {
    setHosts(nextHosts);
    setErrors((previous) => Object.fromEntries(
      Object.entries(previous).filter(([key]) => !key.startsWith("hosts.")),
    ));
  };
  const canAddTraveler = availableSeats === null
    ? travelers.length < initialTravelerCount
    : travelers.length < availableSeats;
  const addTraveler = () => {
    if (!canAddTraveler) return;
    setTravelers((previous) => [...previous, createEmptyTraveler()]);
  };
  const removeTraveler = (index) => setTravelers((previous) => previous.filter((_, itemIndex) => itemIndex !== index));

  const validateForm = () => {
    const nextErrors = validateBookingParty({ customer, travelers, hosts, isArabic });
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
        Promise.all(travelers.map(prepareTraveler)),
        Promise.all(hosts.map(prepareHost)),
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
    closeSaveConfirmation: () => !uploading && !submitLoading && setShowSaveConfirmation(false),
    requestSaveConfirmation,
    handleCustomerChange, handleTravelerChange, handleHostsChange,
    addTraveler, removeTraveler, validateForm, savePartyDetails,
  };
}
