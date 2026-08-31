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

export async function connectDB() {
  try {
    const maxPoolSize = Math.max(1, Number(process.env.DB_MAX_POOL_SIZE) || 20);
    const minPoolSize = Math.min(
      maxPoolSize,
      Math.max(0, Number(process.env.DB_MIN_POOL_SIZE) || 0),
    );
    await mongoose.connect(process.env.DB_URL, {
      dbName: process.env.DB_NAME || "umrahDB",
      maxPoolSize,
      minPoolSize,
      serverSelectionTimeoutMS: Math.max(
        1000,
        Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      ),
      socketTimeoutMS: Math.max(
        1000,
        Number(process.env.DB_SOCKET_TIMEOUT_MS) || 45000,
      ),
      // useNewUrlParser: true,//غير ضروري في Mongoose 6.x وما بعده
      // useUnifiedTopology: true,// غير ضروري في Mongoose 6.x وما بعده
    });
    console.log("✅ Connected to MongoDB Database:", mongoose.connection.name);
    return mongoose.connection;
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    throw err;
  }
}
