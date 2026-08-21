import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { SettingMongoModel } from "../schemas/mongoSchemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BuildingPaymentConfig {
  upiId?: string;
  qrCodeUrl?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountName?: string;
  adminPhone?: string;
  wardenPhone?: string;
}

export interface PaymentSettings {
  upiId: string;
  qrCodeUrl?: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  accountName: string;
  adminPhone?: string;
  wardenPhone?: string;
  dueDay?: number;
  includedAmenities?: string;
  buildingPayments?: Record<string, BuildingPaymentConfig>;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  upiId: "shripadpg@okaxis",
  qrCodeUrl: "",
  bankName: "Axis Bank Ltd",
  accountNo: "924020058192041",
  ifscCode: "UTIB0001824",
  accountName: "Shripad PG Services",
  adminPhone: "+91 98765 43210",
  wardenPhone: "+91 98765 00000",
  dueDay: 5,
  includedAmenities: "Food, Water, Wi-Fi, Laundry",
  buildingPayments: {},
};

export class SettingsModel {
  private static cache: PaymentSettings | null = null;

  private static async init() {
    if (this.cache) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      if (mongoose.connection.readyState === 1) {
        try {
          const doc = await SettingMongoModel.findOne({ id: "global_settings" }).lean();
          if (doc) {
            this.cache = { ...DEFAULT_PAYMENT_SETTINGS, ...doc as any };
            await fs.writeFile(SETTINGS_FILE, JSON.stringify({ payment: this.cache }), "utf-8");
            return;
          }
        } catch (err) {
          console.warn("MongoDB Atlas settings fetch warning:", err);
        }
      }

      try {
        const fileContent = await fs.readFile(SETTINGS_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.cache = { ...DEFAULT_PAYMENT_SETTINGS, ...(parsed.payment || {}) };
      } catch {
        this.cache = { ...DEFAULT_PAYMENT_SETTINGS };
        await this.saveToFile();
      }
    } catch (error) {
      console.error("Failed to initialize Settings database file:", error);
      this.cache = { ...DEFAULT_PAYMENT_SETTINGS };
    }
  }

  private static async saveToFile() {
    try {
      await fs.writeFile(
        SETTINGS_FILE,
        JSON.stringify({ payment: this.cache }),
        "utf-8"
      );
    } catch (error) {
      console.error("Failed to save settings to file:", error);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await SettingMongoModel.findOneAndUpdate(
          { id: "global_settings" },
          { id: "global_settings", ...this.cache },
          { upsert: true }
        );
        console.log("🍃 Synced settings to MongoDB Atlas.");
      } catch (err) {
        console.error("Failed to sync settings to MongoDB Atlas:", err);
      }
    }
  }

  public static async getPaymentSettings(): Promise<PaymentSettings> {
    await this.init();
    return { ...this.cache! };
  }

  public static async resolvePaymentSettingsForBuilding(buildingName?: string): Promise<PaymentSettings> {
    await this.init();
    const globalSettings = { ...this.cache! };
    if (!buildingName || !globalSettings.buildingPayments) {
      return globalSettings;
    }

    const bldNameClean = buildingName.trim().toLowerCase();
    const matchEntry = Object.entries(globalSettings.buildingPayments).find(([k]) => {
      const kClean = k.trim().toLowerCase();
      return kClean === bldNameClean || kClean.includes(bldNameClean) || bldNameClean.includes(kClean);
    });

    if (!matchEntry || !matchEntry[1]) {
      return globalSettings;
    }

    const bldConfig = matchEntry[1];
    return {
      ...globalSettings,
      upiId: bldConfig.upiId || globalSettings.upiId,
      qrCodeUrl: bldConfig.qrCodeUrl !== undefined && bldConfig.qrCodeUrl !== "" ? bldConfig.qrCodeUrl : globalSettings.qrCodeUrl,
      bankName: bldConfig.bankName || globalSettings.bankName,
      accountNo: bldConfig.accountNo || globalSettings.accountNo,
      ifscCode: bldConfig.ifscCode || globalSettings.ifscCode,
      accountName: bldConfig.accountName || globalSettings.accountName,
      adminPhone: bldConfig.adminPhone || globalSettings.adminPhone,
      wardenPhone: bldConfig.wardenPhone || globalSettings.wardenPhone,
    };
  }

  public static async updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
    await this.init();
    this.cache = {
      ...this.cache!,
      ...data,
    };
    await this.saveToFile();
    return { ...this.cache };
  }
}
