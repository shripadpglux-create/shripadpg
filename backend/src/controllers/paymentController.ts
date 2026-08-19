import { Request, Response } from "express";
import { BookingModel } from "../models/bookingModel.js";
import { InvoiceModel } from "../models/invoiceModel.js";
import { SmsParserService } from "../services/smsParserService.js";
import { WhatsAppService } from "../services/whatsappService.js";

export class PaymentController {
  /**
   * Submit payment proof for a resident booking.
   */
  public static async addPayment(req: Request, res: Response) {
    try {
      const bookingId = req.params.id as string;
      const {
        month,
        year,
        amount,
        transactionId,
        payerName,
        paymentDate,
        paymentMethod,
        bankSmsText,
      } = req.body;

      const effectiveTxnId = (transactionId && String(transactionId).trim())
        ? String(transactionId).trim()
        : (paymentMethod === "cash" ? `CASH-${Date.now().toString().slice(-6)}` : `MANUAL-${Date.now().toString().slice(-6)}`);

      if (!bookingId || !amount) {
        return res.status(400).json({
          success: false,
          message: "Booking ID and amount are required fields.",
        });
      }

      let status: "submitted" | "verified" | "rejected" = "submitted";
      let autoVerified = false;
      let smsMatchResult = null;

      if (bankSmsText && typeof bankSmsText === "string" && bankSmsText.trim()) {
        smsMatchResult = SmsParserService.verifyPaymentWithSms(
          Number(amount),
          effectiveTxnId,
          bankSmsText
        );

        if (smsMatchResult.isMatch) {
          status = "verified";
          autoVerified = true;
        }
      }

      // If recorded by admin from dashboard, mark as verified
      if (req.body.verified === true || req.body.status === "verified") {
        status = "verified";
      }

      const result = await BookingModel.addPayment(bookingId, {
        month: Number(month) || new Date().getMonth() + 1,
        year: Number(year) || new Date().getFullYear(),
        amount: Number(amount),
        transactionId: effectiveTxnId,
        payerName,
        paymentDate: paymentDate || new Date().toISOString().substring(0, 10),
        paymentMethod: paymentMethod || "upi",
        bankSmsText,
        autoVerified,
        status,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Resident booking with ID '${bookingId}' was not found.`,
        });
      }

      // Automated WhatsApp dispatch for rent receipt notification
      const residentPhone = result.booking.phone || "";
      if (residentPhone) {
        const mName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(result.payment.month || 1) - 1];
        void WhatsAppService.sendPaymentReceiptNotification({
          residentName: result.booking.name || payerName || "Resident",
          phone: residentPhone,
          amount: result.payment.amount,
          txnId: result.payment.transactionId,
          month: `${mName} ${result.payment.year}`,
          date: result.payment.paymentDate,
          room: result.booking.allocatedRoom ? `Room ${result.booking.allocatedRoom}` : "Room 101",
          bed: result.booking.allocatedBed || "Bed A",
          building: result.booking.allocatedBuilding || result.booking.building || "Shripad PG",
          paymentMode: result.payment.paymentMethod,
        }).catch((err) => console.warn("[WhatsApp Auto-Receipt Notice]:", err.message));
      }

      res.status(201).json({
        success: true,
        message: autoVerified || status === "verified"
          ? "🎉 Payment submitted, verified & WhatsApp receipt sent!"
          : "Payment request submitted. Pending admin verification.",
        payment: result.payment,
        booking: result.booking,
        smsMatchResult,
      });
    } catch (error: any) {
      console.error("Error adding payment record:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit payment record.",
        error: error.message,
      });
    }
  }

  /**
   * Manually verify a payment record & automatically raise invoice & dispatch WhatsApp.
   */
  public static async verifyPayment(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const paymentId = req.params.paymentId as string;
      const { verifiedBy, raiseInvoice } = req.body;

      const updatedBooking = await BookingModel.updatePaymentStatus(
        id,
        paymentId,
        "verified",
        {
          verifiedBy: verifiedBy || "Admin",
          autoVerified: false,
        }
      );

      if (!updatedBooking) {
        return res.status(404).json({
          success: false,
          message: "Booking or payment record not found.",
        });
      }

      const paymentRecord = updatedBooking.paymentHistory?.find((p) => p.id === paymentId);
      const invNo = paymentRecord?.transactionId && paymentRecord.transactionId.startsWith("INV-")
        ? paymentRecord.transactionId
        : `INV-${Math.floor(100000 + Math.random() * 900000)}`;

      let createdInvoice = null;
      if (raiseInvoice !== false) {
        createdInvoice = await InvoiceModel.createOrUpdate({
          invoiceNo: invNo,
          residentId: updatedBooking.id,
          tenantName: updatedBooking.name,
          contact: updatedBooking.phone,
          email: updatedBooking.email,
          building: updatedBooking.allocatedBuilding || updatedBooking.building || "PG A - Main Branch",
          floor: `Floor ${updatedBooking.allocatedFloor || 1}`,
          room: updatedBooking.allocatedRoom ? `Room ${updatedBooking.allocatedRoom}` : "Room 101",
          bed: updatedBooking.allocatedBed || "Bed A",
          date: paymentRecord?.paymentDate || new Date().toISOString().substring(0, 10),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          rentAmount: updatedBooking.rentAmount || paymentRecord?.amount || 0,
          paidAmount: paymentRecord?.amount || updatedBooking.rentAmount || 0,
          balanceDue: 0,
          paymentModes: [(paymentRecord?.paymentMethod || "UPI").toUpperCase()],
          notes: "Monthly PG rent payment for comfortable living space including Wi-Fi, 3-time meals, and maintenance charges.",
          status: "PAID",
        });

        // Store official invoiceNo in the payment record
        if (createdInvoice && updatedBooking.paymentHistory) {
          const pIdx = updatedBooking.paymentHistory.findIndex((p) => p.id === paymentId);
          if (pIdx !== -1) {
            updatedBooking.paymentHistory[pIdx].invoiceNo = createdInvoice.invoiceNo;
            await BookingModel.update(updatedBooking.id, updatedBooking);
          }
        }
      }

      // Automated WhatsApp notification on payment verification
      if (paymentRecord && updatedBooking.phone) {
        const mName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(paymentRecord.month || 1) - 1];
        void WhatsAppService.sendPaymentReceiptNotification({
          residentName: updatedBooking.name || paymentRecord.payerName || "Resident",
          phone: updatedBooking.phone,
          amount: paymentRecord.amount,
          txnId: paymentRecord.transactionId,
          month: `${mName} ${paymentRecord.year}`,
          date: paymentRecord.paymentDate,
          room: updatedBooking.allocatedRoom ? `Room ${updatedBooking.allocatedRoom}` : "Room 101",
          bed: updatedBooking.allocatedBed || "Bed A",
          building: updatedBooking.allocatedBuilding || updatedBooking.building || "Shripad PG",
          paymentMode: paymentRecord.paymentMethod,
        }).catch((err) => console.warn("[WhatsApp Auto-Receipt Notice]:", err.message));
      }

      res.json({
        success: true,
        message: "Payment verified successfully and official invoice raised & sent on WhatsApp!",
        booking: updatedBooking,
        invoice: createdInvoice,
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify payment.",
        error: error.message,
      });
    }
  }

  /**
   * Reject a payment record.
   */
  public static async rejectPayment(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const paymentId = req.params.paymentId as string;
      const { rejectedReason } = req.body;

      const updatedBooking = await BookingModel.updatePaymentStatus(
        id,
        paymentId,
        "rejected",
        {
          rejectedReason: rejectedReason || "Transaction details mismatch",
        }
      );

      if (!updatedBooking) {
        return res.status(404).json({
          success: false,
          message: "Booking or payment record not found.",
        });
      }

      res.json({
        success: true,
        message: "Payment request rejected.",
        booking: updatedBooking,
      });
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject payment.",
        error: error.message,
      });
    }
  }

  /**
   * Auto-verify a pending payment by pasting Bank SMS text.
   */
  public static async verifyWithSms(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const paymentId = req.params.paymentId as string;
      const { bankSmsText } = req.body;

      if (!bankSmsText || typeof bankSmsText !== "string") {
        return res.status(400).json({
          success: false,
          message: "bankSmsText is required for SMS verification.",
        });
      }

      const bookings = await BookingModel.getAll();
      const booking = bookings.find((b) => b.id === id);
      const payment = booking?.paymentHistory?.find((p) => p.id === paymentId);

      if (!booking || !payment) {
        return res.status(404).json({
          success: false,
          message: "Booking or payment record not found.",
        });
      }

      const matchResult = SmsParserService.verifyPaymentWithSms(
        payment.amount,
        payment.transactionId,
        bankSmsText
      );

      if (!matchResult.isMatch) {
        return res.status(400).json({
          success: false,
          message: `SMS Verification failed: ${matchResult.reason}`,
          smsMatchResult: matchResult,
        });
      }

      const updatedBooking = await BookingModel.updatePaymentStatus(id, paymentId, "verified", {
        verifiedBy: "Auto-SMS",
        bankSmsText,
        autoVerified: true,
      });

      res.json({
        success: true,
        message: "🎉 Payment verified via SMS match!",
        booking: updatedBooking,
        smsMatchResult: matchResult,
      });
    } catch (error: any) {
      console.error("Error verifying payment with SMS:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify payment with SMS.",
        error: error.message,
      });
    }
  }
}
