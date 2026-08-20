import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { StaffMongoModel } from "../schemas/mongoSchemas.js";
import { DBOptimizationService } from "../services/dbOptimizationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  plainPassword?: string;
  role: "super_admin" | "building_manager" | "caretaker";
  assignedBuildings: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "staff.json");

const BCRYPT_ROUNDS = 10;

const SEED_STAFF: StaffMember[] = [
  {
    id: "staff_super",
    name: "Master Admin",
    phone: "9876543210",
    email: "admin@shripadpg.com",
    password: bcrypt.hashSync("admin123", BCRYPT_ROUNDS),
    plainPassword: "admin123",
    role: "super_admin",
    assignedBuildings: ["ALL"],
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Strip password hash field from a staff member for safe API responses while keeping display plainPassword for admin.
 */
export function sanitizeStaff(staff: StaffMember): StaffMember {
  const { password, ...safe } = staff;
  return {
    ...safe,
    plainPassword: staff.plainPassword || (staff.password && !staff.password.startsWith("$2") ? staff.password : undefined),
  };
}

export class StaffModel {
  private static cache: StaffMember[] = [];

  private static async ensureDataFile() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify(SEED_STAFF), "utf-8");
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

  /**
   * Return all staff without passwords — for API responses.
   */
  public static async getAllSafe(): Promise<Omit<StaffMember, "password">[]> {
    const all = await this.getAll();
    return all.map(sanitizeStaff);
  }

  public static async save(staff: StaffMember[]): Promise<void> {
    await this.ensureDataFile();
    this.cache = staff;
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(staff), "utf-8");
    } catch (err) {
      console.error("Error saving staff data:", err);
    }

    if (mongoose.connection.readyState === 1 && staff.length > 0) {
      try {
        const ops = staff.map((st) => ({
          updateOne: {
            filter: { id: st.id },
            update: { $set: DBOptimizationService.compactDocument(st) },
            upsert: true,
          },
        }));
        await StaffMongoModel.bulkWrite(ops);
        console.log(`🍃 Synced ${staff.length} compacted staff members to MongoDB Atlas via atomic bulkWrite.`);
      } catch (err) {
        console.error("Failed to sync staff to MongoDB Atlas:", err);
      }
    }
  }

  public static async create(data: Partial<StaffMember>): Promise<StaffMember> {
    const staffList = await this.getAll();

    // Hash password before storing
    const rawPassword = data.plainPassword || data.password || "staff123";
    const hashedPassword = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);

    const newStaff: StaffMember = {
      id: `staff_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: data.name || "New Staff Member",
      phone: data.phone || "",
      email: data.email || `staff${Date.now()}@shripadpg.com`,
      password: hashedPassword,
      plainPassword: rawPassword,
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

    // Hash new password if provided, otherwise keep existing hash
    let passwordValue = existing.password;
    let plainPasswordValue = existing.plainPassword;
    if (data.password !== undefined && data.password !== "") {
      plainPasswordValue = data.password;
      passwordValue = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    } else if (data.plainPassword !== undefined && data.plainPassword !== "") {
      plainPasswordValue = data.plainPassword;
      passwordValue = await bcrypt.hash(data.plainPassword, BCRYPT_ROUNDS);
    }

    const updated: StaffMember = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      email: data.email !== undefined ? data.email : existing.email,
      password: passwordValue,
      plainPassword: plainPasswordValue,
      role: data.role !== undefined ? data.role : existing.role,
      assignedBuildings: data.assignedBuildings !== undefined ? data.assignedBuildings : existing.assignedBuildings,
      status: data.status !== undefined ? data.status : existing.status,
      updatedAt: new Date().toISOString(),
    };

    staffList[index] = updated;
    await this.save(staffList);
    return updated;
  }

  /**
   * Legacy plaintext auth — kept for backward compatibility during migration.
   * @deprecated Use authenticateSecure() instead.
   */
  public static async authenticate(email: string, pass: string): Promise<StaffMember | null> {
    return this.authenticateSecure(email, pass);
  }

  /**
   * Secure authentication using bcrypt comparison.
   */
  public static async authenticateSecure(identifier: string, pass: string): Promise<StaffMember | null> {
    const staffList = await this.getAll();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.trim().replace(/\D/g, "");
    const cleanPass = pass.trim();

    for (const s of staffList) {
      const emailMatches = s.email.trim().toLowerCase() === cleanId;
      const sPhone = (s.phone || "").replace(/\D/g, "");
      const phoneMatches = cleanPhone.length >= 7 && (sPhone === cleanPhone || sPhone.endsWith(cleanPhone));

      if (!emailMatches && !phoneMatches) continue;

      const storedPass = s.password || "";

      // Try bcrypt comparison first (new hashed passwords)
      try {
        if (storedPass.startsWith("$2a$") || storedPass.startsWith("$2b$")) {
          const isMatch = await bcrypt.compare(cleanPass, storedPass);
          if (isMatch) return s;
        } else {
          // Legacy plaintext comparison — auto-migrate to hash
          if (storedPass === cleanPass) {
            // Auto-upgrade: hash the plaintext password in-place
            s.password = await bcrypt.hash(cleanPass, BCRYPT_ROUNDS);
            await this.save(staffList);
            console.log(`🔒 Auto-migrated password for staff: ${s.email}`);
            return s;
          }
        }
      } catch {
        // If bcrypt comparison fails, try plaintext as last resort
        if (storedPass === cleanPass) return s;
      }
    }

    return null;
  }

  public static async delete(id: string): Promise<boolean> {
    let staffList = await this.getAll();
    const initialLen = staffList.length;
    staffList = staffList.filter((s) => s.id !== id);

    if (staffList.length < initialLen) {
      await this.save(staffList);
      // Remove orphan from MongoDB Atlas
      if (mongoose.connection.readyState === 1) {
        try {
          await StaffMongoModel.deleteOne({ id });
        } catch (err) {
          console.warn("Failed to delete staff orphan from Atlas:", err);
        }
      }
      return true;
    }
    return false;
  }
}
