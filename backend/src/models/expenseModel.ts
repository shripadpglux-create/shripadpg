import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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
  private static async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
      }
    } catch (err) {
      console.error("Error ensuring expenses data directory:", err);
    }
  }

  public static async getAll(): Promise<Expense[]> {
    await this.ensureDataDir();
    try {
      const content = await fs.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Error reading expenses.json:", err);
      return [];
    }
  }

  public static async saveAll(expenses: Expense[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(expenses, null, 2), "utf-8");
  }

  public static async create(data: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    const expenses = await this.getAll();
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

    expenses.unshift(newExpense);
    await this.saveAll(expenses);
    return newExpense;
  }

  public static async update(id: string, data: Partial<Expense>): Promise<Expense | null> {
    const expenses = await this.getAll();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const existing = expenses[index];
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

    expenses[index] = updated;
    await this.saveAll(expenses);
    return updated;
  }

  public static async delete(id: string): Promise<boolean> {
    let expenses = await this.getAll();
    const initialLen = expenses.length;
    expenses = expenses.filter((e) => e.id !== id);

    if (expenses.length < initialLen) {
      await this.saveAll(expenses);
      return true;
    }
    return false;
  }
}
