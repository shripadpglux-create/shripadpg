import { Router } from "express";
import { StaffController } from "../controllers/staffController.js";

const router = Router();

router.get("/staff", StaffController.getAll);
router.post("/staff", StaffController.create);
router.post("/staff/login", StaffController.login);
router.put("/staff/:id", StaffController.update);
router.delete("/staff/:id", StaffController.delete);

export default router;
