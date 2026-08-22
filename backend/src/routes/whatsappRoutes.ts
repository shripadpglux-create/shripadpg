import { Router } from "express";
import { WhatsAppController } from "../controllers/whatsappController.js";

const router = Router();

router.get("/status", WhatsAppController.getStatus);
router.get("/qr", WhatsAppController.getQRCode);
router.post("/start", WhatsAppController.startSession);
router.post("/send-text", WhatsAppController.sendTextMessage);
router.post("/webhook", WhatsAppController.handleWebhook);

// Template & Location Chatbot Routes
router.get("/templates", WhatsAppController.getTemplates);
router.put("/templates", WhatsAppController.updateTemplates);
router.post("/templates/reset", WhatsAppController.resetTemplates);

// Automated Rent Due Reminders & Cycle Scheduler Routes
router.get("/reminders/preview", WhatsAppController.getReminderPreview);
router.post("/reminders/send-daily", WhatsAppController.sendDailyReminders);
router.post("/reminders/send-single/:bookingId", WhatsAppController.sendSingleReminder);

// Multi-Device Baileys Persistent Auth State Backup & Restore (MongoDB Atlas)
router.post("/auth/backup", WhatsAppController.backupAuth);
router.get("/auth/restore/:sessionId", WhatsAppController.restoreAuth);

export default router;
