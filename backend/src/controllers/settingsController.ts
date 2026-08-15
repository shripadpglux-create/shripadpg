import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const PAYMENT_SETTINGS_FILE = path.join(DATA_DIR, "payment_settings.json");

export interface SettingsData {
  manualBookingSheetUrl: string;
  onlineBookingSheetUrl: string;
  autoSyncIntervalMinutes?: number;
  lastSyncedAt?: string;
}

export interface PaymentSettingsData {
  upiId: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  qrCodeUrl: string;
  monthlyRentAmount: number;
  securityDepositAmount: number;
  includedAmenities: string;
}

const DEFAULT_SETTINGS: SettingsData = {
  manualBookingSheetUrl: process.env.MANUAL_BOOKING_SHEET_URL || "",
  onlineBookingSheetUrl: process.env.GOOGLE_SHEET_CSV_URL || "",
  autoSyncIntervalMinutes: 5,
  lastSyncedAt: new Date().toISOString(),
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsData = {
  upiId: "shripadpg@ybl",
  accountHolder: "Shripad PG Luxuries",
  accountNumber: "918237465012",
  ifscCode: "HDFC0001234",
  bankName: "HDFC Bank",
  qrCodeUrl: "",
  monthlyRentAmount: 6500,
  securityDepositAmount: 5000,
  includedAmenities: "Food, Water, Wi-Fi, Laundry",
};

export class SettingsController {
  public static async getSettingsData(): Promise<SettingsData> {
    try {
      await fs.access(SETTINGS_FILE);
      const content = await fs.readFile(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    } catch {
      // If settings file doesn't exist, create it with defaults
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to write default settings.json:", err);
      }
      return DEFAULT_SETTINGS;
    }
  }

  public static async getSettings(_req: Request, res: Response) {
    try {
      const settings = await SettingsController.getSettingsData();
      res.json({ success: true, settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to fetch settings.", error: error.message });
    }
  }

  public static async updateSettings(req: Request, res: Response) {
    try {
      const current = await SettingsController.getSettingsData();
      const { manualBookingSheetUrl, onlineBookingSheetUrl, autoSyncIntervalMinutes } = req.body;

      const updated: SettingsData = {
        ...current,
        manualBookingSheetUrl:
          manualBookingSheetUrl !== undefined
            ? String(manualBookingSheetUrl).trim()
            : current.manualBookingSheetUrl,
        onlineBookingSheetUrl:
          onlineBookingSheetUrl !== undefined
            ? String(onlineBookingSheetUrl).trim()
            : current.onlineBookingSheetUrl,
        autoSyncIntervalMinutes:
          autoSyncIntervalMinutes !== undefined
            ? Number(autoSyncIntervalMinutes)
            : current.autoSyncIntervalMinutes,
        lastSyncedAt: new Date().toISOString(),
      };

      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");

      res.json({
        success: true,
        message: "Google Sheet integration settings saved successfully!",
        settings: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update settings.", error: error.message });
    }
  }

  public static async testSheetUrl(req: Request, res: Response) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        return res.status(400).json({ success: false, message: "Please provide a valid HTTP/HTTPS URL." });
      }

      console.log(`📡 Testing Google Sheet URL: ${url}`);
      const response = await fetch(url, { method: "GET", headers: { "User-Agent": "ShripadPG-Server/1.0" } });

      if (!response.ok) {
        return res.status(400).json({
          success: false,
          message: `Connection failed with HTTP status ${response.status} (${response.statusText}). Make sure sheet is published as CSV or URL is publicly accessible.`,
        });
      }

      const text = await response.text();
      const linesCount = text.split("\n").filter((l) => l.trim().length > 0).length;

      res.json({
        success: true,
        message: `Successfully connected to Google Sheet! (${linesCount} lines retrieved)`,
        linesCount,
        preview: text.substring(0, 300),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `Network error reaching URL: ${error.message}`,
        error: error.message,
      });
    }
  }

  public static async getPaymentSettings(_req: Request, res: Response) {
    try {
      try {
        await fs.access(PAYMENT_SETTINGS_FILE);
        const content = await fs.readFile(PAYMENT_SETTINGS_FILE, "utf-8");
        const parsed = JSON.parse(content);
        return res.json({ success: true, settings: { ...DEFAULT_PAYMENT_SETTINGS, ...parsed } });
      } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(PAYMENT_SETTINGS_FILE, JSON.stringify(DEFAULT_PAYMENT_SETTINGS, null, 2), "utf-8");
        return res.json({ success: true, settings: DEFAULT_PAYMENT_SETTINGS });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to fetch payment settings.", error: error.message });
    }
  }

  public static async updatePaymentSettings(req: Request, res: Response) {
    try {
      let current = DEFAULT_PAYMENT_SETTINGS;
      try {
        const content = await fs.readFile(PAYMENT_SETTINGS_FILE, "utf-8");
        current = { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(content) };
      } catch {}

      const updated: PaymentSettingsData = {
        ...current,
        ...req.body,
      };

      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(PAYMENT_SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");

      res.json({
        success: true,
        message: "Payment settings updated successfully!",
        settings: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update payment settings.", error: error.message });
    }
  }
}
