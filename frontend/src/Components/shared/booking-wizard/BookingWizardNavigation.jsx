import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import PublicButton from "../buttons/PublicButton";

export default function BookingWizardNavigation({
  isFirstStep = false,
  isLastStep = false,
  disabled = false,
  loading = false,
  onBack,
  onNext,
  nextLabel = "التالي",
  backLabel = "السابق",
}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  if (isLastStep) return null;

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const NextIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <div className="flex items-center justify-between gap-3">
      <PublicButton
        variant="secondary"
        icon={BackIcon}
        onClick={onBack}
        disabled={isFirstStep || disabled || loading}
      >
        {backLabel}
      </PublicButton>

      <PublicButton
        variant="primary"
        icon={NextIcon}
        iconPosition="end"
        onClick={onNext}
        disabled={disabled}
        loading={loading}
      >
        {nextLabel}
      </PublicButton>
    </div>
  );
}
