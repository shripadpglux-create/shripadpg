import { Router } from "express";
import { ExpenseController } from "../controllers/expenseController.js";

const router = Router();

router.get("/expenses", ExpenseController.getAll);
router.post("/expenses", ExpenseController.create);
router.put("/expenses/:id", ExpenseController.update);
router.delete("/expenses/:id", ExpenseController.delete);

export default router;
