import mongoose from "mongoose";
import { DBOptimizationService } from "../services/dbOptimizationService.js";

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      console.warn("⚠️ MONGODB_URI not set in environment.");
      return;
    }

    // Target the shripad_pg database in MongoDB Atlas
    let finalUri = connUri;
    if (!finalUri.includes("shripad_pg")) {
      if (finalUri.includes("?")) {
        finalUri = finalUri.replace("/?", "/shripad_pg?");
      } else {
        finalUri = `${finalUri.replace(/\/$/, "")}/shripad_pg`;
      }
    }

    const conn = await mongoose.connect(finalUri, {
      maxPoolSize: 15, // Optimal connection pool size for MongoDB Atlas M0 free tier
      minPoolSize: 2,  // Keep warm connections ready for low-latency queries
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 for fast, reliable DNS lookups on cloud hosting
    });
    console.log(`🍃 MongoDB Connected to Atlas: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Trigger Production Database Optimization & Compound Index Synchronization
    await DBOptimizationService.runDatabaseOptimization();
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error);
  }
};
