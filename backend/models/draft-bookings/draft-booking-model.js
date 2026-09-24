// models/draft-bookings/draft-booking-model.js

/*
=====================================================
Draft Booking Model
=====================================================

موديل مسودة الحجز.

هذا الموديل يستخدم لحفظ بيانات الحجز قبل اعتماده نهائيًا.

يحتوي على:
-----------------------------------------------------
- المستخدم أو العميل صاحب المسودة
- بيانات العميل
- بيانات المسافرين
- بيانات البرنامج
- بيانات الفندق
- بيانات النقل
- بيانات التسعير
- الخطوة الحالية
- حالة المسودة
- الحجز النهائي المرتبط بها بعد التحويل
- بيانات Soft Delete

العلاقة:
-----------------------------------------------------
DraftBooking يمكن أن يتحول لاحقًا إلى Booking حقيقي.
=====================================================
*/

import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import { pricingQuoteSchema } from "../shared/pricing-quote-schema.js";

import {
  DRAFT_BOOKING_STATUS,
  DRAFT_BOOKING_STATUS_LIST,
} from "../../constants/draft-bookings/draft-booking-status.js";

//تجعل currentStep محدودًا بقائمة خطوات واضحة، بدل أن يكون أي نص.
const DRAFT_BOOKING_STEPS = [
  "choose_package",
  "customer_info",
  "pilgrims",
  "services",
  "documents",
  "review",
  "payment",
  "success",
];

/*
تعريف النقل في Schema مستقل مهم لأن وجود حقل باسم `type` داخل كائن
مضمّن قد يجعل Mongoose يفسر كائن `transport` نفسه كتعريف SchemaType.
*/
const draftTransportSchema = new mongoose.Schema(
  {
    transportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      default: null,
    },

    type: String,

    pickupLocation: String,

    dropoffLocation: String,
  },
  { _id: false },
);

const externalFlightSegmentSchema = new mongoose.Schema({
  externalId: { type: String, trim: true, default: "" },
  origin: { type: String, trim: true, default: "" },
  destination: { type: String, trim: true, default: "" },
  departureAt: { type: Date, default: null },
  arrivalAt: { type: Date, default: null },
  carrierCode: { type: String, trim: true, default: "" },
  carrierName: { type: String, trim: true, default: "" },
  serviceNumber: { type: String, trim: true, default: "" },
}, { _id: false });

const externalFlightSliceSchema = new mongoose.Schema({
  externalId: { type: String, trim: true, default: "" },
  origin: { type: String, trim: true, default: "" },
  destination: { type: String, trim: true, default: "" },
  segmentIds: { type: [String], default: [] },
  segments: { type: [externalFlightSegmentSchema], default: [] },
}, { _id: false });

const externalFlightSnapshotSchema = new mongoose.Schema({
  provider: { type: String, trim: true, default: "" },
  offerId: { type: String, trim: true, default: "" },
  offerRequestId: { type: String, trim: true, default: "" },
  expiresAt: { type: Date, default: null },
  route: {
    origin: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
  },
  slices: { type: [externalFlightSliceSchema], default: [] },
  passengers: {
    adults: { type: Number, min: 0, default: 0 },
    children: { type: Number, min: 0, default: 0 },
    infants: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
    items: {
      type: [new mongoose.Schema({
        providerPassengerId: { type: String, trim: true, default: "" },
        category: { type: String, trim: true, default: "" },
      }, { _id: false })],
      default: [],
    },
  },
  pricing: {
    total: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: "" },
  },
  supportedIdentityDocumentTypes: { type: [String], default: [] },
  paymentRequirements: {
    requiresInstantPayment: { type: Boolean, default: false },
    paymentRequiredBy: { type: Date, default: null },
  },
  validatedAt: { type: Date, default: null },
}, { _id: false });



const draftTripSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    departureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TripDeparture",
      default: null,
    },
    nameAr: { type: String, default: "" },
    nameEn: { type: String, default: "" },
    tripType: { type: String, default: "" },
    scope: { type: String, default: "" },
    subtype: { type: String, default: "" },
    source: { type: String, default: "" },
    fromCity: { type: String, default: "" },
    toCity: { type: String, default: "" },
    departureAt: { type: Date, default: null },
    arrivalAt: { type: Date, default: null },
    quantity: { type: Number, default: 1, min: 0 },
    chargeType: {
      type: String,
      enum: ["PER_TRAVELER", "PER_UNIT", "PER_BOOKING"],
      default: "PER_TRAVELER",
    },
    unitPrice: { type: Number, default: 0, min: 0 },
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: DEFAULT_CURRENCY,
    },
    external: { type: externalFlightSnapshotSchema, default: null },
  },
  { _id: false },
);

const draftHostSchema = new mongoose.Schema(
  {
    hostId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
    nationalAddress: { type: String, required: true, trim: true },
    idImage: { type: String, trim: true, default: "" },
    nationalAddressImage: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const draftBookingSchema = new mongoose.Schema(
  {
    bookingContext: {
      type: String,
      enum: ["READY_PACKAGE", "CUSTOM_PACKAGE", "SERVICE"],
      default: "CUSTOM_PACKAGE",
      index: true,
    },
    serviceType: {
      type: String,
      enum: [
        "",
        "FLIGHT",
        "TRIP",
        "HOTEL",
        "ACCOMMODATION",
        "TRANSPORT",
        "VISA",
        "ZIYARAT",
        "EXTRA_SERVICE",
      ],
      default: "",
    },
    /*
    المستخدم الذي أنشأ المسودة.
    قد يكون عميلًا أو موظفًا من لوحة التحكم.
    */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /*
    بيانات العميل الأساسية.
    */
    customer: {
      name: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      nationality: {
        type: String,
        trim: true,
      },
    },

    /*
    بيانات المسافرين أو المعتمرين.
    */
    travelers: [
      {
        fullName: {
          type: String,
          trim: true,
        },

        givenName: { type: String, trim: true, default: "" },
        familyName: { type: String, trim: true, default: "" },
        title: { type: String, enum: ["", "MR", "MRS", "MS", "CHILD", "OTHER"], default: "" },
        firstName: { type: String, trim: true, default: "" },
        middleName: { type: String, trim: true, default: "" },
        lastName: { type: String, trim: true, default: "" },
        documentType: {
          type: String,
          enum: ["PASSPORT", "NATIONAL_ID", "RESIDENCY_ID", "GCC_ID"],
          default: "PASSPORT",
        },
        documentNumber: { type: String, trim: true, default: "" },
        documentIssuingCountry: { type: String, trim: true, default: "" },
        email: { type: String, trim: true, lowercase: true, default: "" },
        phoneNumber: { type: String, trim: true, default: "" },
        passengerCategory: {
          type: String,
          enum: ["adult", "child", "infant_without_seat"],
          default: "adult",
        },
        responsibleAdultTravelerId: { type: String, trim: true, default: "" },

        passportNumber: {
          type: String,
          trim: true,
        },

        passportExpiryDate: { type: Date, default: null },
        passportIssuingCountryCode: { type: String, trim: true, default: "" },

        nationality: {
          type: String,
          trim: true,
        },

        birthDate: {
          type: Date,
          default: null,
        },

        gender: {
          type: String,
          enum: ["male", "female"],
        },

        passportImage: {
          type: String,
          trim: true,
          default: "",
        },

        whatsapp: { type: String, trim: true, default: "" },
        personalPhoto: { type: String, trim: true, default: "" },
        vaccinationCertificate: { type: String, trim: true, default: "" },
        visaAttachment: { type: String, trim: true, default: "" },

        hostId: { type: String, trim: true, default: "" },
      },
    ],

    hosts: { type: [draftHostSchema], default: [] },

    /*
    بيانات البرنامج أو الباقة المختارة.
    لاحقًا عند بناء Umrah Package / Program يمكن ربطها بموديل مستقل.
    */
    program: {
      programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UmrahProgram",
        default: null,
      },

      nameAr: String,
      nameEn: String,

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },
    },

    /*
    بيانات الفندق المختار.
    */
    hotel: {
      hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
        default: null,
      },

      nameAr: String,
      nameEn: String,

      roomType: String,
      roomTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
        default: null,
      },
      roomTypeNameAr: { type: String, default: "" },
      roomTypeNameEn: { type: String, default: "" },
      checkIn: { type: Date, default: null },
      checkOut: { type: Date, default: null },
      roomsCount: { type: Number, default: 1, min: 1 },
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
      mealPlan: { type: String, default: "" },

      nights: {
        type: Number,
        default: 0,
      },
    },

    trip: {
      type: draftTripSchema,
      default: null,
    },

    /*
    بيانات النقل.
    */
    transport: {
      type: draftTransportSchema,
      default: null,
    },

    /*
    بيانات التسعير المؤقتة.
    هذه ليست فاتورة نهائية، بل تقدير أثناء المسودة.
    */
    pricing: { type: pricingQuoteSchema, default: () => ({}) },

    /*
    الخطوة الحالية التي وصل إليها المستخدم.
    */
    currentStep: {
  type: String,
  enum: DRAFT_BOOKING_STEPS,
  default: "customer_info",
  index: true,
},

    /*
    حالة المسودة.
    */
    status: {
      type: String,
      enum: DRAFT_BOOKING_STATUS_LIST,
      default: DRAFT_BOOKING_STATUS.DRAFT,
      index: true,
    },

    /*
    الحجز النهائي الناتج من هذه المسودة.
    يتم تعبئته بعد تحويل المسودة إلى Booking.
    */
    finalBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    /*
    تاريخ انتهاء صلاحية المسودة.
    مثال: بعد 24 ساعة أو 48 ساعة.
    */
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    /*
بيانات إضافية مرنة.

تستخدم لحفظ تفاصيل البرنامج المخصص مثل:
- الخدمات المختارة
- المنتجات المختارة
- snapshot كامل للبرنامج المخصص
selectedProducts
payment
customPackageSnapshot
services
*/
data: {
  type: mongoose.Schema.Types.Mixed,
  default: {},
},


    /*
    Soft Delete
    */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

draftBookingSchema.index({
  user: 1,
  isDeleted: 1,
  status: 1,
  createdAt: -1,
});

draftBookingSchema.index({
  status: 1,
  isDeleted: 1,
  expiresAt: 1,
});

const DraftBooking = mongoose.model("DraftBooking", draftBookingSchema);

export default DraftBooking;
