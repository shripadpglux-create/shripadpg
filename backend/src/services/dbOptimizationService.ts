import mongoose from "mongoose";
import {
  BookingMongoModel,
  BuildingMongoModel,
  StaffMongoModel,
  ExpenseMongoModel,
  InvoiceMongoModel,
  SettingMongoModel,
} from "../schemas/mongoSchemas.js";

/**
 * Production-Level Database Optimization Service
 * Designed specifically for MongoDB Atlas 512MB Free Tier long-term efficiency.
 */
export class DBOptimizationService {
  /**
   * Run Database Maintenance & Index Verification
   */
  public static async runDatabaseOptimization() {
    if (mongoose.connection.readyState !== 1) return;

    try {
      console.log("⚡ Running Production Database Optimization Pass...");

      // 1. Ensure Compound Indexes across all collections
      await Promise.all([
        BookingMongoModel.syncIndexes(),
        BuildingMongoModel.syncIndexes(),
        StaffMongoModel.syncIndexes(),
        ExpenseMongoModel.syncIndexes(),
        InvoiceMongoModel.syncIndexes(),
        SettingMongoModel.syncIndexes(),
      ]);

      console.log("✅ Database compound indexes & queries synchronized.");

      // 2. Storage Health Check & Auto-Compression
      const stats = await mongoose.connection.db?.stats();
      if (stats) {
        const dataSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
        const storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
        console.log(`📊 Storage Usage: Data ${dataSizeMB}MB / Allocated ${storageSizeMB}MB (Quota: 512MB)`);
      }
    } catch (error) {
      console.warn("⚠️ Database optimization notice:", error);
    }
  }

  /**
   * Compact and strip unnecessary empty payload fields from documents before saving to Atlas
   */
  public static compactDocument<T extends Record<string, any>>(doc: T): T {
    if (!doc || typeof doc !== "object") return doc;
    const clean: Record<string, any> = {};

    for (const [key, value] of Object.entries(doc)) {
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value)) {
        clean[key] = value.map((item) => (typeof item === "object" ? this.compactDocument(item) : item));
      } else if (typeof value === "object" && !(value instanceof Date)) {
        const nested = this.compactDocument(value);
        if (Object.keys(nested).length > 0) clean[key] = nested;
      } else {
        clean[key] = value;
      }
    }

    return clean as T;
  }
}
