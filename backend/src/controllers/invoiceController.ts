import { Request, Response } from "express";
import { InvoiceModel } from "../models/invoiceModel.js";
import { BookingModel, PaymentRecord } from "../models/bookingModel.js";
import { WhatsAppService } from "../services/whatsappService.js";

export class InvoiceController {
  /**
   * Get all invoices with optional search, building filter, status filter, and pagination.
   */
  public static async getInvoices(req: Request, res: Response) {
    try {
      let invoices = await InvoiceModel.getAll();

      const { building, status, search, page, limit } = req.query;

      // Optional Building Filter
      if (building && typeof building === "string" && building !== "ALL") {
        invoices = invoices.filter((inv) => inv.building?.toLowerCase() === building.toLowerCase());
      }

      // Optional Status Filter
      if (status && typeof status === "string") {
        invoices = invoices.filter((inv) => inv.status?.toUpperCase() === status.toUpperCase());
      }

      // Optional Search Query
      if (search && typeof search === "string" && search.trim() !== "") {
        const q = search.toLowerCase().trim();
        invoices = invoices.filter((inv) =>
          inv.tenantName?.toLowerCase().includes(q) ||
          inv.invoiceNo?.toLowerCase().includes(q) ||
          inv.contact?.includes(q) ||
          inv.room?.toLowerCase().includes(q)
        );
      }

      const totalCount = invoices.length;

      // Optional Pagination
      if (limit) {
        const pageNum = Math.max(1, parseInt(String(page || "1"), 10));
        const limitNum = Math.max(1, parseInt(String(limit), 10));
        const startIndex = (pageNum - 1) * limitNum;
        invoices = invoices.slice(startIndex, startIndex + limitNum);
      }

      res.json({
        success: true,
        count: invoices.length,
        totalCount,
        invoices,
      });
    } catch (error: any) {
      console.error("Error retrieving invoices:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve invoices.",
        error: error.message,
      });
    }
  }

  /**
   * Get invoice by ID
   */
  public static async getInvoiceById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const invoice = await InvoiceModel.getById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: `Invoice '${id}' not found.`,
        });
      }
      res.json({
        success: true,
        invoice,
      });
    } catch (error: any) {
      console.error("Error retrieving invoice:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve invoice.",
        error: error.message,
      });
    }
  }

  /**
   * Get invoices for a specific resident
   */
  public static async getResidentInvoices(req: Request, res: Response) {
    try {
      const invoices = await InvoiceModel.getByResidentId(req.params.residentId as string);
      res.json({
        success: true,
        count: invoices.length,
        invoices,
      });
    } catch (error: any) {
      console.error("Error retrieving resident invoices:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve resident invoices.",
        error: error.message,
      });
    }
  }

  /**
   * Create or update invoice and sync resident payment history
   */
  public static async createInvoice(req: Request, res: Response) {
    try {
      const invoiceData = req.body;
      const savedInvoice = await InvoiceModel.createOrUpdate(invoiceData);

      // Attempt to sync resident payment history in BookingModel
      let syncedBooking = null;
      const bookings = await BookingModel.getAll();
      const invPhone = (savedInvoice.contact || (savedInvoice as any).phone || "").replace(/\D/g, "");
      const invEmail = (savedInvoice.email || "").toLowerCase().trim();
      const invName = (savedInvoice.tenantName || (savedInvoice as any).residentName || "").toLowerCase().trim();

      const targetBooking = bookings.find((b: any) => {
        // Match by residentId (exact booking ID)
        if (savedInvoice.residentId && (b.id === savedInvoice.residentId || (b as any)._id === savedInvoice.residentId)) return true;
        // Match by customerId
        if (savedInvoice.residentId && b.customerId && b.customerId.toLowerCase() === savedInvoice.residentId.toLowerCase()) return true;
        // Match by phone (normalized digits)
        const bPhone = (b.phone || "").replace(/\D/g, "");
        if (invPhone && bPhone && (bPhone === invPhone || bPhone.endsWith(invPhone) || invPhone.endsWith(bPhone))) return true;
        // Match by email (ignore placeholder emails)
        if (invEmail && invEmail !== "na@gmail.com" && b.email && b.email.toLowerCase().trim() === invEmail) return true;
        // Match by name (case-insensitive)
        if (invName && b.name && b.name.toLowerCase().trim() === invName) return true;
        return false;
      });

      if (targetBooking) {
        const invDate = new Date(savedInvoice.date);
        const paymentRecord: PaymentRecord = {
          id: `pay_inv_${savedInvoice.invoiceNo}_${Date.now()}`,
          month: invDate.getMonth() + 1,
          year: invDate.getFullYear(),
          amount: savedInvoice.paidAmount > 0 ? savedInvoice.paidAmount : savedInvoice.rentAmount,
          transactionId: savedInvoice.invoiceNo,
          invoiceNo: savedInvoice.invoiceNo,
          payerName: savedInvoice.tenantName,
          paymentDate: savedInvoice.date,
          paymentMethod: (savedInvoice.paymentModes[0] || "upi").toLowerCase().includes("cash")
            ? "cash"
            : (savedInvoice.paymentModes[0] || "upi").toLowerCase().includes("bank")
            ? "bank_transfer"
            : "upi",
          submittedAt: new Date().toISOString(),
          status: savedInvoice.status === "PAID" ? "verified" : "submitted",
          autoVerified: true,
        };

        const existingPaymentHistory = targetBooking.paymentHistory || [];
        // Deduplicate payment records by transactionId / invoiceNo
        const updatedPaymentHistory = existingPaymentHistory.filter(
          (p) => p.transactionId !== savedInvoice.invoiceNo
        );
        updatedPaymentHistory.unshift(paymentRecord);

        const updatedBooking = {
          ...targetBooking,
          paymentHistory: updatedPaymentHistory,
          rentAmount: savedInvoice.rentAmount,
          paidAmount: savedInvoice.paidAmount,
          balanceDue: savedInvoice.balanceDue,
          lastPaymentDate: savedInvoice.date,
          paymentStatus: savedInvoice.status,
        };

        syncedBooking = await BookingModel.update(targetBooking.id, updatedBooking);
      }

      // Automated WhatsApp notification with invoice link
      if (savedInvoice && savedInvoice.contact) {
        void WhatsAppService.sendInvoiceNotification({
          customerName: savedInvoice.tenantName || "Resident",
          phone: savedInvoice.contact,
          invoiceNo: savedInvoice.invoiceNo,
          amount: savedInvoice.paidAmount > 0 ? savedInvoice.paidAmount : savedInvoice.rentAmount,
          month: new Date(savedInvoice.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
          room: savedInvoice.room,
          bed: savedInvoice.bed,
          building: savedInvoice.building,
          invoiceLink: `https://shripadpg.pages.dev/invoice?invoiceNo=${savedInvoice.invoiceNo}`,
        }).catch((err) => console.warn("[WhatsApp Auto-Invoice Notice]:", err.message));
      }

      res.status(201).json({
        success: true,
        message: `Invoice ${savedInvoice.invoiceNo} issued and sent on WhatsApp!`,
        invoice: savedInvoice,
        syncedBooking,
      });
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create invoice.",
        error: error.message,
      });
    }
  }

  /**
   * Delete invoice by ID
   */
  public static async deleteInvoice(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const success = await InvoiceModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Invoice '${id}' not found.`,
        });
      }
      res.json({
        success: true,
        message: `Invoice '${id}' deleted successfully.`,
      });
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete invoice.",
        error: error.message,
      });
    }
  }
}
