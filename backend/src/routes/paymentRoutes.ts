import { Router } from "express";
import { PaymentController } from "../controllers/paymentController.js";

const router = Router();

// Payment endpoints mounted under /api/bookings/:id/payments
router.post("/:id/payments", PaymentController.addPayment);
router.put("/:id/payments/:paymentId/verify", PaymentController.verifyPayment);
router.put("/:id/payments/:paymentId/reject", PaymentController.rejectPayment);
router.post("/:id/payments/:paymentId/verify-sms", PaymentController.verifyWithSms);

export default router;
