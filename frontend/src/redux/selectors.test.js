import publicBookingReducer, {
  createPublicDraftBooking,
  fetchPublicMyBookings,
  selectPublicDraftBooking,
  selectPublicMyBookings,
} from "./public/bookingSlice";
import {
  selectPaymentMethodItems,
  selectPaymentMethodListLoading,
  selectPaymentMethodMutationLoading,
} from "./payments/paymentMethodSlice";

describe("Redux field selectors", () => {
  test("return the exact stored references", () => {
    const draftBooking = { _id: "draft-1" };
    const paymentMethodsList = [{ _id: "method-1" }];
    const state = {
      publicBooking: { draftBooking },
      paymentMethods: { paymentMethodsList },
    };

    expect(selectPublicDraftBooking(state)).toBe(draftBooking);
    expect(selectPaymentMethodItems(state)).toBe(paymentMethodsList);
  });

  test("mutation loading does not affect the list loading selector", () => {
    const state = {
      paymentMethods: {
        listLoading: false,
        mutationLoading: true,
      },
    };

    expect(selectPaymentMethodListLoading(state)).toBe(false);
    expect(selectPaymentMethodMutationLoading(state)).toBe(true);
  });

  test("updating my bookings preserves the draft reference", () => {
    const draftBooking = { _id: "draft-1" };
    let state = publicBookingReducer(
      undefined,
      createPublicDraftBooking.fulfilled({ data: draftBooking }, "request-1"),
    );
    const draftReference = selectPublicDraftBooking({ publicBooking: state });
    const myBookings = [{ _id: "booking-1" }];

    state = publicBookingReducer(
      state,
      fetchPublicMyBookings.fulfilled(
        { data: myBookings, total: 1, page: 1, limit: 10 },
        "request-2",
      ),
    );

    const rootState = { publicBooking: state };
    expect(selectPublicDraftBooking(rootState)).toBe(draftReference);
    expect(selectPublicMyBookings(rootState)).toBe(myBookings);
  });
});
