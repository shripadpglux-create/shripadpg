import { Router } from "express";
import { SettingsController } from "../controllers/settingsController.js";

const router = Router();

router.get("/", SettingsController.getSettings);
router.post("/", SettingsController.updateSettings);
router.put("/", SettingsController.updateSettings);
router.get("/payment", SettingsController.getPaymentSettings);
router.post("/payment", SettingsController.updatePaymentSettings);
router.put("/payment", SettingsController.updatePaymentSettings);
router.post("/test-url", SettingsController.testSheetUrl);

export default router;
