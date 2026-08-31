import { handleApiError } from "./handleApiError";

describe("handleApiError field contract", () => {
  it("keeps a backend field association when there is one message", () => {
    const rejectWithValue = jest.fn((payload) => payload);
    const error = {
      response: {
        data: {
          message: "تاريخ النهاية غير صحيح",
          field: "endDate",
        },
      },
    };

    expect(handleApiError(error, rejectWithValue, "ar")).toEqual({
      endDate: "تاريخ النهاية غير صحيح",
    });
  });
});
