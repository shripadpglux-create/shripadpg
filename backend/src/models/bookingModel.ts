import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { BookingMongoModel } from "../schemas/mongoSchemas.js";
import { DBOptimizationService } from "../services/dbOptimizationService.js";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PaymentRecord {
  id: string;
  month: number; // 1-12
  year: number;
  amount: number;
  transactionId: string;
  invoiceNo?: string;
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
  payments?: PaymentRecord[];
  complaintHistory?: ComplaintRecord[];
  complaints?: ComplaintRecord[];
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
  lastRentReminderDate?: string;      // ISO date string of last reminder sent, e.g. "2026-08-31"
  lastReminderType?: "upcoming" | "due_today" | "overdue";
  createdBy?: string;
  createdByRole?: "admin" | "staff" | "customer";
  createdById?: string;
}

export interface RentDueCycleInfo {
  cycleDueDay: number;
  nextDueDate: Date;
  nextDueDateFormatted: string;
  nextDueDateISO: string;
  daysUntilDue: number;
  isUpcoming: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  daysOverdue: number;
  cycleMonthName: string;
}

export interface ResidentDueItem {
  id: string;
  bookingId: string;
  name: string;
  phone: string;
  email: string;
  building: string;
  floor: string | number;
  room: string;
  bed: string;
  status: "pending" | "allocated" | "checked_out";
  rentAmount: number;
  paidRentAmount: number;
  rentDue: number;
  depositAmount: number;
  paidDepositAmount: number;
  depositDue: number;
  totalDue: number;
  depositStatus: "pending" | "paid" | "partially_paid" | "refunded";
  dueCategory: "rent_only" | "deposit_only" | "rent_and_deposit" | "paid";
  lastPaymentDate?: string;
  daysOverdue: number;
  isOverdue: boolean;
  rentStartDate?: string;
  paymentHistoryCount: number;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");
const SHEET_CSV_FILE = path.join(DATA_DIR, "sheet_records.csv");

const SEED_BOOKINGS: Booking[] = [];

export class BookingModel {
  private static cache: Booking[] = [];
  private static isInitialized = false;
  private static dirtyIds: Set<string> = new Set();

  private static async init() {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      if (mongoose.connection.readyState === 1) {
        try {
          const mongoDocs = await BookingMongoModel.find({}).lean();
          if (mongoDocs && mongoDocs.length > 0) {
            const cleanDocs = mongoDocs.filter((b: any) => {
              const name = String(b.name || "");
              const ts = String(b.timestamp || "");
              return !name.includes("<script") && !name.includes("waffle_api") && !ts.includes("<script");
            });
            this.cache = cleanDocs as any[];
            this.isInitialized = true;
            await fs.writeFile(DATA_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
            // Purge only bad HTML records from MongoDB Atlas (targeted deletion, not full wipe)
            if (cleanDocs.length < mongoDocs.length) {
              await BookingMongoModel.deleteMany({
                $or: [
                  { name: { $regex: /<script/i } },
                  { name: { $regex: /waffle_api/i } },
                  { timestamp: { $regex: /<script/i } },
                ],
              });
              console.log(`🧹 Purged ${mongoDocs.length - cleanDocs.length} HTML garbage records from MongoDB Atlas (targeted).`);
            }
            return;
          }
        } catch (err) {
          console.warn("MongoDB Atlas booking fetch warning:", err);
        }
      }

      try {
        const fileContent = await fs.readFile(DATA_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.cache = Array.isArray(parsed)
          ? parsed.filter((b: any) => {
              const name = String(b.name || "");
              const ts = String(b.timestamp || "");
              return !name.includes("<script") && !name.includes("waffle_api") && !ts.includes("<script");
            })
          : [];
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
      await fs.writeFile(DATA_FILE, JSON.stringify(this.cache), "utf-8");
    } catch (error) {
      console.error("Failed to save bookings to file:", error);
    }

    // Dirty-document tracking: only sync changed documents to Atlas, not the full collection
    if (mongoose.connection.readyState === 1 && this.dirtyIds.size > 0) {
      try {
        const dirtyDocs = this.cache.filter((b) => this.dirtyIds.has(b.id));
        if (dirtyDocs.length > 0) {
          const ops = dirtyDocs.map((b) => ({
            replaceOne: {
              filter: { id: b.id },
              replacement: { ...DBOptimizationService.compactDocument(b), id: b.id },
              upsert: true,
            },
          }));
          await BookingMongoModel.bulkWrite(ops);
          console.log(`🍃 Synced ${dirtyDocs.length} changed bookings to MongoDB Atlas (purged empty keys).`);
        }
        this.dirtyIds.clear();
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

  public static async getById(id: string): Promise<Booking | null> {
    await this.init();
    const cleanId = String(id || "").trim();
    return this.cache.find((b) => String(b.id) === cleanId || String((b as any)._id) === cleanId || (b.customerId && String(b.customerId) === cleanId)) || null;
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
    this.dirtyIds.add(newBooking.id);
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
        this.dirtyIds.add(existing.id);
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
        this.dirtyIds.add(newBooking.id);
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
    this.dirtyIds.add(updatedBooking.id);
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
    this.dirtyIds.add(updated.id);
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
    this.dirtyIds.add(updated.id);
    await this.saveToFile();
    return updated;
  }

  public static async delete(id: string): Promise<boolean> {
    await this.init();
    const initialLength = this.cache.length;
    this.cache = this.cache.filter((b) => b.id !== id);
    if (this.cache.length !== initialLength) {
      await this.saveToFile();
      // Remove orphan from MongoDB Atlas to prevent permanent storage leak
      if (mongoose.connection.readyState === 1) {
        try {
          await BookingMongoModel.deleteOne({ id });
        } catch (err) {
          console.warn("Failed to delete booking orphan from Atlas:", err);
        }
      }
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

    this.dirtyIds.add(this.cache[index].id);
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

    this.dirtyIds.add(this.cache[bookingIndex].id);
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

    const existingHistory = this.cache[index].complaintHistory || this.cache[index].complaints || [];
    const updatedHistory = [newComplaint, ...existingHistory];

    this.cache[index] = {
      ...this.cache[index],
      complaintHistory: updatedHistory,
    };

    this.dirtyIds.add(this.cache[index].id);
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
    const bookingIndex = this.cache.findIndex((b) => b.id === bookingId || (b as any)._id === bookingId);
    if (bookingIndex === -1) return null;

    const booking = this.cache[bookingIndex];
    const history = booking.complaintHistory || booking.complaints || [];
    const cleanCmpId = (complaintId || "").toString().trim();
    const cIndex = history.findIndex((c: any) =>
      c.id === cleanCmpId ||
      (c.id && c.id.toString() === cleanCmpId) ||
      (c as any)._id === cleanCmpId ||
      c.title === cleanCmpId
    );
    if (cIndex === -1) return null;

    const updatedComplaint: ComplaintRecord = {
      ...history[cIndex],
      status,
      adminComment: adminComment !== undefined ? adminComment : history[cIndex].adminComment,
      resolvedAt: status === "resolved" || status === "closed" ? new Date().toISOString() : history[cIndex].resolvedAt,
    };

    const updatedHistory = [...history];
    updatedHistory[cIndex] = updatedComplaint;

    this.cache[bookingIndex] = {
      ...booking,
      complaintHistory: updatedHistory,
    };

    this.dirtyIds.add(this.cache[bookingIndex].id);
    await this.saveToFile();
    return this.cache[bookingIndex];
  }

  /**
   * Calculates individual rent cycle due date, countdown, and overdue status.
   * e.g. If joined on 1-08-2026, due day is 1st of month.
   * - If rent is unpaid and today (22nd) is past due day (1st): isOverdue = true (21 days overdue for current month).
   * - If today is 30/31-08-2026 and cycle due day is 1st: isUpcoming = true (1-2 days left for next month).
   * - If today is 01-09-2026: isDueToday = true (0 days left).
   */
  public static calculateNextDueDate(b: Booking, targetDate = new Date()): RentDueCycleInfo {
    let cycleDueDay = 5; // default PG due day
    if (b.rentStartDate) {
      const parsed = new Date(b.rentStartDate);
      if (!isNaN(parsed.getTime())) {
        cycleDueDay = parsed.getDate();
      }
    } else if (b.timestamp) {
      const parsed = new Date(b.timestamp);
      if (!isNaN(parsed.getTime())) {
        cycleDueDay = parsed.getDate();
      }
    }

    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth(); // 0-indexed
    const currentDay = targetDate.getDate();

    const maxDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const actualCycleDayThisMonth = Math.min(cycleDueDay, maxDaysInCurrentMonth);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n: number) => String(n).padStart(2, "0");

    let isDueToday = false;
    let isUpcoming = false;
    let isOverdue = false;
    let daysUntilDue = 0;
    let daysOverdue = 0;
    let targetDueYear = currentYear;
    let targetDueMonth = currentMonth;
    let targetDueDay = actualCycleDayThisMonth;

    if (currentDay === actualCycleDayThisMonth) {
      // Due Today!
      isDueToday = true;
      daysUntilDue = 0;
      targetDueYear = currentYear;
      targetDueMonth = currentMonth;
      targetDueDay = actualCycleDayThisMonth;
    } else if (currentDay > actualCycleDayThisMonth) {
      // Past the cycle day in current month
      // If today is near end of month (e.g. 30th/31st for 1st of next month), check if upcoming for next month
      let nextMonthYear = currentYear;
      let nextMonth = currentMonth + 1;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextMonthYear++;
      }
      const maxDaysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
      const actualCycleDayNextMonth = Math.min(cycleDueDay, maxDaysInNextMonth);

      const nextMonthDueDate = new Date(nextMonthYear, nextMonth, actualCycleDayNextMonth, 0, 0, 0, 0);
      const todayZero = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
      const daysToNextCycle = Math.round((nextMonthDueDate.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));

      if (daysToNextCycle === 1 || daysToNextCycle === 2) {
        // Upcoming for next month (e.g. 30th or 31st of August for 1st September)
        isUpcoming = true;
        daysUntilDue = daysToNextCycle;
        targetDueYear = nextMonthYear;
        targetDueMonth = nextMonth;
        targetDueDay = actualCycleDayNextMonth;
      } else {
        // Overdue for the current month!
        isOverdue = true;
        daysOverdue = currentDay - actualCycleDayThisMonth;
        daysUntilDue = -daysOverdue;
        targetDueYear = currentYear;
        targetDueMonth = currentMonth;
        targetDueDay = actualCycleDayThisMonth;
      }
    } else {
      // currentDay < actualCycleDayThisMonth (e.g. Day 3 and due day is 5th)
      const diff = actualCycleDayThisMonth - currentDay;
      daysUntilDue = diff;
      targetDueYear = currentYear;
      targetDueMonth = currentMonth;
      targetDueDay = actualCycleDayThisMonth;

      if (diff === 1 || diff === 2) {
        isUpcoming = true;
      }
    }

    const nextDueDate = new Date(targetDueYear, targetDueMonth, targetDueDay, 0, 0, 0, 0);
    const nextDueDateFormatted = `${targetDueDay} ${monthNames[targetDueMonth]} ${targetDueYear}`;
    const nextDueDateISO = `${targetDueYear}-${pad(targetDueMonth + 1)}-${pad(targetDueDay)}`;
    const cycleMonthName = `${monthNames[targetDueMonth]} ${targetDueYear}`;

    return {
      cycleDueDay: targetDueDay,
      nextDueDate,
      nextDueDateFormatted,
      nextDueDateISO,
      daysUntilDue,
      isUpcoming,
      isDueToday,
      isOverdue,
      daysOverdue,
      cycleMonthName,
    };
  }

  /**
   * Calculates real-time dues breakdown (rent dues, deposit dues, total dues, overdue age) for a resident.
   */
  public static calculateResidentDues(b: Booking): ResidentDueItem {
    const monthlyRent = Number(b.rentAmount) || 0;
    const depositAmount = Number(b.depositAmount) || 0;
    const paidDeposit = Number(b.paidDepositAmount) || 0;
    const depositDue = Math.max(0, depositAmount - paidDeposit);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const history = b.paymentHistory || b.payments || [];
    const verifiedHistory = history.filter((p) => p.status === "verified");

    // Verified rent payments for current month / cycle
    const currentMonthPaid = verifiedHistory
      .filter((p) => p.month === currentMonth && p.year === currentYear)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    let paidRentAmount = currentMonthPaid;
    if (paidRentAmount === 0 && (b.paidAmount !== undefined && b.paidAmount > 0)) {
      paidRentAmount = Number(b.paidAmount);
    }

    const rentDue = Math.max(0, monthlyRent - paidRentAmount);
    const totalDue = rentDue + depositDue;

    // Calculate last payment date
    let lastPaymentDate = b.lastPaymentDate;
    if (!lastPaymentDate && verifiedHistory.length > 0) {
      const sorted = [...verifiedHistory].sort(
        (a, b) => new Date(b.paymentDate || b.submittedAt).getTime() - new Date(a.paymentDate || a.submittedAt).getTime()
      );
      lastPaymentDate = sorted[0].paymentDate || sorted[0].submittedAt;
    }

    // Calculate days overdue (Due by 5th of each month)
    const dueDate = new Date(currentYear, currentMonth - 1, 5);
    let daysOverdue = 0;
    if (totalDue > 0 && now.getTime() > dueDate.getTime()) {
      daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    let dueCategory: "rent_only" | "deposit_only" | "rent_and_deposit" | "paid" = "paid";
    if (rentDue > 0 && depositDue > 0) dueCategory = "rent_and_deposit";
    else if (rentDue > 0) dueCategory = "rent_only";
    else if (depositDue > 0) dueCategory = "deposit_only";

    let depositStatus: "pending" | "paid" | "partially_paid" | "refunded" = b.depositStatus || "pending";
    if (depositAmount > 0) {
      if (paidDeposit >= depositAmount) depositStatus = "paid";
      else if (paidDeposit > 0) depositStatus = "partially_paid";
      else depositStatus = "pending";
    }

    return {
      id: b.id,
      bookingId: b.id,
      name: b.name || "Unnamed Resident",
      phone: b.phone || "",
      email: b.email || "",
      building: (b.allocatedBuilding || b.building || "PG ShripadLux-A wing").trim(),
      floor: b.allocatedFloor !== undefined ? b.allocatedFloor : 1,
      room: (b.allocatedRoom || "Unallocated").trim(),
      bed: (b.allocatedBed || "Unallocated").trim(),
      status: b.status || "pending",
      rentAmount: monthlyRent,
      paidRentAmount,
      rentDue,
      depositAmount,
      paidDepositAmount: paidDeposit,
      depositDue,
      totalDue,
      depositStatus,
      dueCategory,
      lastPaymentDate,
      daysOverdue,
      isOverdue: daysOverdue > 0,
      rentStartDate: b.rentStartDate,
      paymentHistoryCount: history.length,
    };
  }

  /**
   * Retrieves all dues across residents with summary statistics.
   */
  public static async getAllDues(buildingFilter?: string): Promise<{
    dues: ResidentDueItem[];
    summary: {
      totalResidents: number;
      residentsWithDues: number;
      totalDuesAmount: number;
      totalRentDues: number;
      totalDepositDues: number;
      totalCollectedThisMonth: number;
      overdueCount: number;
    };
  }> {
    await this.init();
    let list = [...this.cache];

    if (buildingFilter && buildingFilter.trim() && buildingFilter.toUpperCase() !== "ALL") {
      const bClean = buildingFilter.trim().toLowerCase();
      list = list.filter((b) => {
        const bld = (b.allocatedBuilding || b.building || "").trim().toLowerCase();
        return bld === bClean;
      });
    }
    // Only include allocated residents — unallocated ones have no rent/deposit set
    list = list.filter((b) => b.status === "allocated" && b.allocatedRoom);

    const calculatedDues = list.map((b) => this.calculateResidentDues(b));

    // Sort by totalDue descending (highest dues first)
    calculatedDues.sort((a, b) => b.totalDue - a.totalDue);

    const withDues = calculatedDues.filter((d) => d.totalDue > 0);
    const totalDuesAmount = withDues.reduce((s, d) => s + d.totalDue, 0);
    const totalRentDues = withDues.reduce((s, d) => s + d.rentDue, 0);
    const totalDepositDues = withDues.reduce((s, d) => s + d.depositDue, 0);
    const totalCollectedThisMonth = calculatedDues.reduce((s, d) => s + d.paidRentAmount, 0);
    const overdueCount = withDues.filter((d) => d.isOverdue).length;

    return {
      dues: calculatedDues,
      summary: {
        totalResidents: calculatedDues.length,
        residentsWithDues: withDues.length,
        totalDuesAmount,
        totalRentDues,
        totalDepositDues,
        totalCollectedThisMonth,
        overdueCount,
      },
    };
  }

  /**
   * When a building is renamed, update all residents' allocatedBuilding to the new name.
   * This keeps financial filters (Dues, Revenue) accurate across building renames.
   */
  public static async updateBuildingNames(oldName: string, newName: string): Promise<number> {
    await this.init();
    let count = 0;
    const oldClean = oldName.trim().toLowerCase();

    for (const booking of this.cache) {
      const bld = (booking.allocatedBuilding || "").trim().toLowerCase();
      if (bld === oldClean) {
        booking.allocatedBuilding = newName;
        this.dirtyIds.add(booking.id);
        count++;
      }
    }

    if (count > 0) {
      await this.saveToFile();
      console.log(`🏢 Updated ${count} residents from building "${oldName}" → "${newName}"`);
    }
    return count;
  }
}

