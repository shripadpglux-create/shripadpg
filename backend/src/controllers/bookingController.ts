import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import { BookingModel } from "../models/bookingModel.js";
import { GoogleSheetService } from "../services/googleSheetService.js";
import { generateCustomerCredentials } from "../services/credentialService.js";
import { WhatsAppService } from "../services/whatsappService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DOC_DIR = path.join(__dirname, "..", "..", "uploads", "documents");

export class BookingController {
  /**
   * Retrieve all bookings from the database.
   */
  public static async getBookings(_req: Request, res: Response) {
    try {
      const bookings = await BookingModel.getAll();
      res.json({
        success: true,
        count: bookings.length,
        bookings,
      });
    } catch (error: any) {
      console.error("Error retrieving bookings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve bookings.",
        error: error.message,
      });
    }
  }

  /**
   * Sync online bookings from the Google sheet.
   */
  public static async syncBookings(_req: Request, res: Response) {
    try {
      console.log("🔄 Starting Google Sheet synchronization...");
      const fetchedBookings = await GoogleSheetService.fetchOnlineBookings();
      const newlyAdded = await BookingModel.addOrUpdateMany(fetchedBookings);
      const totalBookings = await BookingModel.getAll();

      res.json({
        success: true,
        message: `Sync complete. ${newlyAdded.length} new bookings added.`,
        newlyAddedCount: newlyAdded.length,
        totalCount: totalBookings.length,
        newlyAdded,
        bookings: totalBookings,
      });
    } catch (error: any) {
      console.error("Error synchronizing sheet bookings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync Google Sheet bookings.",
        error: error.message,
      });
    }
  }

  /**
   * Create a manual booking admission with document support.
   */
  public static async createBooking(req: Request, res: Response) {
    try {
      const { name, email, phone, guardianPhone, documents, documentData, documentName, building, roomType, createdBy, createdByRole, createdById } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: "Name and Phone Number are required fields.",
        });
      }

      let storedDoc = documents || "Aadhaar Card Uploaded";

      // If base64 file data provided, write it to uploads/documents
      if (documentData && documentName) {
        try {
          await fs.mkdir(UPLOADS_DOC_DIR, { recursive: true });
          const matches = documentData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const buffer = matches ? Buffer.from(matches[2], "base64") : Buffer.from(documentData, "base64");
          const sanitizeName = documentName.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filename = `doc_${Date.now()}_${sanitizeName}`;
          const filePath = path.join(UPLOADS_DOC_DIR, filename);
          await fs.writeFile(filePath, buffer);
          storedDoc = `http://localhost:5000/uploads/documents/${filename}`;
        } catch (fileErr) {
          console.error("⚠️ Failed to write document file, falling back to document name:", fileErr);
          storedDoc = documentName || documents || "Aadhaar Card Uploaded";
        }
      }

      const newBooking = await BookingModel.add({
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        name,
        email: email || "N/A",
        phone,
        guardianPhone: guardianPhone || "N/A",
        documents: storedDoc,
        building: building || "Unallocated",
        roomType: roomType || "Double Sharing",
        source: "manual",
        createdBy: createdBy || "Master Admin",
        createdByRole: createdByRole || "admin",
        createdById: createdById || "admin",
      });

      // Post to live Google Sheet Webhook if configured (with Google Drive doc file payload)
      GoogleSheetService.postToGoogleSheet(
        { ...newBooking, documentData, documentName } as any,
        req.body.webhookUrl
      ).catch((err) => console.error("⚠️ Background Google Sheet webhook post error:", err));

      res.status(201).json({
        success: true,
        message: "Admission registration saved successfully.",
        booking: newBooking,
      });
    } catch (error: any) {
      console.error("Error creating manual admission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create manual admission.",
        error: error.message,
      });
    }
  }

  /**
   * Export the synchronized Google Sheet / Manual records CSV file.
   */
  public static async downloadSheetCSV(_req: Request, res: Response) {
    try {
      const csvData = await BookingModel.getSheetCSV();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="sheet_records.csv"');
      res.send(csvData);
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to export sheet CSV.", error: error.message });
    }
  }

  /**
   * Bulk push all manual & online bookings to live Google Sheet webhook.
   */
  public static async pushToSheet(req: Request, res: Response) {
    try {
      const webhookUrl = req.body.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
      const bookings = await BookingModel.getAll();
      const result = await GoogleSheetService.pushAllBookingsToGoogleSheet(bookings, webhookUrl);

      res.json({
        success: true,
        message: `Pushed ${result.successCount} of ${result.totalCount} bookings to live Google Sheet.`,
        ...result,
      });
    } catch (error: any) {
      console.error("Error pushing bookings to Google Sheet:", error);
      res.status(500).json({
        success: false,
        message: "Failed to push bookings to Google Sheet.",
        error: error.message,
      });
    }
  }

  /**
   * Allocate building, floor, room, and bed to an existing customer.
   */
  public static async allocateBooking(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { building, floor, room, bed, rentAmount, depositAmount, paidDepositAmount, depositStatus, rentStartDate, stayType } = req.body;

      if (!id || !building || floor === undefined || floor === null || !room || !bed) {
        return res.status(400).json({
          success: false,
          message: "Booking ID, building, floor, room, and bed are required to complete allocation.",
        });
      }

      const allBookings = await BookingModel.getAll();
      const targetBooking = allBookings.find((b) => b.id === id);

      let customerId = req.body.customerId;
      let customerPassword = req.body.customerPassword;

      if (!customerId || !customerPassword) {
        const generated = generateCustomerCredentials(targetBooking?.name || "Resident", targetBooking?.phone || "0000000000");
        customerId = customerId || generated.customerId;
        customerPassword = customerPassword || generated.customerPassword;
      }

      const updatedBooking = await BookingModel.allocate(id, {
        building,
        floor: Number(floor),
        room,
        bed,
        customerId,
        customerPassword,
        rentAmount: rentAmount !== undefined ? Number(rentAmount) : undefined,
        depositAmount: depositAmount !== undefined ? Number(depositAmount) : undefined,
        paidDepositAmount: paidDepositAmount !== undefined ? Number(paidDepositAmount) : undefined,
        depositStatus,
        rentStartDate,
        stayType,
      });

      if (!updatedBooking) {
        return res.status(404).json({
          success: false,
          message: `Booking with ID '${id}' was not found.`,
        });
      }

      // Automated WhatsApp Dispatch: Allotment Credentials & Welcome Info
      if (process.env.WHATSAPP_AUTO_NOTIFY !== "false" && updatedBooking.phone) {
        WhatsAppService.sendAllotmentMessage({
          name: updatedBooking.name || "Resident",
          phone: updatedBooking.phone,
          building: updatedBooking.allocatedBuilding || building || "PG A",
          room: updatedBooking.allocatedRoom || room || "Room 101",
          bed: updatedBooking.allocatedBed || bed || "Bed A",
          customerId: updatedBooking.customerId || customerId || "",
          customerPassword: updatedBooking.customerPassword || customerPassword || "",
          rentAmount: updatedBooking.rentAmount !== undefined ? updatedBooking.rentAmount : (rentAmount || 0),
          depositAmount: updatedBooking.depositAmount,
        }).catch((err) => console.warn("Background allotment WhatsApp dispatch notice:", err?.message));
      }

      res.json({
        success: true,
        message: "Room and Bed allocated successfully.",
        booking: updatedBooking,
        generatedCredentials: {
          customerId: updatedBooking.customerId,
          customerPassword: updatedBooking.customerPassword,
        },
      });
    } catch (error: any) {
      console.error("Error allocating room/bed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete allocation.",
        error: error.message,
      });
    }
  }

  public static async checkoutAndRefundBooking(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { deductions, deductionReason, refundAmount, refundMethod, transactionId, processedBy } = req.body;

      if (!id || refundAmount === undefined || refundAmount === null) {
        return res.status(400).json({
          success: false,
          message: "Booking ID and valid refund amount are required to complete checkout.",
        });
      }

      const updated = await BookingModel.checkoutAndRefund(id, {
        deductions: Number(deductions || 0),
        deductionReason,
        refundAmount: Number(refundAmount),
        refundMethod: refundMethod || "cash",
        transactionId,
        processedBy,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }

      res.json({
        success: true,
        message: "Resident checkout completed and security deposit refund processed successfully.",
        booking: updated,
      });
    } catch (error: any) {
      console.error("Error processing checkout & refund:", error);
      res.status(500).json({ success: false, message: "Failed to complete checkout & refund.", error: error.message });
    }
  }

  public static async deallocateBooking(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await BookingModel.deallocate(id);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }
      res.json({ success: true, message: "Allocation removed.", booking: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to deallocate.", error: error.message });
    }
  }

  public static async updateBooking(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await BookingModel.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }
      res.json({ success: true, message: "Booking updated.", booking: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update booking.", error: error.message });
    }
  }

  public static async deleteBooking(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const deleted = await BookingModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }
      res.json({ success: true, message: "Booking deleted successfully." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to delete booking.", error: error.message });
    }
  }

  public static async customerLogin(req: Request, res: Response) {
    try {
      const { customerId, password } = req.body;
      if (!customerId || !password) {
        return res.status(400).json({ success: false, message: "Customer ID and Password are required." });
      }

      const cleanInputId = customerId.trim().toLowerCase();
      const cleanInputPhone = customerId.trim().replace(/\D/g, "");
      const cleanInputPass = password.trim();

      const bookings = await BookingModel.getAll();
      const match = bookings.find((b) => {
        const generated = generateCustomerCredentials(b.name, b.phone);
        const effectiveCustId = (b.customerId || generated.customerId).toLowerCase();
        const effectivePassword = b.customerPassword || generated.customerPassword;
        const effectivePhone = (b.phone || "").replace(/\D/g, "");

        const idMatches =
          effectiveCustId === cleanInputId ||
          (cleanInputPhone.length >= 7 && effectivePhone.endsWith(cleanInputPhone));

        const passMatches = effectivePassword === cleanInputPass;

        return idMatches && passMatches;
      });

      if (!match) {
        return res.status(401).json({ success: false, message: "Invalid Customer ID or Password." });
      }

      res.json({
        success: true,
        message: "Customer login successful.",
        booking: match,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Login failed.", error: error.message });
    }
  }

  public static async changePassword(req: Request, res: Response) {
    try {
      const { bookingId, oldPassword, newPassword } = req.body;
      if (!bookingId || !newPassword) {
        return res.status(400).json({ success: false, message: "Booking ID and new password are required." });
      }

      const bookings = await BookingModel.getAll();
      const existing = bookings.find((b) => b.id === bookingId);

      if (!existing) {
        return res.status(404).json({ success: false, message: "Resident profile not found." });
      }

      if (oldPassword && existing.customerPassword && existing.customerPassword !== oldPassword.trim()) {
        return res.status(400).json({ success: false, message: "Existing password does not match." });
      }

      const updated = await BookingModel.update(bookingId, { customerPassword: newPassword.trim() });
      res.json({
        success: true,
        message: "Password updated successfully.",
        booking: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to change password.", error: error.message });
    }
  }

  public static async addComplaint(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { category, title, description, priority } = req.body;

      if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required." });
      }

      const result = await BookingModel.addComplaint(id, {
        category: category || "other",
        title,
        description,
        priority: priority || "medium",
      });

      if (!result) {
        return res.status(404).json({ success: false, message: "Resident profile not found." });
      }

      res.status(201).json({
        success: true,
        message: "Complaint registered successfully.",
        booking: result.booking,
        complaint: result.complaint,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to submit complaint.", error: error.message });
    }
  }

  public static async updateComplaintStatus(req: Request, res: Response) {
    try {
      const { id, complaintId } = req.params;
      const { status, adminComment } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required." });
      }

      const updated = await BookingModel.updateComplaintStatus(id as string, complaintId as string, status, adminComment);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Complaint record not found." });
      }

      // Automated WhatsApp Dispatch: Complaint Status & Warden Note Update
      if (process.env.WHATSAPP_AUTO_NOTIFY !== "false" && updated.phone) {
        const history = updated.complaintHistory || [];
        const cRecord = history.find((c: any) => c.id === complaintId);
        if (cRecord) {
          WhatsAppService.sendComplaintStatusUpdate({
            residentName: updated.name || "Resident",
            phone: updated.phone,
            title: cRecord.title || "Service Request",
            category: cRecord.category || "General",
            status: status as any,
            adminComment: adminComment !== undefined ? adminComment : cRecord.adminComment,
          }).catch((err) => console.warn("Background complaint WhatsApp dispatch notice:", err?.message));
        }
      }

      res.json({
        success: true,
        message: "Complaint status updated successfully.",
        booking: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update complaint status.", error: error.message });
    }
  }

  /**
   * Set or update rent details for an allocated resident.
   */
  public static async setupRent(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { rentAmount, rentStartDate, checkoutDate, stayType } = req.body;

      if (!rentAmount || !rentStartDate) {
        return res.status(400).json({
          success: false,
          message: "Rent amount and rent start date are required.",
        });
      }

      const allBookings = await BookingModel.getAll();
      const target = allBookings.find((b) => b.id === id);

      if (!target) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }

      const updateData: any = {
        rentAmount: Number(rentAmount),
        rentStartDate,
        stayType: stayType || "monthly",
      };

      if (checkoutDate) {
        updateData.checkoutDate = checkoutDate;
      }

      const updated = await BookingModel.update(id, updateData);

      res.json({
        success: true,
        message: "Rent details saved successfully.",
        booking: updated,
      });
    } catch (error: any) {
      console.error("Error setting up rent:", error);
      res.status(500).json({ success: false, message: "Failed to save rent details.", error: error.message });
    }
  }
}
