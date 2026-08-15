import { Request, Response } from "express";
import { WhatsAppService } from "../services/whatsappService.js";

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
   * POST /api/whatsapp/webhook
   * Inbound webhook receiver for incoming resident messages / status changes
   */
  public static async handleWebhook(req: Request, res: Response) {
    try {
      const payload = req.body;
      console.log("Inbound WhatsApp Webhook payload:", JSON.stringify(payload).substring(0, 200));

      // Acknowledge webhook immediately
      res.status(200).json({ success: true, received: true });
    } catch (error: any) {
      res.status(200).json({ success: true });
    }
  }
}
