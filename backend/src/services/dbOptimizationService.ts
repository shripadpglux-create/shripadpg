import mongoose from "mongoose";
import zlib from "zlib";
import {
  BookingMongoModel,
  BuildingMongoModel,
  StaffMongoModel,
  ExpenseMongoModel,
  InvoiceMongoModel,
  SettingMongoModel,
  WhatsAppTemplateMongoModel,
  WhatsAppAuthBackupMongoModel,
} from "../schemas/mongoSchemas.js";

// Fields to always exclude from compacted documents (Mongoose internals)
const EXCLUDED_COMPACT_KEYS = new Set(["_id", "__v", "createdAt", "updatedAt"]);

/**
 * Production-Level Database Optimization Service
 * Designed specifically for MongoDB Atlas 512MB Free Tier long-term (3-5+ years) efficiency.
 */
export class DBOptimizationService {
  private static lastCompactedAt: Date | null = null;

  /**
   * Run Database Maintenance, Index Pruning & In-Place Document Compaction
   */
  public static async runDatabaseOptimization() {
    if (mongoose.connection.readyState !== 1) return;

    try {
      console.log("⚡ Running Production DevOps Database Optimization Pass...");

      // 1. Synchronize & prune old redundant indexes across all collections
      await Promise.allSettled([
        BookingMongoModel.syncIndexes(),
        BuildingMongoModel.syncIndexes(),
        StaffMongoModel.syncIndexes(),
        ExpenseMongoModel.syncIndexes(),
        InvoiceMongoModel.syncIndexes(),
        SettingMongoModel.syncIndexes(),
        WhatsAppTemplateMongoModel.syncIndexes(),
        WhatsAppAuthBackupMongoModel.syncIndexes(),
      ]);

      console.log("✅ Database compound indexes synchronized & redundant indexes pruned.");

      // 2. In-place compaction of existing records (only once per server lifetime, not every restart)
      if (!this.lastCompactedAt) {
        await this.compactExistingAtlasData();
        this.lastCompactedAt = new Date();
      } else {
        console.log("⏭️ Skipping Atlas compaction — already completed this session.");
      }

      // 3. Storage Health Check & Statistics
      const stats = await mongoose.connection.db?.stats();
      if (stats) {
        const dataSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(3);
        const storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(3);
        const indexSizeMB = (stats.indexSize / (1024 * 1024)).toFixed(3);
        console.log(
          `📊 Optimized Atlas Footprint: Data ${dataSizeMB}MB | Indexes ${indexSizeMB}MB | Allocated ${storageSizeMB}MB (Quota: 512MB)`
        );
      }
    } catch (error) {
      console.warn("⚠️ Database optimization notice:", error);
    }
  }

  /**
   * One-time deep compaction of existing Atlas documents using batched bulkWrite (not N+1 replaceOne)
   */
  public static async compactExistingAtlasData() {
    try {
      // 1. Compact Bookings via single bulkWrite batch
      const bookings = await BookingMongoModel.find({}).lean();
      if (bookings.length > 0) {
        const ops = bookings.map((b: any) => ({
          replaceOne: {
            filter: { _id: b._id },
            replacement: { ...this.compactDocument(b), id: b.id },
          },
        }));
        await BookingMongoModel.bulkWrite(ops);
        console.log(`🗜️ Compacted & purged empty fields for ${bookings.length} bookings in single batch.`);
      }

      // 2. Compact Invoices via single bulkWrite batch
      const invoices = await InvoiceMongoModel.find({}).lean();
      if (invoices.length > 0) {
        const ops = invoices.map((inv: any) => ({
          replaceOne: {
            filter: { _id: inv._id },
            replacement: { ...this.compactDocument(inv), id: inv.id },
          },
        }));
        await InvoiceMongoModel.bulkWrite(ops);
        console.log(`🗜️ Compacted & purged empty fields for ${invoices.length} invoices in single batch.`);
      }

      // 3. Compress Legacy WhatsApp Auth Backups
      const authDocs = await WhatsAppAuthBackupMongoModel.find({ isCompressed: { $ne: true } }).lean();
      for (const authDoc of authDocs as any[]) {
        if (authDoc.authFiles && Object.keys(authDoc.authFiles).length > 0) {
          const rawJson = JSON.stringify(authDoc.authFiles);
          const compressedBuffer = zlib.gzipSync(Buffer.from(rawJson, "utf8"));
          const compressedBase64 = compressedBuffer.toString("base64");

          await WhatsAppAuthBackupMongoModel.updateOne(
            { _id: authDoc._id },
            {
              $set: {
                compressedData: compressedBase64,
                isCompressed: true,
                filesCount: Object.keys(authDoc.authFiles).length,
                lastSavedAt: new Date(),
              },
              $unset: { authFiles: 1 },
            }
          );
          console.log(`🗜️ Converted legacy WhatsApp auth doc (${(rawJson.length / 1024).toFixed(1)}KB) to Gzip compressed format (${(compressedBase64.length / 1024).toFixed(1)}KB)`);
        }
      }
    } catch (err: any) {
      console.warn("⚠️ Atlas compaction pass notice:", err.message);
    }
  }

  /**
   * Compact and strip unnecessary empty payload fields, nulls, empty arrays, and Mongoose internal keys.
   * Excludes _id, __v, createdAt, updatedAt to prevent MongoDB errors when used in $set operations.
   */
  public static compactDocument<T extends Record<string, any>>(doc: T): T {
    if (!doc || typeof doc !== "object") return doc;
    const clean: Record<string, any> = {};

    for (const [key, value] of Object.entries(doc)) {
      // Skip Mongoose internal fields that should never be in $set operations
      if (EXCLUDED_COMPACT_KEYS.has(key)) continue;

      // Omit empty strings, nulls, undefined, and duplicate array aliases
      if (value === null || value === undefined || value === "") continue;
      if (key === "payments" && Array.isArray(value) && value.length === 0) continue;
      if (key === "complaints" && Array.isArray(value) && value.length === 0) continue;

      if (Array.isArray(value)) {
        if (value.length === 0) continue; // Drop empty arrays
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

