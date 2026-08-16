import fs from "fs";
import path from "path";
import { WhatsAppAuthBackupMongoModel } from "../schemas/mongoSchemas.js";

const LOCAL_BACKUP_FILE = path.join(process.cwd(), "data", "whatsapp_auth_backup.json");

export class WhatsAppAuthBackupModel {
  /**
   * Save / Backup all Baileys auth files (creds.json, keys, etc.) to MongoDB Atlas
   */
  public static async saveAuthBackup(sessionId: string, authFiles: Record<string, string>): Promise<boolean> {
    try {
      const filesCount = Object.keys(authFiles || {}).length;
      if (filesCount === 0) return false;

      // 1. Try persisting to MongoDB Atlas
      try {
        await WhatsAppAuthBackupMongoModel.findOneAndUpdate(
          { sessionId },
          {
            sessionId,
            authFiles,
            filesCount,
            lastSavedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        console.log(`[WhatsApp Auth] Backed up ${filesCount} auth files for session "${sessionId}" to MongoDB Atlas.`);
      } catch (mongoErr: any) {
        console.warn(`[WhatsApp Auth Mongo Warning] Fallback to disk: ${mongoErr.message}`);
      }

      // 2. Also keep local disk copy
      try {
        const dir = path.dirname(LOCAL_BACKUP_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LOCAL_BACKUP_FILE, JSON.stringify({ sessionId, authFiles, lastSavedAt: new Date() }), "utf8");
      } catch {}

      return true;
    } catch (err: any) {
      console.error("[WhatsApp Auth Backup Error]:", err.message);
      return false;
    }
  }

  /**
   * Restore all Baileys auth files for a session from MongoDB Atlas
   */
  public static async restoreAuthBackup(sessionId: string): Promise<Record<string, string> | null> {
    try {
      // 1. Try fetching from MongoDB Atlas
      try {
        const doc = await WhatsAppAuthBackupMongoModel.findOne({ sessionId }).lean() as any;
        if (doc && doc.authFiles && Object.keys(doc.authFiles).length > 0) {
          console.log(`[WhatsApp Auth] Restored ${Object.keys(doc.authFiles).length} auth files for session "${sessionId}" from MongoDB Atlas.`);
          return doc.authFiles;
        }
      } catch (mongoErr: any) {
        console.warn(`[WhatsApp Auth Restore Mongo Warning]: ${mongoErr.message}`);
      }

      // 2. Fallback to local disk file
      if (fs.existsSync(LOCAL_BACKUP_FILE)) {
        const raw = fs.readFileSync(LOCAL_BACKUP_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed.sessionId === sessionId && parsed.authFiles) {
          console.log(`[WhatsApp Auth] Restored ${Object.keys(parsed.authFiles).length} auth files from local disk fallback.`);
          return parsed.authFiles;
        }
      }

      return null;
    } catch (err: any) {
      console.error("[WhatsApp Auth Restore Error]:", err.message);
      return null;
    }
  }
}
