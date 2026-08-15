import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { StaffMongoModel } from "../schemas/mongoSchemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  role: "super_admin" | "building_manager" | "caretaker";
  assignedBuildings: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "staff.json");

const SEED_STAFF: StaffMember[] = [
  {
    id: "staff_super",
    name: "Master Admin",
    phone: "9876543210",
    email: "admin@shripadpg.com",
    password: "admin123",
    role: "super_admin",
    assignedBuildings: ["ALL"],
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export class StaffModel {
  private static cache: StaffMember[] = [];

  private static async ensureDataFile() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify(SEED_STAFF, null, 2), "utf-8");
      }
    } catch (err) {
      console.error("Error ensuring staff data file:", err);
    }
  }

  public static async getAll(): Promise<StaffMember[]> {
    await this.ensureDataFile();

    if (mongoose.connection.readyState === 1) {
      try {
        const mongoDocs = await StaffMongoModel.find({}).lean();
        if (mongoDocs && mongoDocs.length > 0) {
          this.cache = mongoDocs as any[];
          await fs.writeFile(DATA_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
          return this.cache;
        }
      } catch (err) {
        console.warn("MongoDB Atlas fetch warning for staff:", err);
      }
    }

    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.cache = parsed;
        return this.cache;
      }
    } catch (err) {
      console.error("Error reading staff.json:", err);
    }

    this.cache = SEED_STAFF;
    await this.save(SEED_STAFF);
    return this.cache;
  }

  public static async save(staff: StaffMember[]): Promise<void> {
    await this.ensureDataFile();
    this.cache = staff;
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(staff, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving staff data:", err);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await StaffMongoModel.deleteMany({});
        if (staff.length > 0) {
          await StaffMongoModel.insertMany(staff);
        }
        console.log(`🍃 Synced ${staff.length} staff members to MongoDB Atlas.`);
      } catch (err) {
        console.error("Failed to sync staff to MongoDB Atlas:", err);
      }
    }
  }

  public static async create(data: Partial<StaffMember>): Promise<StaffMember> {
    const staffList = await this.getAll();
    const newStaff: StaffMember = {
      id: `staff_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: data.name || "New Staff Member",
      phone: data.phone || "",
      email: data.email || `staff${Date.now()}@shripadpg.com`,
      password: data.password || "staff123",
      role: data.role || "building_manager",
      assignedBuildings: Array.isArray(data.assignedBuildings) && data.assignedBuildings.length > 0 ? data.assignedBuildings : ["PG A"],
      status: data.status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    staffList.push(newStaff);
    await this.save(staffList);
    return newStaff;
  }

  public static async update(id: string, data: Partial<StaffMember>): Promise<StaffMember | null> {
    const staffList = await this.getAll();
    const index = staffList.findIndex((s) => s.id === id);

    if (index === -1) return null;

    const existing = staffList[index];
    const updated: StaffMember = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      email: data.email !== undefined ? data.email : existing.email,
      password: data.password !== undefined && data.password !== "" ? data.password : existing.password,
      role: data.role !== undefined ? data.role : existing.role,
      assignedBuildings: data.assignedBuildings !== undefined ? data.assignedBuildings : existing.assignedBuildings,
      status: data.status !== undefined ? data.status : existing.status,
      updatedAt: new Date().toISOString(),
    };

    staffList[index] = updated;
    await this.save(staffList);
    return updated;
  }

  public static async authenticate(email: string, pass: string): Promise<StaffMember | null> {
    const staffList = await this.getAll();
    const cleanEmail = email.trim().toLowerCase();
    const found = staffList.find(
      (s) => s.email.trim().toLowerCase() === cleanEmail && (s.password || "staff123") === pass.trim()
    );

    return found || null;
  }

  public static async delete(id: string): Promise<boolean> {
    let staffList = await this.getAll();
    const initialLen = staffList.length;
    staffList = staffList.filter((s) => s.id !== id);

    if (staffList.length < initialLen) {
      await this.save(staffList);
      return true;
    }
    return false;
  }
}
