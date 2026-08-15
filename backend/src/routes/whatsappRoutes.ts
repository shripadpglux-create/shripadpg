import { Router } from "express";
import { WhatsAppController } from "../controllers/whatsappController.js";

const router = Router();

router.get("/status", WhatsAppController.getStatus);
router.get("/qr", WhatsAppController.getQRCode);
router.post("/start", WhatsAppController.startSession);
router.post("/send-text", WhatsAppController.sendTextMessage);
router.post("/webhook", WhatsAppController.handleWebhook);

export default router;
