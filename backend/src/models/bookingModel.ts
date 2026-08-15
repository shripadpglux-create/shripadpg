import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { BookingMongoModel } from "../schemas/mongoSchemas.js";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PaymentRecord {
  id: string;
  month: number; // 1-12
  year: number;
  amount: number;
  transactionId: string;
  payerName: string;
  paymentDate: string; // ISO date string
  paymentMethod: "upi" | "bank_transfer" | "cash" | "other";
  submittedAt: string;
  status: "submitted" | "verified" | "rejected";
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedReason?: string;
  bankSmsText?: string;
  autoVerified: boolean;
}

export interface ComplaintRecord {
  id: string;
  category: "wifi" | "food" | "plumbing" | "electrical" | "cleaning" | "noise" | "other";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  resolvedAt?: string;
  adminComment?: string;
}

export interface DepositRefundRecord {
  depositAmount: number;
  paidDepositAmount: number;
  deductions: number;
  deductionReason?: string;
  refundAmount: number;
  refundMethod: "cash" | "upi" | "bank_transfer";
  transactionId?: string;
  refundDate: string;
  processedBy?: string;
}

export interface Booking {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  building: string;
  roomType: string;
  source: "manual" | "online";
  status: "pending" | "allocated" | "checked_out";
  guardianPhone?: string;
  allocatedBuilding?: string;
  allocatedFloor?: number;
  allocatedRoom?: string;
  allocatedBed?: string;
  customerId?: string;
  customerPassword?: string;
  documents?: string;
  paymentHistory?: PaymentRecord[];
  complaintHistory?: ComplaintRecord[];
  rentAmount?: number;
  depositAmount?: number;
  paidDepositAmount?: number;
  depositStatus?: "pending" | "paid" | "partially_paid" | "refunded";
  depositRefundDetails?: DepositRefundRecord;
  rentStartDate?: string;    // ISO date string, e.g. "2026-08-12"
  checkoutDate?: string;     // ISO date string (optional, for short-stay guests or exit date)
  stayType?: "monthly" | "short_stay";  // monthly = regular PG, short_stay = days/weeks
  paidAmount?: number;
  balanceDue?: number;
  lastPaymentDate?: string;
  paymentStatus?: string;
  createdBy?: string;
  createdByRole?: "admin" | "staff" | "customer";
  createdById?: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");
const SHEET_CSV_FILE = path.join(DATA_DIR, "sheet_records.csv");

const SEED_BOOKINGS: Booking[] = [];

export class BookingModel {
  private static cache: Booking[] = [];
  private static isInitialized = false;

  private static async init() {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      if (mongoose.connection.readyState === 1) {
        try {
          const mongoDocs = await BookingMongoModel.find({}).lean();
          if (mongoDocs && mongoDocs.length > 0) {
            this.cache = mongoDocs as any[];
            this.isInitialized = true;
            await fs.writeFile(DATA_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
            return;
          }
        } catch (err) {
          console.warn("MongoDB Atlas booking fetch warning:", err);
        }
      }

      try {
        const fileContent = await fs.readFile(DATA_FILE, "utf-8");
        this.cache = JSON.parse(fileContent);
      } catch (err) {
        this.cache = [...SEED_BOOKINGS];
        await this.saveToFile();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Booking database:", error);
      this.cache = [...SEED_BOOKINGS];
    }
  }

  private static async saveToFile() {
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save bookings to file:", error);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await BookingMongoModel.deleteMany({});
        if (this.cache.length > 0) {
          await BookingMongoModel.insertMany(this.cache);
        }
        console.log(`🍃 Synced ${this.cache.length} bookings to MongoDB Atlas.`);
      } catch (err) {
        console.error("Failed to sync bookings to MongoDB Atlas:", err);
      }
    }
  }

  public static async appendToSheetCSV(booking: Booking) {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const row = `"${booking.timestamp || ""}","${booking.name || ""}","${booking.phone || ""}","${booking.guardianPhone || "N/A"}","${booking.email || "N/A"}","${booking.documents || "N/A"}","${booking.source || "manual"}"\n`;
      let fileExists = false;
      try {
        await fs.access(SHEET_CSV_FILE);
        fileExists = true;
      } catch {
        fileExists = false;
      }
      if (!fileExists) {
        const header = `Timestamp,Full Name,Phone Number,Guardian Phone,Email,Documents,Source\n`;
        await fs.writeFile(SHEET_CSV_FILE, header + row, "utf-8");
      } else {
        await fs.appendFile(SHEET_CSV_FILE, row, "utf-8");
      }
    } catch (error) {
      console.error("Failed to append to sheet_records.csv:", error);
    }
  }

  public static async getSheetCSV(): Promise<string> {
    try {
      await this.init();
      let fileExists = false;
      try {
        await fs.access(SHEET_CSV_FILE);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (fileExists) {
        return await fs.readFile(SHEET_CSV_FILE, "utf-8");
      }

      const header = `Timestamp,Full Name,Phone Number,Guardian Phone,Email,Documents,Source\n`;
      const rows = this.cache.map((b) =>
        `"${b.timestamp || ""}","${b.name || ""}","${b.phone || ""}","${b.guardianPhone || "N/A"}","${b.email || "N/A"}","${b.documents || "N/A"}","${b.source || "manual"}"`
      ).join("\n");

      const fullCsv = header + rows + (rows ? "\n" : "");
      await fs.writeFile(SHEET_CSV_FILE, fullCsv, "utf-8");
      return fullCsv;
    } catch (error) {
      console.error("Failed to read sheet_records.csv:", error);
      return `Timestamp,Full Name,Phone Number,Guardian Phone,Email,Documents,Source\n`;
    }
  }

  public static async getAll(): Promise<Booking[]> {
    await this.init();
    return [...this.cache];
  }

  public static async add(booking: Omit<Booking, "id" | "status">): Promise<Booking> {
    await this.init();
    
    const newBooking: Booking = {
      paymentHistory: booking.paymentHistory || [],
      ...booking,
      id: `${booking.source}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: "pending",
    };

    this.cache.unshift(newBooking); // Add to the top of list
    await this.saveToFile();
    await this.appendToSheetCSV(newBooking);
    return newBooking;
  }

  public static async addOrUpdateMany(newBookings: Omit<Booking, "id">[]): Promise<Booking[]> {
    await this.init();
    const addedBookings: Booking[] = [];
    let hasChanges = false;

    const cleanPhone = (p?: string) => (p || "").replace(/\D/g, "");

    for (const item of newBookings) {
      const itemPhoneClean = cleanPhone(item.phone);
      const itemNameClean = item.name.trim().toLowerCase();

      // Check if a booking already exists for this person (manual or online)
      const existingIndex = this.cache.findIndex((b) => {
        const bNameClean = b.name.trim().toLowerCase();
        const bPhoneClean = cleanPhone(b.phone);

        const isSameNameAndPhone =
          itemNameClean === bNameClean &&
          itemPhoneClean.length >= 7 &&
          bPhoneClean.length >= 7 &&
          (itemPhoneClean.endsWith(bPhoneClean) || bPhoneClean.endsWith(itemPhoneClean));

        const isSameNameAndTimestamp =
          b.timestamp === item.timestamp && itemNameClean === bNameClean;

        return isSameNameAndPhone || isSameNameAndTimestamp;
      });

      if (existingIndex !== -1) {
        // Update fields if changed, without creating duplicate entries or overriding manual source
        const existing = this.cache[existingIndex];
        this.cache[existingIndex] = {
          ...existing,
          name: existing.name || item.name,
          phone: existing.phone || item.phone,
          guardianPhone: existing.guardianPhone && existing.guardianPhone !== "N/A" ? existing.guardianPhone : item.guardianPhone,
          email: existing.email && existing.email !== "N/A" ? existing.email : item.email,
          documents: existing.documents && existing.documents !== "N/A" ? existing.documents : item.documents,
        };
        hasChanges = true;
      } else {
        // Insert new online booking only if person does not exist
        const newBooking: Booking = {
          paymentHistory: item.paymentHistory || [],
          ...item,
          id: `${item.source}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        };
        this.cache.unshift(newBooking);
        addedBookings.push(newBooking);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.saveToFile();
    }

    return addedBookings;
  }

  public static async allocate(
    id: string,
    allocation: {
      building: string;
      floor: number;
      room: string;
      bed: string;
      customerId?: string;
      customerPassword?: string;
      rentAmount?: number;
      depositAmount?: number;
      paidDepositAmount?: number;
      depositStatus?: "pending" | "paid" | "partially_paid" | "refunded";
      rentStartDate?: string;
      stayType?: "monthly" | "short_stay";
    }
  ): Promise<Booking | null> {
    await this.init();
    
    const bookingIndex = this.cache.findIndex((b) => b.id === id);
    if (bookingIndex === -1) return null;

    const existing = this.cache[bookingIndex];
    const depositAmt = allocation.depositAmount !== undefined ? allocation.depositAmount : (existing.depositAmount || 5000);
    const paidDepositAmt = allocation.paidDepositAmount !== undefined ? allocation.paidDepositAmount : (existing.paidDepositAmount || depositAmt);
    const depStatus = allocation.depositStatus || (paidDepositAmt >= depositAmt ? "paid" : paidDepositAmt > 0 ? "partially_paid" : "pending");

    const targetStayType = allocation.stayType || existing.stayType || "monthly";

    const updatedBooking: Booking = {
      ...existing,
      status: "allocated" as const,
      allocatedBuilding: allocation.building,
      allocatedFloor: allocation.floor,
      allocatedRoom: allocation.room,
      allocatedBed: allocation.bed,
      customerId: allocation.customerId || existing.customerId,
      customerPassword: allocation.customerPassword || existing.customerPassword,
      rentAmount: allocation.rentAmount !== undefined ? allocation.rentAmount : existing.rentAmount,
      depositAmount: depositAmt,
      paidDepositAmount: paidDepositAmt,
      depositStatus: depStatus,
      rentStartDate: allocation.rentStartDate || existing.rentStartDate || new Date().toISOString().substring(0, 10),
      stayType: targetStayType,
      checkoutDate: targetStayType === "short_stay" ? existing.checkoutDate : undefined,
    };

    this.cache[bookingIndex] = updatedBooking;
    await this.saveToFile();
    return updatedBooking;
  }

  public static async checkoutAndRefund(
    id: string,
    refundData: {
      deductions: number;
      deductionReason?: string;
      refundAmount: number;
      refundMethod: "cash" | "upi" | "bank_transfer";
      transactionId?: string;
      processedBy?: string;
    }
  ): Promise<Booking | null> {
    await this.init();
    const index = this.cache.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const existing = this.cache[index];
    const depositAmt = existing.depositAmount || 0;
    const paidAmt = existing.paidDepositAmount !== undefined ? existing.paidDepositAmount : depositAmt;

    const refundRecord: DepositRefundRecord = {
      depositAmount: depositAmt,
      paidDepositAmount: paidAmt,
      deductions: refundData.deductions || 0,
      deductionReason: refundData.deductionReason || "",
      refundAmount: refundData.refundAmount,
      refundMethod: refundData.refundMethod || "cash",
      transactionId: refundData.transactionId || "",
      refundDate: new Date().toISOString().substring(0, 10),
      processedBy: refundData.processedBy || "Admin",
    };

    const updated: Booking = {
      ...existing,
      status: "checked_out" as const,
      allocatedBuilding: undefined,
      allocatedFloor: undefined,
      allocatedRoom: undefined,
      allocatedBed: undefined,
      depositStatus: "refunded",
      depositRefundDetails: refundRecord,
      checkoutDate: new Date().toISOString().substring(0, 10),
    };

    this.cache[index] = updated;
    await this.saveToFile();
    return updated;
  }

  public static async deallocate(id: string): Promise<Booking | null> {
    await this.init();
    const index = this.cache.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.cache[index],
      status: "pending" as const,
      allocatedBuilding: undefined,
      allocatedFloor: undefined,
      allocatedRoom: undefined,
      allocatedBed: undefined,
    };

    this.cache[index] = updated;
    await this.saveToFile();
    return updated;
  }

  public static async update(id: string, data: Partial<Booking>): Promise<Booking | null> {
    await this.init();
    const index = this.cache.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.cache[index],
      ...data,
      id: this.cache[index].id, // keep original ID
    };

    this.cache[index] = updated;
    await this.saveToFile();
    return updated;
  }

  public static async delete(id: string): Promise<boolean> {
    await this.init();
    const initialLength = this.cache.length;
    this.cache = this.cache.filter((b) => b.id !== id);
    if (this.cache.length !== initialLength) {
      await this.saveToFile();
      return true;
    }
    return false;
  }

  public static async addPayment(
    bookingId: string,
    paymentData: {
      month: number;
      year: number;
      amount: number;
      transactionId: string;
      payerName: string;
      paymentDate: string;
      paymentMethod?: "upi" | "bank_transfer" | "cash" | "other";
      bankSmsText?: string;
      autoVerified?: boolean;
      status?: "submitted" | "verified" | "rejected";
    }
  ): Promise<{ booking: Booking; payment: PaymentRecord } | null> {
    await this.init();
    const index = this.cache.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      month: paymentData.month,
      year: paymentData.year,
      amount: Number(paymentData.amount),
      transactionId: paymentData.transactionId.trim(),
      payerName: paymentData.payerName.trim(),
      paymentDate: paymentData.paymentDate || new Date().toISOString().substring(0, 10),
      paymentMethod: paymentData.paymentMethod || "upi",
      submittedAt: new Date().toISOString(),
      status: paymentData.status || "submitted",
      bankSmsText: paymentData.bankSmsText,
      autoVerified: !!paymentData.autoVerified,
    };

    const existingHistory = this.cache[index].paymentHistory || [];
    const updatedHistory = [newPayment, ...existingHistory];

    this.cache[index] = {
      ...this.cache[index],
      paymentHistory: updatedHistory,
    };

    await this.saveToFile();
    return { booking: this.cache[index], payment: newPayment };
  }

  public static async updatePaymentStatus(
    bookingId: string,
    paymentId: string,
    status: "verified" | "rejected",
    details?: {
      verifiedBy?: string;
      rejectedReason?: string;
      bankSmsText?: string;
      autoVerified?: boolean;
    }
  ): Promise<Booking | null> {
    await this.init();
    const bookingIndex = this.cache.findIndex((b) => b.id === bookingId);
    if (bookingIndex === -1) return null;

    const booking = this.cache[bookingIndex];
    const history = booking.paymentHistory || [];
    const pIndex = history.findIndex((p) => p.id === paymentId);
    if (pIndex === -1) return null;

    const updatedPayment: PaymentRecord = {
      ...history[pIndex],
      status,
      verifiedAt: status === "verified" ? new Date().toISOString() : history[pIndex].verifiedAt,
      verifiedBy: details?.verifiedBy || history[pIndex].verifiedBy,
      rejectedReason: details?.rejectedReason || history[pIndex].rejectedReason,
      bankSmsText: details?.bankSmsText !== undefined ? details.bankSmsText : history[pIndex].bankSmsText,
      autoVerified: details?.autoVerified !== undefined ? details.autoVerified : history[pIndex].autoVerified,
    };

    const updatedHistory = [...history];
    updatedHistory[pIndex] = updatedPayment;

    this.cache[bookingIndex] = {
      ...booking,
      paymentHistory: updatedHistory,
    };

    await this.saveToFile();
    return this.cache[bookingIndex];
  }

  public static async addComplaint(
    bookingId: string,
    complaintData: {
      category: "wifi" | "food" | "plumbing" | "electrical" | "cleaning" | "noise" | "other";
      title: string;
      description: string;
      priority?: "low" | "medium" | "high" | "urgent";
    }
  ): Promise<{ booking: Booking; complaint: ComplaintRecord } | null> {
    await this.init();
    const index = this.cache.findIndex((b) => b.id === bookingId);
    if (index === -1) return null;

    const newComplaint: ComplaintRecord = {
      id: `cmp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      category: complaintData.category,
      title: complaintData.title.trim(),
      description: complaintData.description.trim(),
      priority: complaintData.priority || "medium",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const existingHistory = this.cache[index].complaintHistory || [];
    const updatedHistory = [newComplaint, ...existingHistory];

    this.cache[index] = {
      ...this.cache[index],
      complaintHistory: updatedHistory,
    };

    await this.saveToFile();
    return { booking: this.cache[index], complaint: newComplaint };
  }

  public static async updateComplaintStatus(
    bookingId: string,
    complaintId: string,
    status: "pending" | "in_progress" | "resolved" | "closed",
    adminComment?: string
  ): Promise<Booking | null> {
    await this.init();
    const bookingIndex = this.cache.findIndex((b) => b.id === bookingId);
    if (bookingIndex === -1) return null;

    const booking = this.cache[bookingIndex];
    const history = booking.complaintHistory || [];
    const cIndex = history.findIndex((c) => c.id === complaintId);
    if (cIndex === -1) return null;

    const updatedComplaint: ComplaintRecord = {
      ...history[cIndex],
      status,
      adminComment: adminComment || history[cIndex].adminComment,
      resolvedAt: status === "resolved" || status === "closed" ? new Date().toISOString() : history[cIndex].resolvedAt,
    };

    const updatedHistory = [...history];
    updatedHistory[cIndex] = updatedComplaint;

    this.cache[bookingIndex] = {
      ...booking,
      complaintHistory: updatedHistory,
    };

    await this.saveToFile();
    return this.cache[bookingIndex];
  }
}
