import { bookingInitialState } from "./bookingInitialState";

export function bookingReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_SELECTED_PACKAGE":
      return {
        ...state,
        selectedPackage: action.payload,
      };

    case "SET_CUSTOMER":
      return {
        ...state,
        customer: {
          ...state.customer,
          ...action.payload,
        },
      };

    case "SET_TRAVELERS":
      return {
        ...state,
        travelers: action.payload,
      };

    case "ADD_TRAVELER":
      return {
        ...state,
        travelers: [...state.travelers, action.payload],
      };

    case "REMOVE_TRAVELER":
      return {
        ...state,
        travelers: state.travelers.filter(
          (_, index) => index !== action.payload,
        ),
      };

    case "ADD_PRODUCT":
      return {
        ...state,
        selectedProducts: [...state.selectedProducts, action.payload],
      };

    case "REMOVE_PRODUCT":
      return {
        ...state,
        selectedProducts: state.selectedProducts.filter(
          (item) =>
            item.refId !== action.payload && item._id !== action.payload,
        ),
      };

    case "SET_PRICING":
      return {
        ...state,
        pricing: {
          ...state.pricing,
          ...action.payload,
        },
      };

    case "SET_PAYMENT":
      return {
        ...state,
        payment: {
          ...state.payment,
          ...action.payload,
        },
      };

    case "SET_DRAFT_BOOKING":
      return {
        ...state,
        draftBooking: action.payload,
      };

    case "SET_FINAL_BOOKING":
      return {
        ...state,
        finalBooking: action.payload,
      };
    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        validationErrors: action.payload || {},
      };

    case "CLEAR_VALIDATION_ERRORS":
      return {
        ...state,
        validationErrors: {},
      };
    case "HYDRATE_FROM_DRAFT":
      return {
        ...state,

        draftBooking: action.payload,

        customer: {
          ...state.customer,
          ...(action.payload?.customer || {}),
        },

        travelers: action.payload?.travelers || [],

        selectedPackage:
          action.payload?.data?.selectedPackage ||
          action.payload?.program ||
          null,

        selectedProducts: action.payload?.data?.selectedProducts || [],

        pricing: {
          ...state.pricing,
          ...(action.payload?.pricing || {}),
        },

        payment: {
          ...state.payment,
          ...(action.payload?.data?.payment || {}),
        },
      };
      case "SET_DOCUMENTS":
  return {
    ...state,
    documents: {
      ...state.documents,
      ...action.payload,
    },
  };

    case "RESET_BOOKING":
      return bookingInitialState;

    default:
      return state;
  }
}
