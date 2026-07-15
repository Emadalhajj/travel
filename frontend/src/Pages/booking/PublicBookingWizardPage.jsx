import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PublicPageLayout from "../../Components/layout/PublicPageLayout";
import PublicSection from "../../Components/layout/PublicSection";
import PublicContent from "../../Components/layout/PublicContent";

import BookingWizard from "../../Components/shared/booking-wizard/BookingWizard";
import { BookingProvider } from "../../Components/shared/booking-wizard/context";
import BookingProgressTimeline from "../../Components/shared/booking/BookingProgressTimeline";

import {
  clearSelectedProgram,
  fetchPublicProgramById,
  fetchPublicPrograms,
} from "../../redux/public/programSlice";

export default function PublicBookingWizardPage() {
  const { programId } = useParams();
  const dispatch = useDispatch();

  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const {
    programs = [],
    selectedProgram = null,
    loading = false,
    detailsLoading = false,
    error = null,
  } = useSelector((state) => state.publicPrograms || {});

  useEffect(() => {
    if (programId) {
      dispatch(fetchPublicProgramById(programId));

      return () => {
        dispatch(clearSelectedProgram());
      };
    }

    dispatch(fetchPublicPrograms());
  }, [dispatch, programId]);

  const wizardPackages =
    programId && selectedProgram ? [selectedProgram] : programs;

  return (
    <BookingProvider>
      <PublicPageLayout>
        <PublicSection>
          <PublicContent>
            <BookingProgressTimeline
              currentStep="customer_info"
              isArabic={isArabic}
            />

            <BookingWizard
              packages={wizardPackages}
              initialPackage={programId ? selectedProgram : null}
              packagesLoading={programId ? detailsLoading : loading}
              packagesError={error}
            />
          </PublicContent>
        </PublicSection>
      </PublicPageLayout>
    </BookingProvider>
  );
}