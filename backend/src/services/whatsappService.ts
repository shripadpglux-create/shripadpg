import axios from "axios";
import { WhatsAppTemplateModel, LocationBranch } from "../models/whatsappTemplateModel.js";
import { SettingsModel } from "../models/settingsModel.js";

export interface SendWhatsAppTextOptions {
  phone: string;
  message: string;
}

export interface ResidentAllotmentDetails {
  name: string;
  phone: string;
  building: string;
  room: string;
  bed: string;
  customerId: string;
  customerPassword: string;
  rentAmount: number;
  depositAmount?: number;
}

export interface ComplaintUpdateDetails {
  residentName: string;
  phone: string;
  title: string;
  category: string;
  status: "pending" | "in_progress" | "resolved";
  adminComment?: string;
  building?: string;
  room?: string;
}

export interface InvoiceNotificationDetails {
  customerName: string;
  phone: string;
  invoiceNo: string;
  amount: number;
  month: string;
  room: string;
  bed?: string;
  building?: string;
  invoiceLink?: string;
}

export class WhatsAppService {
  private static cachedSessionId: string | null = null;

  private static getApiBaseUrl(): string {
    return (process.env.OPENWA_API_URL || "https://shripad-openwa-gateway.onrender.com").replace(/\/$/, "");
  }

  private static getSessionName(): string {
    return process.env.OPENWA_SESSION_NAME || "shripad-pg";
  }

  private static getApiKey(): string {
    return process.env.OPENWA_API_KEY || "shripad_secure_wa_token_2026";
  }

  private static getHeaders() {
    return {
      "Content-Type": "application/json",
      "X-Api-Key": this.getApiKey(),
      Authorization: `Bearer ${this.getApiKey()}`,
    };
  }

  /**
   * Fetch list of all sessions from OpenWA to find the real session UUID and live state
   */
  public static async getActiveSession(): Promise<{
    id: string;
    name: string;
    status: string;
    phone?: string | null;
    pushName?: string | null;
    connected: boolean;
  } | null> {
    const urlsToTry = [
      this.getApiBaseUrl(),
      "https://shripad-openwa-gateway.onrender.com",
    ];

    // Remove duplicates while preserving order
    const distinctUrls = Array.from(new Set(urlsToTry));

    for (const baseUrl of distinctUrls) {
      try {
        const url = `${baseUrl}/api/sessions`;
        const res = await axios.get(url, {
          headers: this.getHeaders(),
          timeout: 8000,
        });

        let list: any[] = [];
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (res.data && Array.isArray(res.data.sessions)) {
          list = res.data.sessions;
        } else if (res.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        }

        if (list.length === 0) continue;

        const targetName = this.getSessionName();
        // Look for exact session name, or 'shripad-pg', or any session that is ready / has a phone
        const match =
          list.find(s => s.name === targetName || s.name === "shripad-pg" || s.name === "shripad_pg_main") ||
          list.find(s => s.status === "ready" || s.status === "CONNECTED" || !!s.phone) ||
          list[0];

        if (match) {
          this.cachedSessionId = match.id;
          const statusLower = String(match.status || "").toLowerCase();
          const isConnected =
            statusLower === "ready" ||
            statusLower === "connected" ||
            statusLower === "authenticated" ||
            statusLower === "active" ||
            match.connected === true ||
            (match.engineLoaded === true && !!match.phone);

          return {
            id: match.id,
            name: match.name,
            status: match.status || (isConnected ? "ready" : "disconnected"),
            phone: match.phone || null,
            pushName: match.pushName || null,
            connected: isConnected,
          };
        }
      } catch (err: any) {
        console.warn(`[WhatsApp getActiveSession Notice for ${baseUrl}]:`, err?.response?.data || err.message);
      }
    }

    return null;
  }

  /**
   * Normalize an Indian or international phone number to WhatsApp JID format.
   * e.g., "9876543210" -> "919876543210@c.us"
   */
  public static formatPhoneNumber(rawPhone: string | number): string {
    if (!rawPhone) return "";
    const str = String(rawPhone).trim();
    let cleaned = str.split(":")[0].replace(/@.*$/, "").replace(/\D/g, "");

    // If starts with 0 (e.g. 09876543210), trim leading zero
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // If 10 digits (standard Indian mobile number), prepend 91
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }

    return `${cleaned}@c.us`;
  }

  /**
   * Check connection status of the WhatsApp session
   */
  public static async getStatus(): Promise<{
    connected: boolean;
    status: string;
    phone?: string | null;
    pushName?: string | null;
    sessionId?: string;
    openwaUrl?: string;
    details?: any;
  }> {
    try {
      const session = await this.getActiveSession();
      if (!session) {
        return {
          connected: false,
          status: "DISCONNECTED",
          openwaUrl: this.getApiBaseUrl(),
          details: "No active WhatsApp session found in OpenWA",
        };
      }

      return {
        connected: session.connected,
        status: session.connected ? "CONNECTED" : (session.status || "DISCONNECTED").toUpperCase(),
        phone: session.phone,
        pushName: session.pushName,
        sessionId: session.id,
        openwaUrl: this.getApiBaseUrl(),
        details: session,
      };
    } catch (err: any) {
      return {
        connected: false,
        status: "DISCONNECTED",
        openwaUrl: this.getApiBaseUrl(),
        details: err?.message || "OpenWA service unreachable",
      };
    }
  }

  /**
   * Fetch live QR code if session requires authentication
   */
  public static async getQRCode(): Promise<{ qr: string | null; status: string }> {
    try {
      const session = await this.getActiveSession();
      const sessionId = session?.id || this.cachedSessionId || this.getSessionName();

      const url = `${this.getApiBaseUrl()}/api/sessions/${sessionId}/qr`;
      const res = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 5000,
      });

      if (res.data?.qr) {
        return { qr: res.data.qr, status: "SCAN_QR" };
      }
      return { qr: null, status: res.data?.status || "NO_QR_NEEDED" };
    } catch (err: any) {
      return { qr: null, status: "ERROR" };
    }
  }

  /**
   * Start or restart the WhatsApp Baileys session
   */
  public static async startSession(): Promise<{ success: boolean; message: string }> {
    try {
      const session = await this.getActiveSession();
      const sessionId = session?.id || this.cachedSessionId || this.getSessionName();

      const url = `${this.getApiBaseUrl()}/api/sessions/${sessionId}/start`;
      const res = await axios.post(url, {}, { headers: this.getHeaders(), timeout: 8000 });
      return { success: true, message: res.data?.message || "Session started successfully" };
    } catch (err: any) {
      return { success: false, message: err?.response?.data?.message || err?.message || "Failed to start session" };
    }
  }

  /**
   * Send a plain text or emoji-formatted WhatsApp message
   */
  public static async sendTextMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const toJid = this.formatPhoneNumber(phone);
      if (!toJid) {
        return { success: false, error: "Invalid phone number provided." };
      }

      // Resolve the actual session UUID
      const session = await this.getActiveSession();
      const sessionId = session?.id || this.cachedSessionId || this.getSessionName();

      const url = `${this.getApiBaseUrl()}/api/sessions/${sessionId}/messages/send-text`;
      console.log(`[WhatsApp Outbound] Sending to: ${toJid} using session UUID: ${sessionId} -> URL: ${url}`);

      const res = await axios.post(
        url,
        {
          chatId: toJid,
          text: text,
        },
        {
          headers: this.getHeaders(),
          timeout: 15000,
        }
      );

      console.log(`[WhatsApp Outbound] Sent successfully to ${toJid}:`, res.data?.id || res.data?.messageId || "OK");

      return {
        success: true,
        messageId: res.data?.id || res.data?.messageId || "sent",
      };
    } catch (err: any) {
      const errorDetail = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error(`[WhatsApp Outbound Error] Failed to send to ${phone}:`, errorDetail);
      return {
        success: false,
        error: errorDetail,
      };
    }
  }

  /**
   * Automated Trigger: Send Room Allotment Welcome Message & Credentials using Customizable Template
   */
  public static async sendAllotmentMessage(details: ResidentAllotmentDetails): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = await WhatsAppTemplateModel.getTemplates();
      const settings = await SettingsModel.resolvePaymentSettingsForBuilding(details.building);

      const message = WhatsAppTemplateModel.interpolate(templates.welcomeAllotmentMessage, {
        customerName: details.name,
        phone: details.phone,
        building: details.building,
        room: details.room,
        bed: details.bed,
        rentAmount: details.rentAmount?.toLocaleString("en-IN") || "0",
        depositAmount: details.depositAmount?.toLocaleString("en-IN") || "0",
        customerId: details.customerId,
        customerPassword: details.customerPassword,
        adminPhone: settings.adminPhone || "+91 98765 43210",
        wardenPhone: settings.wardenPhone || "+91 98765 00000",
      });

      return this.sendTextMessage(details.phone, message);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Automated Trigger: Send Complaint Status Update Notification using Customizable Template
   */
  public static async sendComplaintStatusUpdate(details: ComplaintUpdateDetails): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = await WhatsAppTemplateModel.getTemplates();
      const settings = await SettingsModel.resolvePaymentSettingsForBuilding(details.building);

      const statusEmoji =
        details.status === "resolved"
          ? "✅ RESOLVED"
          : details.status === "in_progress"
            ? "🔄 IN PROGRESS"
            : "⏳ PENDING REVIEW";

      const message = WhatsAppTemplateModel.interpolate(templates.complaintUpdateMessage, {
        residentName: details.residentName,
        phone: details.phone,
        complaintTitle: details.title,
        category: (details.category || "General").toUpperCase(),
        status: statusEmoji,
        adminComment: details.adminComment?.trim() || "Your request is under review.",
        building: details.building || "Assigned PG",
        room: details.room || "Room Unit",
        wardenPhone: settings.wardenPhone || "+91 98765 00000",
        adminPhone: settings.adminPhone || "+91 98765 43210",
      });

      return this.sendTextMessage(details.phone, message);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Automated Trigger: Send Rent Payment Verification Receipt using Customizable Template
   */
  public static async sendPaymentReceiptNotification(payload: {
    residentName: string;
    phone: string;
    amount: number;
    txnId?: string;
    month?: string;
    date?: string;
    room?: string;
    bed?: string;
    building?: string;
    paymentMode?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = await WhatsAppTemplateModel.getTemplates();

      const cleanRoom = String(payload.room || "-").replace(/^Room\s+/i, "");
      const cleanBed = String(payload.bed || "-").replace(/^Bed\s+/i, "");

      const message = WhatsAppTemplateModel.interpolate(templates.paymentConfirmationMessage, {
        customerName: payload.residentName,
        phone: payload.phone,
        amountPaid: payload.amount.toLocaleString("en-IN"),
        invoiceNo: payload.txnId || "REC-" + Date.now().toString().slice(-6),
        building: payload.building || "Shripad PG",
        room: cleanRoom,
        bed: cleanBed,
        paymentDate: payload.date || new Date().toLocaleDateString("en-IN"),
        paymentMode: (payload.paymentMode || "Online UPI / Verified").toUpperCase(),
      });

      return this.sendTextMessage(payload.phone, message);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Automated Trigger: Send Official PDF Invoice Notification with Link
   */
  public static async sendInvoiceNotification(details: InvoiceNotificationDetails): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = await WhatsAppTemplateModel.getTemplates();
      const settings = await SettingsModel.resolvePaymentSettingsForBuilding(details.building);

      const fallbackLink = `https://shripadpg.pages.dev/my-rooms`;
      const invoiceLink = details.invoiceLink || fallbackLink;
      const cleanRoom = String(details.room || "-").replace(/^Room\s+/i, "");
      const cleanBed = String(details.bed || "A").replace(/^Bed\s+/i, "");

      const message = WhatsAppTemplateModel.interpolate(templates.invoiceMessage, {
        customerName: details.customerName,
        phone: details.phone,
        invoiceNo: details.invoiceNo,
        amount: details.amount.toLocaleString("en-IN"),
        month: details.month || "Current Month",
        room: cleanRoom,
        bed: cleanBed,
        building: details.building || "Shripad PG",
        invoiceLink: invoiceLink,
        upiId: settings.upiId || "shripadpg@okaxis",
        accountName: settings.accountName || "Shripad PG Services",
        bankName: settings.bankName || "Axis Bank Ltd",
        accountNo: settings.accountNo || "924020058192041",
        ifscCode: settings.ifscCode || "UTIB0001824",
      });

      return this.sendTextMessage(details.phone, message);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 🤖 Inbound Webhook Chatbot Engine:
   * Process customer incoming WhatsApp text ("hii", "wakad", "chinchwad", etc.) and auto-reply!
   */
  public static async handleInboundChatbot(senderJid: string, messageBody: string): Promise<void> {
    try {
      console.log(`[Chatbot Inbound Received] JID: ${senderJid} | Body: "${messageBody}"`);
      const templates = await WhatsAppTemplateModel.getTemplates();
      if (!templates.chatbotEnabled) {
        console.log(`[Chatbot Notice] Chatbot is disabled in settings.`);
        return;
      }

      const cleanPhone = senderJid.split(":")[0].replace(/@.*$/, "").replace(/\D/g, "");
      const rawText = (messageBody || "").trim();
      const text = rawText.toLowerCase();
      if (!text || !cleanPhone) return;

      const locations = templates.chatbotLocations || [];

      // Helper function for strict whole-word / exact token matching (prevents "eaddwakadhh" matching "wakad")
      const matchesStrictKeyword = (input: string, keyword: string): boolean => {
        if (!keyword || !input) return false;
        const kw = keyword.trim().toLowerCase();
        const norm = input.trim().toLowerCase();
        if (norm === kw) return true;

        const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
        return regex.test(norm);
      };

      // 1. Check for Strict Greeting Keywords
      const greetingKeywords = ["hi", "hii", "hiii", "hello", "hey", "namaste", "start", "menu", "help", "pg", "rooms", "branch", "branches", "info"];
      const isGreeting = greetingKeywords.some(g => matchesStrictKeyword(text, g));

      if (isGreeting) {
        // Construct Numbered Locations List
        const locationsList = locations
          .map((loc, idx) => `${idx + 1}️⃣ *${loc.name}* (${loc.keyword.toUpperCase()})\n   📍 _${loc.address}_`)
          .join("\n\n");

        const reply = WhatsAppTemplateModel.interpolate(templates.chatbotGreetingMessage, {
          locationsList: locationsList || "1️⃣ Wakad Branch\n2️⃣ Chinchwad Branch\n3️⃣ Hinjewadi Branch\n4️⃣ Baner Branch",
        });

        console.log(`[Chatbot Action] Sending Strict Greeting Menu to ${cleanPhone}`);
        await this.sendTextMessage(cleanPhone, reply);
        return;
      }

      // 2. Check for Specific Location Match (by number or strict keyword)
      let matchedBranch: LocationBranch | undefined;

      // Match by exact single number (e.g. "1", "2")
      const trimmedNum = text.trim();
      const num = parseInt(trimmedNum, 10);
      if (!isNaN(num) && /^\d+$/.test(trimmedNum) && num >= 1 && num <= locations.length) {
        matchedBranch = locations[num - 1];
      }

      // Match by strict whole word (e.g. "wakad", "chinchwad", "hinjewadi", "baner")
      if (!matchedBranch) {
        matchedBranch = locations.find(loc => {
          const kw = (loc.keyword || "").trim();
          const nm = (loc.name || "").trim();
          return (kw && matchesStrictKeyword(text, kw)) || (nm && matchesStrictKeyword(text, nm));
        });
      }

      if (matchedBranch) {
        const branchReply = `🏢 *${matchedBranch.name}* 📍
📌 *Address:* ${matchedBranch.address}

🛏️ *Available Room Sharing:*
${matchedBranch.rooms}

💰 *Monthly Rent Range:*
*${matchedBranch.rentRange}*

✨ *Included Amenities:*
${matchedBranch.amenities}

🗺️ *Google Maps Location Link:*
${matchedBranch.mapLink}

📞 *Branch Manager Contact for Visits:*
*${matchedBranch.contactPhone}*

_To view another location, reply with *HII* or the Area Name._`;

        console.log(`[Chatbot Action] Strict match for branch "${matchedBranch.name}" -> replying to ${cleanPhone}`);
        await this.sendTextMessage(cleanPhone, branchReply);
        return;
      }

      // If no strict keyword or command matched, ignore conversational noise to prevent spamming
      console.log(`[Chatbot Ignored] No strict keyword match for message: "${text}"`);
    } catch (err: any) {
      console.warn("Chatbot auto-reply notice:", err.message);
    }
  }
}
