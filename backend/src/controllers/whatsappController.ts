import { Request, Response } from "express";
import { WhatsAppService } from "../services/whatsappService.js";
import { WhatsAppTemplateModel } from "../models/whatsappTemplateModel.js";

export class WhatsAppController {
  /**
   * GET /api/whatsapp/status
   */
  public static async getStatus(req: Request, res: Response) {
    try {
      const status = await WhatsAppService.getStatus();
      res.json({ success: true, ...status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to get WhatsApp status", error: error.message });
    }
  }

  /**
   * GET /api/whatsapp/qr
   */
  public static async getQRCode(req: Request, res: Response) {
    try {
      const qrData = await WhatsAppService.getQRCode();
      res.json({ success: true, ...qrData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to fetch QR code", error: error.message });
    }
  }

  /**
   * POST /api/whatsapp/start
   */
  public static async startSession(req: Request, res: Response) {
    try {
      const result = await WhatsAppService.startSession();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to start WhatsApp session", error: error.message });
    }
  }

  /**
   * POST /api/whatsapp/send-text
   */
  public static async sendTextMessage(req: Request, res: Response) {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ success: false, message: "Phone number and message text are required." });
      }

      const result = await WhatsAppService.sendTextMessage(phone, message);
      if (result.success) {
        res.json({ success: true, message: "WhatsApp message dispatched successfully.", messageId: result.messageId });
      } else {
        res.status(502).json({ success: false, message: result.error || "Failed to dispatch WhatsApp message." });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error sending WhatsApp message", error: error.message });
    }
  }

  /**
   * GET /api/whatsapp/templates
   * Fetch all editable WhatsApp notification templates & chatbot configuration
   */
  public static async getTemplates(req: Request, res: Response) {
    try {
      const templates = await WhatsAppTemplateModel.getTemplates();
      res.json({ success: true, templates });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to get templates", error: error.message });
    }
  }

  /**
   * PUT /api/whatsapp/templates
   * Update WhatsApp notification templates & chatbot branch configurations
   */
  public static async updateTemplates(req: Request, res: Response) {
    try {
      const updated = req.body;
      const saved = await WhatsAppTemplateModel.saveTemplates(updated);
      res.json({ success: true, message: "WhatsApp templates saved successfully.", templates: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update templates", error: error.message });
    }
  }

  /**
   * POST /api/whatsapp/templates/reset
   * Reset all templates to system defaults
   */
  public static async resetTemplates(req: Request, res: Response) {
    try {
      const reset = await WhatsAppTemplateModel.resetTemplates();
      res.json({ success: true, message: "Templates reset to defaults.", templates: reset });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to reset templates", error: error.message });
    }
  }

  /**
   * POST /api/whatsapp/webhook
   * Inbound webhook receiver for incoming resident messages / location chatbot queries
   */
  public static async handleWebhook(req: Request, res: Response) {
    try {
      const payload = req.body;
      // Immediate 200 OK acknowledgement to OpenWA
      res.status(200).json({ success: true, received: true });

      // Check event and message payload
      const event = payload?.event || payload?.type;
      const data = payload?.data || payload?.payload || payload;

      // Extract message attributes
      const fromMe = data?.fromMe || data?.key?.fromMe || false;
      if (fromMe) return; // Don't reply to bot's own outbound messages

      const sender = data?.from || data?.sender || data?.key?.remoteJid || "";
      const messageBody =
        data?.body ||
        data?.text ||
        data?.message?.conversation ||
        data?.message?.extendedTextMessage?.text ||
        "";

      if (sender && messageBody && typeof messageBody === "string") {
        console.log(`[Chatbot Inbound] From: ${sender} | Message: "${messageBody}"`);
        // Process interactive chatbot menu & location branch details
        void WhatsAppService.handleInboundChatbot(sender, messageBody);
      }
    } catch (error: any) {
      console.warn("Webhook processing notice:", error.message);
    }
  }
}
