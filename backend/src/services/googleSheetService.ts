import { Booking } from "../models/bookingModel.js";
import { SettingsController } from "../controllers/settingsController.js";

// Basic CSV parser that respects quoted commas
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/);
  return lines
    .map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    })
    .filter((row) => row.length > 0 && row.some((cell) => cell !== ""));
}

export class GoogleSheetService {
  /**
   * Sync online bookings from the published Google Sheet.
   */
  public static async fetchOnlineBookings(overrideUrl?: string): Promise<Omit<Booking, "id">[]> {
    let csvUrl = overrideUrl;
    if (!csvUrl) {
      try {
        const settings = await SettingsController.getSettingsData();
        csvUrl = settings.onlineBookingSheetUrl;
      } catch {
        csvUrl = process.env.GOOGLE_SHEET_CSV_URL;
      }
    }

    const targetUrl = (csvUrl || process.env.GOOGLE_SHEET_CSV_URL || "").trim();
    if (!targetUrl) {
      console.log("ℹ️ No Google Sheet CSV URL configured in Settings. Skipping sheet sync.");
      return [];
    }

    try {
      console.log(`📡 Fetching published Google Sheet CSV from: ${targetUrl}`);
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
      }
      const csvText = await response.text();

      // Guard: If Google returned HTML error page (login redirect / permission error), ignore it!
      if (csvText.includes("<!DOCTYPE") || csvText.includes("<html") || csvText.includes("<script") || csvText.includes("waffle_api")) {
        console.warn("⚠️ Google Sheet URL returned HTML page instead of valid CSV. Skipping sync.");
        return [];
      }

      const rows = parseCSV(csvText);

      if (rows.length <= 1) {
        console.warn("⚠️ Google Sheet fetched successfully, but contains no response rows.");
        return [];
      }

      // Dynamic header mapping
      const headerRow = rows[0].map((h) => h.toLowerCase());
      
      const findIndex = (keywords: string[], fallbackIdx: number) => {
        const idx = headerRow.findIndex((h) => keywords.some((kw) => h.includes(kw)));
        return idx !== -1 ? idx : fallbackIdx;
      };

      const timeIdx = findIndex(["time", "date"], 0);
      const nameIdx = findIndex(["full name", "name"], 1);
      const phoneIdx = findIndex(["phone", "number", "contact", "mobile"], 2);
      const guardianIdx = findIndex(["guardian", "parent"], 3);
      const emailIdx = findIndex(["email", "mail"], 4);
      const docIdx = findIndex(["document", "aadhaar", "id", "upload", "doc"], 5);

      const bookings: Omit<Booking, "id">[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // Skip empty/malformed rows

        const name = row[nameIdx] || "Anonymous Customer";
        const phone = row[phoneIdx] || "N/A";
        const timestamp = row[timeIdx] || "";
        if (name === "Anonymous Customer" && phone === "N/A") continue;
        if (name.includes("<script") || timestamp.includes("<script") || name.includes("waffle_api")) continue;

        bookings.push({
          timestamp: row[timeIdx] || new Date().toISOString().replace("T", " ").substring(0, 19),
          name,
          phone,
          guardianPhone: row[guardianIdx] || "N/A",
          email: row[emailIdx] || "N/A",
          documents: row[docIdx] || "",
          building: "PG A", // Fallback building
          roomType: "Double Sharing", // Fallback room type
          source: "online",
          status: "pending",
        });
      }

      return bookings;
    } catch (error) {
      console.error("❌ Google Sheet CSV fetch failed:", error);
      return [];
    }
  }

  /**
   * Post a booking row to the Google Apps Script Webhook URL.
   */
  public static async postToGoogleSheet(booking: Partial<Booking>, customWebhookUrl?: string): Promise<boolean> {
    const webhookUrl = customWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.trim() === "") {
      console.log("ℹ️ GOOGLE_SHEET_WEBHOOK_URL is not configured. Skipping Google Sheet webhook post.");
      return false;
    }

    try {
      console.log(`📡 Posting booking for "${booking.name}" to Google Sheet webhook: ${webhookUrl}`);
      const payload = {
        timestamp: booking.timestamp || new Date().toISOString().replace("T", " ").substring(0, 19),
        name: booking.name || "",
        phone: booking.phone || "",
        guardianPhone: booking.guardianPhone || "N/A",
        email: booking.email || "N/A",
        documents: booking.documents || "N/A",
        documentData: (booking as any).documentData || undefined,
        documentName: (booking as any).documentName || undefined,
        source: booking.source || "manual",
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`⚠️ Google Sheet Webhook returned status ${response.status}`);
        return false;
      }
      console.log(`✅ Successfully posted booking for "${booking.name}" to Google Sheet!`);
      return true;
    } catch (error) {
      console.error("❌ Failed to post booking to Google Sheet Webhook:", error);
      return false;
    }
  }

  /**
   * Bulk push multiple bookings to Google Sheet Webhook.
   */
  public static async pushAllBookingsToGoogleSheet(bookings: Booking[], customWebhookUrl?: string): Promise<{ successCount: number; totalCount: number }> {
    let successCount = 0;
    for (const b of bookings) {
      const ok = await this.postToGoogleSheet(b, customWebhookUrl);
      if (ok) successCount++;
    }
    return { successCount, totalCount: bookings.length };
  }
}
