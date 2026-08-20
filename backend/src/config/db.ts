import mongoose from "mongoose";
import { DBOptimizationService } from "../services/dbOptimizationService.js";

let isReconnecting = false;

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
      maxPoolSize: 5,  // M0 free tier supports ~3-5 active connections max
      minPoolSize: 1,  // Single warm connection to reduce idle resource usage
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 for fast, reliable DNS lookups on cloud hosting
      compressors: ["zlib"], // Wire-level network compression (cuts payload size by 65-75%)
      zlibCompressionLevel: 6,
    });
    console.log(`🍃 MongoDB Connected to Atlas: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Trigger Production Database Optimization & Compound Index Synchronization
    await DBOptimizationService.runDatabaseOptimization();
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error);
  }
};

// Auto-reconnect on Atlas disconnection (common on M0 free tier)
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Atlas disconnected. Attempting auto-reconnect in 5s...");
  if (!isReconnecting) {
    isReconnecting = true;
    setTimeout(async () => {
      try {
        await connectDB();
        isReconnecting = false;
      } catch (err) {
        console.error("❌ Auto-reconnect failed:", err);
        isReconnecting = false;
      }
    }, 5000);
  }
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error event:", err.message);
});
