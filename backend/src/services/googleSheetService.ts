import { Booking, BookingModel } from "../models/bookingModel.js";
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
  private static autoSyncTimer: NodeJS.Timeout | null = null;

  /**
   * Sync online bookings from the published Google Sheet CSV.
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

      const timeIdx = findIndex(["time", "date", "timestamp"], 0);
      const nameIdx = findIndex(["full name", "applicant name", "name"], 1);
      const emailIdx = findIndex(["email", "mail"], 2);
      const phoneIdx = findIndex(["phone number", "mobile number", "contact number", "phone", "mobile", "contact"], 3);
      const guardianIdx = findIndex(["guardian number", "guardian phone", "parent number", "guardian", "parent"], 4);
      const docIdx = findIndex(["document", "documents", "adhar", "aadhaar", "pan", "photo", "id", "upload", "doc"], 5);

      const formatPhone = (rawPhone?: string): string => {
        if (!rawPhone || rawPhone === "N/A") return rawPhone || "";
        const digits = rawPhone.replace(/\D/g, "");
        if (digits.length === 10) return `+91${digits}`;
        if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
        if (digits.startsWith("0") && digits.length === 11) return `+91${digits.slice(1)}`;
        return rawPhone.startsWith("+") ? rawPhone : (digits ? `+91${digits}` : rawPhone);
      };

      const bookings: Omit<Booking, "id">[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // Skip empty/malformed rows

        const rawName = (row[nameIdx] || "").trim();
        const rawPhone = (row[phoneIdx] || "").trim();
        const timestamp = (row[timeIdx] || "").trim();

        // Skip blank rows or invalid template/test entries
        if (!rawName || rawName === "Anonymous Customer" || rawName.length < 2) continue;
        if (!rawPhone || rawPhone === "N/A" || rawPhone.replace(/\D/g, "").length < 6) continue;
        if (rawName.includes("<script") || timestamp.includes("<script") || rawName.includes("waffle_api")) continue;
        if (/test|dummy|sample/i.test(rawName)) continue;

        const normalizedName = rawName.toUpperCase();
        const normalizedPhone = formatPhone(rawPhone);
        const rawGuardian = (row[guardianIdx] || "").trim();
        const normalizedGuardianPhone = rawGuardian && rawGuardian !== "N/A" ? formatPhone(rawGuardian) : "N/A";
        const email = (row[emailIdx] || "N/A").trim();
        const documents = (row[docIdx] || "Aadhaar Card Uploaded").trim();

        bookings.push({
          timestamp: timestamp || new Date().toISOString().replace("T", " ").substring(0, 19),
          name: normalizedName,
          phone: normalizedPhone,
          guardianPhone: normalizedGuardianPhone,
          email: email || "N/A",
          documents: documents || "Aadhaar Card Uploaded",
          building: "PG ShripadLux-A wing", // Fallback active building
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
   * Start automatic background synchronization loop.
   */
  public static startAutoSync(intervalMinutes: number = 2) {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }

    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
    console.log(`⏱️ Starting Google Sheet background auto-sync every ${intervalMinutes} minute(s)...`);

    // Initial sync after 10 seconds of startup
    setTimeout(async () => {
      try {
        const fetched = await this.fetchOnlineBookings();
        if (fetched.length > 0) {
          const newlyAdded = await BookingModel.addOrUpdateMany(fetched);
          if (newlyAdded.length > 0) {
            console.log(`🎉 [Background Auto-Sync]: Added ${newlyAdded.length} new online bookings from Google Sheet!`);
          }
        }
      } catch (err: any) {
        console.warn("Background auto-sync initial check warning:", err?.message);
      }
    }, 10000);

    this.autoSyncTimer = setInterval(async () => {
      try {
        const fetched = await this.fetchOnlineBookings();
        if (fetched.length > 0) {
          const newlyAdded = await BookingModel.addOrUpdateMany(fetched);
          if (newlyAdded.length > 0) {
            console.log(`🎉 [Background Auto-Sync]: Synchronized ${newlyAdded.length} new online bookings!`);
          }
        }
      } catch (err: any) {
        console.warn("Background auto-sync periodic check warning:", err?.message);
      }
    }, intervalMs);
  }

  /**
   * Generates ready-to-use Google Apps Script code for Google Forms & Google Sheets.
   */
  public static getAppsScriptTemplate(backendWebhookUrl: string): string {
    return `/**
 * Shripad PG — Instant Online Booking Webhook Trigger
 * ----------------------------------------------------
 * Setup Instructions:
 * 1. In your Google Sheet (connected to Google Form), click "Extensions" > "Apps Script".
 * 2. Paste this complete code into Code.gs.
 * 3. Click "Triggers" (alarm clock icon on left) > "Add Trigger".
 * 4. Select:
 *    - Function: "onFormSubmit"
 *    - Event source: "From spreadsheet" (or "From form")
 *    - Event type: "On form submit"
 * 5. Save & Authorize permissions.
 */

const BACKEND_WEBHOOK_URL = "${backendWebhookUrl}";

function onFormSubmit(e) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      namedValues: e && e.namedValues ? e.namedValues : {},
      values: e && e.values ? e.values : []
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(BACKEND_WEBHOOK_URL, options);
    Logger.log("Shripad PG Webhook Response Code: " + response.getResponseCode());
    Logger.log("Shripad PG Webhook Response Body: " + response.getContentText());
  } catch (error) {
    Logger.log("Error posting to Shripad PG Webhook: " + error.toString());
  }
}
`;
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Google Sheet Webhook returned status ${response.status}`);
        return false;
      }
      console.log(`✅ Successfully posted booking for "${booking.name}" to Google Sheet!`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to post booking "${booking.name}" to Google Sheet Webhook:`, error?.message || error);
      return false;
    }
  }

  /**
   * Bulk push multiple bookings to Google Sheet Webhook with parallel batching.
   */
  public static async pushAllBookingsToGoogleSheet(bookings: Booking[], customWebhookUrl?: string): Promise<{ successCount: number; totalCount: number }> {
    let successCount = 0;
    const batchSize = 6; // Push 6 in parallel for lightning speed

    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);
      const results = await Promise.all(batch.map((b) => this.postToGoogleSheet(b, customWebhookUrl)));
      successCount += results.filter(Boolean).length;
    }

    return { successCount, totalCount: bookings.length };
  }
}


