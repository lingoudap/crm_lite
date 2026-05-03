// server/config/db.js
import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

  console.log("🔍 Using MongoDB URI:", uri); // Debug log

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully!");

    // Clean up conflicting indexes from old schema versions
    setTimeout(async () => {
      try {
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");
        
        // Get and drop all problematic indexes
        const indexes = await usersCollection.getIndexes();
        console.log("📋 Existing indexes:", Object.keys(indexes));
        
        // Drop the old username index if it exists
        if (indexes.username_1) {
          await usersCollection.dropIndex("username_1");
          console.log("🧹 Dropped conflicting username_1 index");
        }
        
        // Also drop any other unique indexes that might conflict
        for (const indexName of Object.keys(indexes)) {
          if (indexName !== "_id_" && indexes[indexName].unique) {
            const keyPattern = indexes[indexName].key;
            // Only drop if it's on username field
            if (keyPattern.username) {
              await usersCollection.dropIndex(indexName);
              console.log(`🧹 Dropped conflicting index: ${indexName}`);
            }
          }
        }
      } catch (indexError) {
        console.error("❌ Error cleaning indexes:", indexError.message);
      }
    }, 1000);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
