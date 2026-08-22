import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { InvoiceMongoModel } from "../schemas/mongoSchemas.js";
import { DBOptimizationService } from "../services/dbOptimizationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Invoice {
  id: string;
  invoiceNo: string;
  residentId?: string;
  tenantName: string;
  contact: string;
  email: string;
  building: string;
  floor: string;
  room: string;
  bed: string;
  date: string;
  dueDate: string;
  rentAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentModes: string[];
  splitAmounts?: Record<string, number>;
  notes: string;
  status: "PAID" | "PARTIAL" | "UNPAID";
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "invoices.json");

const SEED_INVOICES: Invoice[] = [];

export class InvoiceModel {
  private static cache: Invoice[] = [];
  private static isInitialized = false;
  private static dirtyIds: Set<string> = new Set();

  private static async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error("Error creating data directory:", error);
    }
  }

  private static async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.ensureDataDir();

    let rawInvoices: Invoice[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const mongoDocs = await InvoiceMongoModel.find({}).lean();
        if (mongoDocs && mongoDocs.length > 0) {
          rawInvoices = mongoDocs as any[];
        }
      } catch (err) {
        console.warn("MongoDB Atlas fetch warning for invoices:", err);
      }
    }

    if (rawInvoices.length === 0) {
      try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        rawInvoices = JSON.parse(data);
      } catch (error) {
        rawInvoices = SEED_INVOICES;
      }
    }

    // Filter out corrupted / blank invoices (e.g. 0 rent and missing tenant name)
    const validInvoices = rawInvoices.filter(
      (inv) =>
        inv.tenantName &&
        inv.tenantName.trim() !== "" &&
        inv.tenantName !== "Resident Name" &&
        ((Number(inv.rentAmount) || 0) > 0 || (Number(inv.paidAmount) || 0) > 0)
    );

    // Normalize building names to current standard
    validInvoices.forEach((inv) => {
      const b = (inv.building || "").toLowerCase().trim();
      if (b === "pg a" || b === "pg shripadpglux-a" || b === "pg shripadlux-a" || !inv.building) {
        inv.building = "PG ShripadLux-A wing";
        this.dirtyIds.add(inv.id);
      }
    });

    this.cache = validInvoices;
    this.isInitialized = true;

    // Save compacted clean state to disk
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.cache), "utf-8");
    } catch {}
  }

  public static async getAll(): Promise<Invoice[]> {
    await this.init();
    return [...this.cache];
  }

  public static async saveAll(invoices: Invoice[]): Promise<void> {
    await this.init();
    this.cache = invoices;
    for (const inv of invoices) {
      this.dirtyIds.add(inv.id);
    }
    await this.saveToFile();
  }

  private static async saveToFile(): Promise<void> {
    await this.ensureDataDir();
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.cache), "utf-8");
    } catch (err) {
      console.error("Error saving invoices to file:", err);
    }

    // Dirty-document tracking: only sync changed documents to Atlas
    if (mongoose.connection.readyState === 1 && this.dirtyIds.size > 0) {
      try {
        const dirtyDocs = this.cache.filter((inv) => this.dirtyIds.has(inv.id));
        if (dirtyDocs.length > 0) {
          const ops = dirtyDocs.map((inv) => ({
            updateOne: {
              filter: { id: inv.id },
              update: { $set: DBOptimizationService.compactDocument(inv) },
              upsert: true,
            },
          }));
          await InvoiceMongoModel.bulkWrite(ops);
          console.log(`🍃 Synced ${dirtyDocs.length} changed invoices to MongoDB Atlas (dirty-tracking).`);
        }
        this.dirtyIds.clear();
      } catch (err) {
        console.error("Failed to sync invoices to MongoDB Atlas:", err);
      }
    }
  }

  public static async getById(id: string): Promise<Invoice | null> {
    const invoices = await this.getAll();
    return invoices.find((inv) => inv.id === id || inv.invoiceNo === id) || null;
  }

  public static async getByResidentId(residentId: string): Promise<Invoice[]> {
    const invoices = await this.getAll();
    if (!residentId) return invoices;
    const query = residentId.toLowerCase().trim();
    const queryDigits = residentId.replace(/\D/g, "");

    return invoices.filter((inv: any) => {
      // 1. Direct booking / resident ID match
      if (inv.residentId && inv.residentId === residentId) return true;
      if (inv.id && (inv.id === residentId || inv.id.includes(residentId))) return true;
      if (inv._id && String(inv._id) === residentId) return true;

      // 2. Phone match (normalized digits)
      const invDigits = (inv.contact || inv.phone || "").replace(/\D/g, "");
      if (queryDigits.length >= 6 && invDigits.length >= 6 && (invDigits.includes(queryDigits) || queryDigits.includes(invDigits))) return true;

      // 3. Email match (excluding generic placeholders)
      if (inv.email && inv.email.toLowerCase().trim() === query && query !== "na@gmail.com") return true;

      // 4. Name match (case-insensitive)
      if (inv.tenantName && (inv.tenantName.toLowerCase().includes(query) || query.includes(inv.tenantName.toLowerCase()))) return true;

      return false;
    });
  }

  public static async createOrUpdate(invoiceData: Partial<Invoice>): Promise<Invoice> {
    await this.init();
    const now = new Date().toISOString();

    const rentAmount = Number(invoiceData.rentAmount) || 0;
    const paidAmount = Number(invoiceData.paidAmount) || 0;
    const balanceDue = Math.max(0, rentAmount - paidAmount);

    let status: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
    if (balanceDue === 0 && rentAmount > 0) {
      status = "PAID";
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    }

    const existingIndex = this.cache.findIndex(
      (inv) =>
        (invoiceData.id && inv.id === invoiceData.id) ||
        (invoiceData.invoiceNo && inv.invoiceNo === invoiceData.invoiceNo)
    );

    if (existingIndex !== -1) {
      const updated: Invoice = {
        ...this.cache[existingIndex],
        ...invoiceData,
        rentAmount,
        paidAmount,
        balanceDue,
        status,
        updatedAt: now,
      };
      this.cache[existingIndex] = updated;
      this.dirtyIds.add(updated.id);
      await this.saveToFile();
      return updated;
    } else {
      const newInvoice: Invoice = {
        id: invoiceData.id || `inv_${Date.now()}`,
        invoiceNo: invoiceData.invoiceNo || `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        residentId: invoiceData.residentId || "",
        tenantName: invoiceData.tenantName || "Resident Name",
        contact: invoiceData.contact || "",
        email: invoiceData.email || "",
        building: invoiceData.building || "",
        floor: invoiceData.floor || "",
        room: invoiceData.room || "",
        bed: invoiceData.bed || "",
        date: invoiceData.date || new Date().toISOString().split("T")[0],
        dueDate: invoiceData.dueDate || new Date().toISOString().split("T")[0],
        rentAmount,
        paidAmount,
        balanceDue,
        paymentModes: invoiceData.paymentModes || ["UPI"],
        splitAmounts: invoiceData.splitAmounts,
        notes: invoiceData.notes || "",
        status,
        createdAt: now,
        updatedAt: now,
      };

      this.cache.unshift(newInvoice);
      this.dirtyIds.add(newInvoice.id);
      await this.saveToFile();
      return newInvoice;
    }
  }

  public static async delete(id: string): Promise<boolean> {
    await this.init();
    const initialLength = this.cache.length;
    this.cache = this.cache.filter((inv) => inv.id !== id && inv.invoiceNo !== id);
    if (this.cache.length !== initialLength) {
      await this.saveToFile();
      // Remove orphan from MongoDB Atlas
      if (mongoose.connection.readyState === 1) {
        try {
          await InvoiceMongoModel.deleteOne({ $or: [{ id }, { invoiceNo: id }] });
        } catch (err) {
          console.warn("Failed to delete invoice orphan from Atlas:", err);
        }
      }
      return true;
    }
    return false;
  }

  /**
   * When a building is renamed, update all past invoices' building field to the new name.
   */
  public static async updateBuildingNames(oldName: string, newName: string): Promise<number> {
    await this.init();
    let count = 0;
    const oldClean = oldName.trim().toLowerCase();

    for (const inv of this.cache) {
      const bld = (inv.building || "").trim().toLowerCase();
      if (bld === oldClean || bld === "pg a" || bld === "pg shripadpglux-a" || bld === "pg shripadlux-a") {
        inv.building = newName;
        this.dirtyIds.add(inv.id);
        count++;
      }
    }

    if (count > 0) {
      await this.saveToFile();
      console.log(`🧾 Cascaded building rename in ${count} invoices: "${oldName}" → "${newName}"`);
    }
    return count;
  }
}


