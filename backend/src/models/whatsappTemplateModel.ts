import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { WhatsAppTemplateMongoModel } from "../schemas/mongoSchemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LocationBranch {
  id: string;
  name: string;
  keyword: string;
  address: string;
  rooms: string;
  rentRange: string;
  amenities: string;
  mapLink: string;
  contactPhone: string;
}

export interface WhatsAppTemplatesConfig {
  invoiceMessage: string;
  complaintUpdateMessage: string;
  paymentConfirmationMessage: string;
  welcomeAllotmentMessage: string;
  chatbotEnabled: boolean;
  chatbotGreetingMessage: string;
  chatbotLocations: LocationBranch[];
  chatbotDefaultReply: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const TEMPLATES_FILE = path.join(DATA_DIR, "whatsapp_templates.json");

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppTemplatesConfig = {
  invoiceMessage: `🧾 *SHRIPAD LUXURY PG - INVOICE NOTIFICATION* 🏢
Dear *{customerName}*,

Here is your accommodation invoice details for *{month}*:
💰 *Amount Due:* ₹{amount}
🚪 *Room / Bed:* Room {room}, Bed {bed}
🏢 *Building:* {building}
📅 *Due Date:* 5th of {month}

📲 *Download / View Official PDF Invoice:*
{invoiceLink}

💳 *Pay Instantly via UPI:*
• UPI ID: \`{upiId}\`
• Account Name: {accountName}

After payment, please send screenshot or submit in the Resident Portal:
https://shripadpg.pages.dev/my-rooms

Thank you for choosing Shripad Luxury Living! ✨`,

  complaintUpdateMessage: `📢 *SHRIPAD PG - SERVICE TICKET UPDATE* 🛠️
Hello *{residentName}*,

Your service request status has been updated:
📌 *Ticket Title:* {complaintTitle}
📂 *Category:* {category}
🔄 *Current Status:* *{status}*
💬 *Admin / Warden Note:* {adminComment}

🏢 *Building:* {building} | *Room:* {room}

We are committed to providing you with a comfortable living experience.
For urgent assistance, please contact PG Warden: {wardenPhone}`,

  paymentConfirmationMessage: `💳 *SHRIPAD PG - PAYMENT CONFIRMATION RECEIPT* ✅
Dear *{customerName}*,

We have received your payment!
💰 *Amount Paid:* ₹{amountPaid}
🧾 *Receipt / Invoice Ref:* {invoiceNo}
🏢 *Building & Room:* {building} - Room {room} (Bed {bed})
📅 *Payment Date:* {paymentDate}
💳 *Mode of Payment:* {paymentMode}

📲 View your updated account ledger & download receipts:
https://shripadpg.pages.dev/my-rooms

Thank you! 🙏`,

  welcomeAllotmentMessage: `🏠 *WELCOME TO SHRIPAD LUXURY PG!* 🎉
Dear *{customerName}*, your room has been successfully allocated!

🏢 *Building:* {building}
🚪 *Room Number:* {room}
🛏️ *Bed:* {bed}
💰 *Monthly Rent:* ₹{rentAmount}

🔐 *Your Resident Portal Login Credentials:*
• *Customer ID / Phone:* \`{customerId}\` or \`{phone}\`
• *Password:* \`{customerPassword}\`

📶 *High-Speed PG Wi-Fi:*
• *SSID:* ShripadPG_HighSpeed
• *Password:* pgwifi@2026

📲 *Resident Portal:*
https://shripadpg.pages.dev/login
Login to view invoices, download payment receipts, and submit service requests.

For any help, contact Manager: {adminPhone}`,

  chatbotEnabled: true,

  chatbotGreetingMessage: `👋 *Hello! Welcome to Shripad Luxury PG!* 🏢✨

We provide premium, fully-furnished PG accommodations with hygienic food, high-speed Wi-Fi, and 24/7 security in Pune.

📍 *Please choose your preferred location:*
{locationsList}

👉 *Reply with the Number or Area Name* (e.g. *1* or *Wakad*) to view room types, rent pricing, amenities, and location map!`,

  chatbotLocations: [
    {
      id: "1",
      name: "Wakad Luxury Branch",
      keyword: "wakad",
      address: "Near Dutta Mandir & Phoenix Mall, Wakad, Pune",
      rooms: "1, 2, 3 Sharing (AC & Non-AC)",
      rentRange: "₹7,000 - ₹12,500 / month",
      amenities: "3-Time Food (Veg/Non-Veg), 200Mbps Wi-Fi, RO Water, Auto Washing Machine, Daily Housekeeping, Biometric Access",
      mapLink: "https://maps.google.com/?q=Wakad+Pune",
      contactPhone: "+91 98765 43210",
    },
    {
      id: "2",
      name: "Chinchwad Central Branch",
      keyword: "chinchwad",
      address: "Near Railway Station & Elpro City Square, Chinchwad, Pune",
      rooms: "1, 2, 3, 4 Sharing Options",
      rentRange: "₹6,000 - ₹10,000 / month",
      amenities: "Pure Veg/Non-Veg Meals, High-Speed Wi-Fi, Geyser, Lift, 24x7 Power Backup, CCTV Security",
      mapLink: "https://maps.google.com/?q=Chinchwad+Pune",
      contactPhone: "+91 98765 43210",
    },
    {
      id: "3",
      name: "Hinjewadi IT Park Branch",
      keyword: "hinjewadi",
      address: "Phase 1, Near Infosys & Wipro Circle, Hinjewadi, Pune",
      rooms: "Single, 2-Sharing, 3-Sharing Deluxe",
      rentRange: "₹7,500 - ₹14,000 / month",
      amenities: "IT-friendly 300Mbps Fiber Wi-Fi, 3 Meals with Weekend Special, Fridge, Gym, 24/7 Hot Water, Dedicated Parking",
      mapLink: "https://maps.google.com/?q=Hinjewadi+Pune",
      contactPhone: "+91 98765 43210",
    },
    {
      id: "4",
      name: "Baner Highstreet Branch",
      keyword: "baner",
      address: "Near Baner High Street, Baner, Pune",
      rooms: "Studio & 2-Sharing Premium",
      rentRange: "₹8,500 - ₹16,000 / month",
      amenities: "Premium Furnished, AC, Smart TV, Food, Daily Housekeeping, Security Guard, Solar Water",
      mapLink: "https://maps.google.com/?q=Baner+Pune",
      contactPhone: "+91 98765 43210",
    },
  ],

  chatbotDefaultReply: `👋 Thank you for reaching out to *Shripad Luxury PG*! 🏢

To explore our branches and available rooms:
👉 Reply with *HII* to view our list of PG locations (Wakad, Chinchwad, Hinjewadi, Baner).
👉 Or call our manager directly at *+91 98765 43210* for immediate booking & visit scheduling!`,
};

export class WhatsAppTemplateModel {
  private static cache: WhatsAppTemplatesConfig | null = null;

  public static async init(): Promise<WhatsAppTemplatesConfig> {
    if (this.cache) return this.cache;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      if (mongoose.connection.readyState === 1) {
        try {
          const doc = await WhatsAppTemplateMongoModel.findOne({ id: "global_whatsapp_templates" }).lean();
          if (doc) {
            this.cache = {
              ...DEFAULT_WHATSAPP_CONFIG,
              ...doc,
              chatbotLocations:
                Array.isArray(doc.chatbotLocations) && doc.chatbotLocations.length > 0
                  ? doc.chatbotLocations
                  : DEFAULT_WHATSAPP_CONFIG.chatbotLocations,
            };
            await fs.writeFile(TEMPLATES_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
            return this.cache as WhatsAppTemplatesConfig;
          }
        } catch (err) {
          console.warn("MongoDB Atlas WhatsApp templates fetch warning:", err);
        }
      }

      try {
        const fileData = await fs.readFile(TEMPLATES_FILE, "utf-8");
        const parsed = JSON.parse(fileData);
        this.cache = { ...DEFAULT_WHATSAPP_CONFIG, ...parsed };
        return this.cache as WhatsAppTemplatesConfig;
      } catch {
        this.cache = { ...DEFAULT_WHATSAPP_CONFIG };
        await fs.writeFile(TEMPLATES_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
        return this.cache as WhatsAppTemplatesConfig;
      }
    } catch {
      this.cache = { ...DEFAULT_WHATSAPP_CONFIG };
      return this.cache as WhatsAppTemplatesConfig;
    }
  }

  public static async getTemplates(): Promise<WhatsAppTemplatesConfig> {
    return await this.init();
  }

  public static async saveTemplates(updated: Partial<WhatsAppTemplatesConfig>): Promise<WhatsAppTemplatesConfig> {
    const current = await this.init();
    const newConfig: WhatsAppTemplatesConfig = {
      ...current,
      ...updated,
      chatbotLocations: updated.chatbotLocations || current.chatbotLocations || DEFAULT_WHATSAPP_CONFIG.chatbotLocations,
    };

    this.cache = newConfig;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(TEMPLATES_FILE, JSON.stringify(newConfig, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Failed to write templates to disk:", fsErr);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await WhatsAppTemplateMongoModel.findOneAndUpdate(
          { id: "global_whatsapp_templates" },
          { $set: newConfig },
          { upsert: true, new: true }
        );
      } catch (mongoErr) {
        console.warn("Failed to save WhatsApp templates to MongoDB Atlas:", mongoErr);
      }
    }

    return newConfig;
  }

  public static async resetTemplates(): Promise<WhatsAppTemplatesConfig> {
    this.cache = { ...DEFAULT_WHATSAPP_CONFIG };
    return await this.saveTemplates(DEFAULT_WHATSAPP_CONFIG);
  }

  /**
   * Helper: Replace template tokens like {customerName}, {amount}, {room}, etc.
   */
  public static interpolate(template: string, vars: Record<string, string | number | undefined>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, value !== undefined && value !== null ? String(value) : "");
    }
    return result;
  }
}
