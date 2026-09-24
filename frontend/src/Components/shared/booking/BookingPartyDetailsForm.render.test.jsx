import { render } from "@testing-library/react";
import {
  getTravelerTypeLabel,
  TravelerFormSection,
} from "./BookingPartyDetailsForm";

let mockUploaderRenders = 0;

jest.mock("../../common/FileAttachmentUploader", () => function MockUploader() {
  mockUploaderRenders += 1;
  return <div data-testid="uploader" />;
});

jest.mock("../../common/buttons/ActionButton", () => function MockActionButton(props) {
  return <button type="button" onClick={props.onClick}>action</button>;
});

const traveler = {
  fullName: "Traveler Two",
  passportNumber: "P2",
  nationality: "SA",
  gender: "male",
  passportFiles: [],
  personalPhotoFiles: [],
  vaccinationCertificateFiles: [],
  visaAttachmentFiles: [],
};

test("an unrelated traveler error does not render this traveler row", () => {
  const stableProps = {
    traveler,
    index: 1,
    isOpen: true,
    canRemove: true,
    isArabic: true,
    onChange: jest.fn(),
    onRemove: jest.fn(),
    onToggle: jest.fn(),
  };
  const { rerender } = render(
    <TravelerFormSection {...stableProps} errors={{}} />,
  );
  expect(mockUploaderRenders).toBe(4);

  rerender(
    <TravelerFormSection
      {...stableProps}
      errors={{ "travelers.0.fullName": "Required" }}
    />,
  );

  expect(mockUploaderRenders).toBe(4);
});

test("traveler type labels use a sequence inside each provider category", () => {
  expect(getTravelerTypeLabel({
    passengerType: "adult",
    sequence: 2,
    isArabic: true,
  })).toBe("البالغ 2");
  expect(getTravelerTypeLabel({
    passengerType: "infant_without_seat",
    sequence: 1,
    isArabic: false,
  })).toBe("Infant 1");
});
