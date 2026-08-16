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
  private static getApiBaseUrl(): string {
    return (process.env.OPENWA_API_URL || "http://localhost:2886").replace(/\/$/, "");
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
   * Normalize an Indian or international phone number to WhatsApp JID format.
   * e.g., "9876543210" -> "919876543210@s.whatsapp.net"
   */
  public static formatPhoneNumber(rawPhone: string): string {
    if (!rawPhone) return "";
    let cleaned = rawPhone.replace(/\D/g, "");

    // If starts with 0 (e.g. 09876543210), trim leading zero
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // If 10 digits (standard Indian mobile number), prepend 91
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }

    return `${cleaned}@s.whatsapp.net`;
  }

  /**
   * Check connection status of the WhatsApp session
   */
  public static async getStatus(): Promise<{
    connected: boolean;
    status: string;
    qrCode?: string;
    details?: any;
  }> {
    try {
      const url = `${this.getApiBaseUrl()}/api/sessions/${this.getSessionName()}/status`;
      const res = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 4000,
      });

      const data = res.data;
      const isConnected =
        data?.status === "CONNECTED" ||
        data?.status === "ready" ||
        data?.status === "authenticated" ||
        data?.connected === true;

      return {
        connected: isConnected,
        status: data?.status || (isConnected ? "CONNECTED" : "DISCONNECTED"),
        details: data,
      };
    } catch (err: any) {
      return {
        connected: false,
        status: "DISCONNECTED",
        details: err?.message || "OpenWA service unreachable",
      };
    }
  }

  /**
   * Fetch live QR code if session requires authentication
   */
  public static async getQRCode(): Promise<{ qr: string | null; status: string }> {
    try {
      const url = `${this.getApiBaseUrl()}/api/sessions/${this.getSessionName()}/qr`;
      const res = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 4000,
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
      const url = `${this.getApiBaseUrl()}/api/sessions/${this.getSessionName()}/start`;
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

      const url = `${this.getApiBaseUrl()}/api/sessions/${this.getSessionName()}/messages/send-text`;
      const res = await axios.post(
        url,
        {
          to: toJid,
          text: text,
        },
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      return {
        success: true,
        messageId: res.data?.id || res.data?.messageId || "sent",
      };
    } catch (err: any) {
      console.warn("WhatsApp dispatch notice:", err?.response?.data || err?.message);
      return {
        success: false,
        error: err?.response?.data?.message || err?.message || "OpenWA dispatch failed",
      };
    }
  }

  /**
   * Automated Trigger: Send Room Allotment Welcome Message & Credentials using Customizable Template
   */
  public static async sendAllotmentMessage(details: ResidentAllotmentDetails): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = await WhatsAppTemplateModel.getTemplates();
      const settings = await SettingsModel.getPaymentSettings();

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
      const settings = await SettingsModel.getPaymentSettings();

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

      const message = WhatsAppTemplateModel.interpolate(templates.paymentConfirmationMessage, {
        customerName: payload.residentName,
        phone: payload.phone,
        amountPaid: payload.amount.toLocaleString("en-IN"),
        invoiceNo: payload.txnId || "REC-" + Date.now().toString().slice(-6),
        building: payload.building || "Shripad PG",
        room: payload.room || "-",
        bed: payload.bed || "-",
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
      const settings = await SettingsModel.getPaymentSettings();

      const fallbackLink = `https://shripadpg.pages.dev/my-rooms`;
      const invoiceLink = details.invoiceLink || fallbackLink;

      const message = WhatsAppTemplateModel.interpolate(templates.invoiceMessage, {
        customerName: details.customerName,
        phone: details.phone,
        invoiceNo: details.invoiceNo,
        amount: details.amount.toLocaleString("en-IN"),
        month: details.month || "Current Month",
        room: details.room || "-",
        bed: details.bed || "A",
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
      const templates = await WhatsAppTemplateModel.getTemplates();
      if (!templates.chatbotEnabled) return;

      const cleanPhone = senderJid.replace(/@.*$/, "");
      const text = (messageBody || "").trim().toLowerCase();
      if (!text) return;

      const locations = templates.chatbotLocations || [];

      // 1. Check for Greeting Keywords
      const greetingKeywords = ["hi", "hii", "hiii", "hello", "hey", "namaste", "start", "menu", "help", "pg", "rooms", "branch", "branches", "info"];
      const isGreeting = greetingKeywords.some(g => text === g || text.startsWith(g + " "));

      if (isGreeting) {
        // Construct Numbered Locations List
        const locationsList = locations
          .map((loc, idx) => `${idx + 1}️⃣ *${loc.name}* (${loc.keyword.toUpperCase()})\n   📍 _${loc.address}_`)
          .join("\n\n");

        const reply = WhatsAppTemplateModel.interpolate(templates.chatbotGreetingMessage, {
          locationsList: locationsList || "1️⃣ Wakad Branch\n2️⃣ Chinchwad Branch\n3️⃣ Hinjewadi Branch\n4️⃣ Baner Branch",
        });

        await this.sendTextMessage(cleanPhone, reply);
        return;
      }

      // 2. Check for Specific Location Match (by number or keyword)
      let matchedBranch: LocationBranch | undefined;

      // Match by number (e.g. "1", "2")
      const num = parseInt(text, 10);
      if (!isNaN(num) && num >= 1 && num <= locations.length) {
        matchedBranch = locations[num - 1];
      }

      // Match by keyword in text (e.g. "wakad", "chinchwad", "hinjewadi", "baner")
      if (!matchedBranch) {
        matchedBranch = locations.find(loc => {
          const kw = (loc.keyword || "").toLowerCase();
          const nm = (loc.name || "").toLowerCase();
          return text.includes(kw) || text.includes(nm);
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

        await this.sendTextMessage(cleanPhone, branchReply);
        return;
      }

      // 3. Fallback Reply for general queries
      const defaultReply = templates.chatbotDefaultReply || `👋 Thank you for reaching out to *Shripad Luxury PG*! 🏢\n\nReply with *HII* to view all PG branches and pricing, or call *+91 98765 43210*.`;
      await this.sendTextMessage(cleanPhone, defaultReply);
    } catch (err: any) {
      console.warn("Chatbot auto-reply notice:", err.message);
    }
  }
}
