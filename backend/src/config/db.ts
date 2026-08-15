import mongoose from "mongoose";

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

    const conn = await mongoose.connect(finalUri);
    console.log(`🍃 MongoDB Connected to Atlas: ${conn.connection.host} / Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error);
  }
};
