import axios from "axios";

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
   * Automated Trigger: Send Room Allotment Welcome Message & Credentials
   */
  public static async sendAllotmentMessage(details: ResidentAllotmentDetails): Promise<{ success: boolean; error?: string }> {
    const message = `🏠 *Welcome to Shripad PG!* 🎉
Dear *${details.name}*, your room has been successfully allocated!

🏢 *Building:* ${details.building}
🚪 *Room Number:* ${details.room}
🛏️ *Bed:* ${details.bed}
💰 *Monthly Rent:* ₹${details.rentAmount?.toLocaleString("en-IN") || "0"}

🔐 *Your Resident Login Credentials:*
• *Customer ID / Phone:* \`${details.customerId}\` or \`${details.phone}\`
• *Password:* \`${details.customerPassword}\`

📶 *High-Speed PG Wi-Fi:*
• *SSID:* ShripadPG_HighSpeed
• *Password:* pgwifi@2026

📲 *Resident Portal:*
https://shripadpg.pages.dev/login
Login to view invoices, download payment receipts, and submit service requests.

_Need assistance? Contact our PG Warden / Office directly._`;

    return this.sendTextMessage(details.phone, message);
  }

  /**
   * Automated Trigger: Send Complaint Status Update Notification
   */
  public static async sendComplaintStatusUpdate(details: ComplaintUpdateDetails): Promise<{ success: boolean; error?: string }> {
    const statusEmoji =
      details.status === "resolved"
        ? "✅ *RESOLVED*"
        : details.status === "in_progress"
          ? "🔄 *IN PROGRESS (BEING WORKED ON)*"
          : "⏳ *PENDING REVIEW*";

    const noteText = details.adminComment?.trim() ? `\n\n💬 *Warden / Admin Response:*\n_"${details.adminComment}"_` : "";

    const message = `📢 *Shripad PG — Service Request Update*
Dear *${details.residentName}*,

Regarding your registered service request:
📌 *Issue:* *${details.title}*
🏷️ *Category:* ${details.category.toUpperCase()}
📊 *Current Status:* ${statusEmoji}${noteText}

Track your complaint in real-time on your resident portal:
https://shripadpg.pages.dev/login

_Thank you for your patience!_`;

    return this.sendTextMessage(details.phone, message);
  }

  /**
   * Automated Trigger: Send Rent Payment Verification Receipt
   */
  public static async sendPaymentReceiptNotification(payload: {
    residentName: string;
    phone: string;
    amount: number;
    txnId?: string;
    month?: string;
    date?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const message = `🧾 *Shripad PG — Rent Payment Confirmation*
Dear *${payload.residentName}*,

We have successfully verified your rent payment! 🎉

💰 *Amount Received:* ₹${payload.amount.toLocaleString("en-IN")}
🔢 *Transaction ID:* ${payload.txnId || "Cash / Verified"}
📅 *Payment Date:* ${payload.date || new Date().toLocaleDateString("en-IN")}
📊 *Status:* Official Receipt Generated ✅

You can download your complete PDF tax receipt from your resident portal:
https://shripadpg.pages.dev/login

_Thank you for paying your rent on time!_`;

    return this.sendTextMessage(payload.phone, message);
  }
}
