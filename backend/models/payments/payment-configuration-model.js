// /*
// ربط طرق الدفع بالأقسام والمنتجات

// هذا هو الجزء الأهم.
// Visa
// Hotel
// Transport
// UmrahProgram
// Ticket

// */

// import mongoose from "mongoose";

// const paymentMethodAssignmentSchema =
//   new mongoose.Schema(
//     {
//       method: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "PaymentMethod",
//         required: true,
//       },

//       methodCode: {
//         type: String,
//         required: true,
//         uppercase: true,
//         trim: true,
//       },

//       isEnabled: {
//         type: Boolean,
//         default: true,
//       },

//       bankAccounts: [
//         {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "BankAccount",
//         },
//       ],

//       paymentProvider: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "PaymentProvider",
//         default: null,
//       },

//       allowPartialPayment: {
//         type: Boolean,
//         default: false,
//       },

//       minimumPaymentAmount: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },

//       minimumPaymentPercentage: {
//         type: Number,
//         default: 0,
//         min: 0,
//         max: 100,
//       },

//       instructionsAr: {
//         type: String,
//         default: "",
//         trim: true,
//       },

//       instructionsEn: {
//         type: String,
//         default: "",
//         trim: true,
//       },

//       sortOrder: {
//         type: Number,
//         default: 0,
//       },
//     },
//     {
//       _id: false,
//     }
//   );

// const paymentConfigurationSchema =
//   new mongoose.Schema(
//     {
//       scopeType: {
//         type: String,
//         enum: ["section", "product"],
//         required: true,
//       },

//       sectionType: {
//         type: String,
//         enum: [
//           "visa",
//           "ticket",
//           "umrah_program",
//           "transport",
//           "hotel",
//           "custom_package",
//         ],
//         required: true,
//       },

//       productModel: {
//         type: String,
//         enum: [
//           "Visa",
//           "Ticket",
//           "UmrahProgram",
//           "Transport",
//           "Hotel",
//           "RoomType",
//         ],
//         default: null,
//       },

//       productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         refPath: "productModel",
//         default: null,
//       },

//       inheritFromSection: {
//         type: Boolean,
//         default: true,
//       },

//       methods: {
//         type: [paymentMethodAssignmentSchema],
//         default: [],
//       },

//       isActive: {
//         type: Boolean,
//         default: true,
//       },

//       isDeleted: {
//         type: Boolean,
//         default: false,
//       },

//       deletedAt: {
//         type: Date,
//         default: null,
//       },

//       deletedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         default: null,
//       },

//       createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },

//       updatedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         default: null,
//       },
//     },
//     {
//       timestamps: true,
//     }
//   );

// paymentConfigurationSchema.index(
//   {
//     scopeType: 1,
//     sectionType: 1,
//     productModel: 1,
//     productId: 1,
//     isDeleted: 1,
//   },
//   {
//     unique: true,
//   }
// );

// export default mongoose.model(
//   "PaymentConfiguration",
//   paymentConfigurationSchema
// );