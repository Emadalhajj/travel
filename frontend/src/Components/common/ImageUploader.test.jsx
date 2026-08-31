import { fireEvent, render, screen } from "@testing-library/react";
import ImageUploader from "./ImageUploader";

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
});

test("keeps a newly selected image when the parent rerenders with an equivalent empty array", () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <ImageUploader initialImages={[]} onChange={onChange} />,
  );

  const file = new File(["image"], "transport.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("الصور التوضيحية"), {
    target: { files: [file] },
  });

  expect(screen.getByAltText("preview").getAttribute("src")).toBe("blob:preview");

  rerender(<ImageUploader initialImages={[]} onChange={onChange} />);

  expect(screen.getByAltText("preview").getAttribute("src")).toBe("blob:preview");
});
