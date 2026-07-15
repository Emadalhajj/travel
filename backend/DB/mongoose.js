// import mongoose from 'mongoose';
// import dotenv from "dotenv"

// dotenv.config();

// export function connectDB() {
//     try
//     {
//         mongoose.connect(process.env.DB_URL).then(() => {
//         console.log("Connected to MongoDB ✅")
//     }).catch((err) => {
//         console.log("Error connecting to MongoDB ❌", err);
//     })
//     }catch(err){
//         console.log("Error connecting to MongoDB ❌", err);
//     }      
// }

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dropObsoleteBookingIndexes = async () => {
  const bookings = mongoose.connection.collection("bookings");

  try {
    const indexes = await bookings.indexes();
    const hasOldBookingIdIndex = indexes.some(
      (index) => index.name === "bookingId_1",
    );

    if (!hasOldBookingIdIndex) return;

    await bookings.dropIndex("bookingId_1");
    console.log("✅ Dropped obsolete bookings.bookingId_1 index");
  } catch (err) {
    console.warn(
      "⚠️ Could not drop obsolete bookings.bookingId_1 index:",
      err.message,
    );
  }
};

export async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      dbName: process.env.DB_NAME || "umrahDB", // ✅ يحدد اسم القاعدة
      // useNewUrlParser: true,//غير ضروري في Mongoose 6.x وما بعده
      // useUnifiedTopology: true,// غير ضروري في Mongoose 6.x وما بعده
    });
    console.log("✅ Connected to MongoDB Database:", mongoose.connection.name);
    await dropObsoleteBookingIndexes();
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
}
