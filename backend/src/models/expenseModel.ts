import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { ExpenseMongoModel } from "../schemas/mongoSchemas.js";
import { DBOptimizationService } from "../services/dbOptimizationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "expenses.json");

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  building: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export class ExpenseModel {
  private static cache: Expense[] = [];
  private static isInitialized = false;
  private static dirtyIds: Set<string> = new Set();

  private static async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([]), "utf-8");
      }
    } catch (err) {
      console.error("Error ensuring expenses data directory:", err);
    }
  }

  private static async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.ensureDataDir();

    if (mongoose.connection.readyState === 1) {
      try {
        const mongoDocs = await ExpenseMongoModel.find({}).lean();
        if (mongoDocs && mongoDocs.length > 0) {
          this.cache = mongoDocs as any[];
          this.isInitialized = true;
          return;
        }
      } catch (err) {
        console.warn("MongoDB Atlas fetch warning for expenses:", err);
      }
    }

    try {
      const content = await fs.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      this.cache = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Error reading expenses.json:", err);
      this.cache = [];
    }

    this.isInitialized = true;
  }

  public static async getAll(): Promise<Expense[]> {
    await this.init();
    return [...this.cache];
  }

  public static async saveAll(expenses: Expense[]): Promise<void> {
    await this.init();
    this.cache = expenses;
    for (const exp of expenses) {
      this.dirtyIds.add(exp.id);
    }
    await this.saveToFile();
  }

  private static async saveToFile(): Promise<void> {
    await this.ensureDataDir();
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.cache), "utf-8");
    } catch (err) {
      console.error("Error saving expenses to file:", err);
    }

    // Dirty-document tracking: only sync changed documents to Atlas
    if (mongoose.connection.readyState === 1 && this.dirtyIds.size > 0) {
      try {
        const dirtyDocs = this.cache.filter((exp) => this.dirtyIds.has(exp.id));
        if (dirtyDocs.length > 0) {
          const ops = dirtyDocs.map((exp) => ({
            updateOne: {
              filter: { id: exp.id },
              update: { $set: DBOptimizationService.compactDocument(exp) },
              upsert: true,
            },
          }));
          await ExpenseMongoModel.bulkWrite(ops);
          console.log(`🍃 Synced ${dirtyDocs.length} changed expenses to MongoDB Atlas (dirty-tracking).`);
        }
        this.dirtyIds.clear();
      } catch (err) {
        console.error("Failed to sync expenses to MongoDB Atlas:", err);
      }
    }
  }

  public static async create(data: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    await this.init();
    const newExpense: Expense = {
      id: `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: data.title || "Misc Expense",
      category: data.category || "other",
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().substring(0, 10),
      building: data.building || "PG A",
      notes: data.notes || "",
      createdBy: data.createdBy || "Master Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cache.unshift(newExpense);
    this.dirtyIds.add(newExpense.id);
    await this.saveToFile();
    return newExpense;
  }

  public static async update(id: string, data: Partial<Expense>): Promise<Expense | null> {
    await this.init();
    const index = this.cache.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const existing = this.cache[index];
    const updated: Expense = {
      ...existing,
      title: data.title !== undefined ? data.title : existing.title,
      category: data.category !== undefined ? data.category : existing.category,
      amount: data.amount !== undefined ? Number(data.amount) : existing.amount,
      date: data.date !== undefined ? data.date : existing.date,
      building: data.building !== undefined ? data.building : existing.building,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.cache[index] = updated;
    this.dirtyIds.add(updated.id);
    await this.saveToFile();
    return updated;
  }

  public static async delete(id: string): Promise<boolean> {
    await this.init();
    const initialLen = this.cache.length;
    this.cache = this.cache.filter((e) => e.id !== id);

    if (this.cache.length < initialLen) {
      await this.saveToFile();
      // Remove orphan from MongoDB Atlas
      if (mongoose.connection.readyState === 1) {
        try {
          await ExpenseMongoModel.deleteOne({ id });
        } catch (err) {
          console.warn("Failed to delete expense orphan from Atlas:", err);
        }
      }
      return true;
    }
    return false;
  }
}

