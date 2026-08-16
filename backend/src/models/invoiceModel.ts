import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { InvoiceMongoModel } from "../schemas/mongoSchemas.js";

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
  notes: string;
  status: "PAID" | "PARTIAL" | "UNPAID";
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "invoices.json");

const SEED_INVOICES: Invoice[] = [];

export class InvoiceModel {
  private static async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error("Error creating data directory:", error);
    }
  }

  public static async getAll(): Promise<Invoice[]> {
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

    // If cleaned list is different from raw list, sync back
    if (validInvoices.length !== rawInvoices.length) {
      void this.saveAll(validInvoices).catch(() => {});
    }

    return validInvoices;
  }

  public static async saveAll(invoices: Invoice[]): Promise<void> {
    await this.ensureDataDir();
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(invoices, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving invoices to file:", err);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await InvoiceMongoModel.deleteMany({});
        if (invoices.length > 0) {
          await InvoiceMongoModel.insertMany(invoices);
        }
        console.log(`🍃 Synced ${invoices.length} invoices to MongoDB Atlas.`);
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
    return invoices.filter(
      (inv) =>
        inv.residentId === residentId ||
        (inv.tenantName && inv.tenantName.toLowerCase().includes(residentId.toLowerCase()))
    );
  }

  public static async createOrUpdate(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoices = await this.getAll();
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

    const existingIndex = invoices.findIndex(
      (inv) =>
        (invoiceData.id && inv.id === invoiceData.id) ||
        (invoiceData.invoiceNo && inv.invoiceNo === invoiceData.invoiceNo)
    );

    if (existingIndex !== -1) {
      const updated: Invoice = {
        ...invoices[existingIndex],
        ...invoiceData,
        rentAmount,
        paidAmount,
        balanceDue,
        status,
        updatedAt: now,
      };
      invoices[existingIndex] = updated;
      await this.saveAll(invoices);
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
        notes: invoiceData.notes || "",
        status,
        createdAt: now,
        updatedAt: now,
      };

      invoices.unshift(newInvoice);
      await this.saveAll(invoices);
      return newInvoice;
    }
  }

  public static async delete(id: string): Promise<boolean> {
    let invoices = await this.getAll();
    const initialLength = invoices.length;
    invoices = invoices.filter((inv) => inv.id !== id && inv.invoiceNo !== id);
    if (invoices.length < initialLength) {
      await this.saveAll(invoices);
      return true;
    }
    return false;
  }
}
