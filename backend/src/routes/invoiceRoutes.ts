import { Router } from "express";
import { InvoiceController } from "../controllers/invoiceController.js";

const router = Router();

// Route mappings for /api/invoices
router.get("/", InvoiceController.getInvoices);
router.get("/:id", InvoiceController.getInvoiceById);
router.get("/resident/:residentId", InvoiceController.getResidentInvoices);
router.post("/", InvoiceController.createInvoice);
router.delete("/:id", InvoiceController.deleteInvoice);

export default router;
