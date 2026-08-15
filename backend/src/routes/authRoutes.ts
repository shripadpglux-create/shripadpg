import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public auth endpoints (no JWT required)
router.post("/admin-login", AuthController.adminLogin);
router.post("/staff-login", AuthController.staffLogin);

// Protected: verify existing session
router.get("/verify", requireAuth, AuthController.verifySession);

export default router;
