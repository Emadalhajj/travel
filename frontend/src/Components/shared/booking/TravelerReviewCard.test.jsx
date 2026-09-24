import { render, screen } from "@testing-library/react";
import TravelerReviewCard, { buildTravelerReviewItems } from "./TravelerReviewCard";
import { BOOKING_REQUIREMENTS } from "../../../config/public-booking/bookingRequirements";

jest.mock("../draft-bookings/DraftBookingInfoCard", () => () => null);
jest.mock("../attachments/AttachmentPreviewCard", () => ({ label }) => <div>{label}</div>);

const translate = (_key, fallback) => fallback;

test("يعرض مستندات الحجز المسموح بها فقط لمسافر الرحلة", () => {
  render(
    <TravelerReviewCard
      traveler={{
        passportImage: "passport.jpg",
        personalPhoto: "personal.jpg",
        vaccinationCertificate: "vaccine.jpg",
        visaAttachment: "visa.jpg",
      }}
      index={0}
      t={translate}
      documentRequirements={BOOKING_REQUIREMENTS.FLIGHT.documents}
    />,
  );

  expect(screen.getByText("صورة الجواز")).toBeTruthy();
  expect(screen.queryByText("الصورة الشخصية")).toBeNull();
  expect(screen.queryByText("شهادة التطعيم")).toBeNull();
  expect(screen.queryByText("مرفق التأشيرة")).toBeNull();
});

test("يخفي قسم المستندات إذا لم توجد مرفقات مسموحة", () => {
  render(
    <TravelerReviewCard
      traveler={{ personalPhoto: "personal.jpg" }}
      index={0}
      t={translate}
      documentRequirements={BOOKING_REQUIREMENTS.FLIGHT.documents}
    />,
  );

  expect(screen.queryByText("المستندات المرفقة")).toBeNull();
});

test("مراجعة الطيران تعرض نفس حقول Passenger payload", () => {
  const items = buildTravelerReviewItems({
    traveler: {
      passengerCategory: "child",
      title: "CHILD",
      firstName: "Sara",
      lastName: "Saleh",
      birthDate: "2020-01-01",
      gender: "female",
      email: "sara@example.com",
      phoneNumber: "+966500000000",
      documentType: "PASSPORT",
      documentNumber: "P1",
      documentIssuingCountry: "SA",
      passportExpiryDate: "2030-01-01",
    },
    t: translate,
    isArabic: true,
    isExternalFlight: true,
    supportedIdentityDocumentTypes: ["passport"],
  });
  const byLabel = Object.fromEntries(items.map(({ label, value }) => [label, value]));

  expect(byLabel["فئة الراكب"]).toBe("طفل");
  expect(byLabel["اللقب المرسل للمزود"]).toBe("miss");
  expect(byLabel["الاسم الأول المرسل"]).toBe("Sara");
  expect(byLabel["اسم العائلة المرسل"]).toBe("Saleh");
  expect(byLabel["إرسال الوثيقة إلى المزود"]).toBe("نعم");
});
