import { render } from "@testing-library/react";
import FieldRenderer from "./FieldRenderer";

let mockRenderCount = 0;

jest.mock("./DefaultField", () => function MockDefaultField() {
  mockRenderCount += 1;
  return <input aria-label="field" />;
});

const field = {
  name: "firstName",
  type: "text",
  labelAr: "الاسم",
  labelEn: "Name",
};
const stableProps = {
  field,
  isArabic: true,
  setFormState: jest.fn(),
  helpers: {},
  imageState: {},
  initialData: {},
};

test("a simple field row only renders when its own value changes", () => {
  const { rerender } = render(
    <FieldRenderer
      {...stableProps}
      formState={{ firstName: "Ahmed", unrelated: "one" }}
      fieldErrors={{}}
    />,
  );
  expect(mockRenderCount).toBe(1);

  rerender(
    <FieldRenderer
      {...stableProps}
      formState={{ firstName: "Ahmed", unrelated: "two" }}
      fieldErrors={{ unrelated: "error" }}
    />,
  );
  expect(mockRenderCount).toBe(1);

  rerender(
    <FieldRenderer
      {...stableProps}
      formState={{ firstName: "Ali", unrelated: "two" }}
      fieldErrors={{}}
    />,
  );
  expect(mockRenderCount).toBe(2);
});
