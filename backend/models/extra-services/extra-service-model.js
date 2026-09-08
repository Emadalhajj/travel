import mongoose from "mongoose";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const extraServiceSchema = mongoose.Schema({
      nameAr: {
      type: String,
      required: true,
      trim: true,
    },

    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
       descriptionAr: {
      type: String,
      trim: true,
    },

    descriptionEn: {
      type: String,
      trim: true,
    },
    category : {
        type : String ,
        enum :[
            "airport_service",
        "insurance",
        "meal",
        "religious_guide",
        "vip_service",
        "sim_card",
        "wheelchair",
        "other",
        ] ,
         default: "other",
    },
    pricing : {
         basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
        currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: DEFAULT_CURRENCY,
      },
    } ,
     images: [
      {
        type: String,
      },
    ],
    isAlwaysAvailable: {
      type: Boolean,
      default: true,
    },
     isActive: {
      type: Boolean,
      default: true,
    },
     isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : "User" ,
    } ,
      createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
}  , {
      timestamps: true,
})
export default mongoose.model("ExtraService" , extraServiceSchema)
