import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SettingsModel } from "../models/settingsModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export interface SettingsData {
  manualBookingSheetUrl: string;
  onlineBookingSheetUrl: string;
  autoSyncIntervalMinutes?: number;
  lastSyncedAt?: string;
}

const DEFAULT_SETTINGS: SettingsData = {
  manualBookingSheetUrl: process.env.MANUAL_BOOKING_SHEET_URL || "",
  onlineBookingSheetUrl: process.env.GOOGLE_SHEET_CSV_URL || "",
  autoSyncIntervalMinutes: 5,
  lastSyncedAt: new Date().toISOString(),
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

  public static async getPaymentSettings(req: Request, res: Response) {
    try {
      const building = req.query.building ? String(req.query.building).trim() : undefined;
      if (building) {
        const resolved = await SettingsModel.resolvePaymentSettingsForBuilding(building);
        return res.json({ success: true, settings: resolved });
      }
      const settings = await SettingsModel.getPaymentSettings();
      return res.json({ success: true, settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to fetch payment settings.", error: error.message });
    }
  }

  public static async updatePaymentSettings(req: Request, res: Response) {
    try {
      const updated = await SettingsModel.updatePaymentSettings(req.body);
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
