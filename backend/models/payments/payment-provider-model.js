// import mongoose from "mongoose";

// const paymentProviderSchema = new mongoose.Schema(
//   {
//     code: {
//       type: String,
//       required: true,
//       unique: true,
//       uppercase: true,
//       trim: true,
//     },

//     nameAr: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     nameEn: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     providerType: {
//       type: String,
//       enum: [
//         "HYPERPAY",
//         "MOYASAR",
//         "GEIDEA",
//         "PAYTABS",
//         "TAP",
//         "STRIPE",
//         "CUSTOM",
//       ],
//       required: true,
//     },

//     environment: {
//       type: String,
//       enum: ["test", "live"],
//       default: "test",
//     },

//     supportedMethods: [
//       {
//         type: String,
//         enum: [
//           "SADAD",
//           "CARD",
//           "MADA",
//           "VISA",
//           "MASTERCARD",
//           "APPLE_PAY",
//           "STC_PAY",
//         ],
//       },
//     ],

//     credentials: {
//       entityId: {
//         type: String,
//         default: "",
//       },

//       accessToken: {
//         type: String,
//         default: "",
//       },

//       webhookSecret: {
//         type: String,
//         default: "",
//       },

//       merchantId: {
//         type: String,
//         default: "",
//       },

//       apiKey: {
//         type: String,
//         default: "",
//       },

//       apiSecret: {
//         type: String,
//         default: "",
//       },
//     },

//     configuration: {
//       baseUrl: {
//         type: String,
//         default: "",
//       },

//       callbackUrl: {
//         type: String,
//         default: "",
//       },

//       webhookUrl: {
//         type: String,
//         default: "",
//       },

//       defaultCurrency: {
//         type: String,
//         default: "SAR",
//       },
//     },

//     isDefault: {
//       type: Boolean,
//       default: false,
//     },

//     isActive: {
//       type: Boolean,
//       default: false,
//     },

//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },

//     deletedAt: {
//       type: Date,
//       default: null,
//     },

//     deletedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     updatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// export default mongoose.model(
//   "PaymentProvider",
//   paymentProviderSchema
// ); 