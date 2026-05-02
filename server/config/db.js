// server/config/db.js
import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

  console.log("🔍 Using MongoDB URI:", uri); // Debug log

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
