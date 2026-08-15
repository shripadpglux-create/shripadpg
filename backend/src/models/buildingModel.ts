import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Building {
  id: string;
  name: string;
  floors: number;
  roomsPerFloor: number;
  floorRoomCounts?: Record<number, number>;
  createdAt?: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "buildings.json");

const SEED_BUILDINGS: Building[] = [
  {
    id: "bld_pga",
    name: "PG A",
    floors: 4,
    roomsPerFloor: 4,
    floorRoomCounts: { 0: 1, 1: 4, 2: 4, 3: 4 },
  },
  {
    id: "bld_pgb",
    name: "PG B",
    floors: 4,
    roomsPerFloor: 4,
    floorRoomCounts: { 0: 1, 1: 4, 2: 4, 3: 4 },
  },
  {
    id: "bld_pgc",
    name: "PG C",
    floors: 4,
    roomsPerFloor: 4,
    floorRoomCounts: { 0: 1, 1: 4, 2: 4, 3: 4 },
  },
  {
    id: "bld_pgd",
    name: "PG D",
    floors: 4,
    roomsPerFloor: 4,
    floorRoomCounts: { 0: 1, 1: 4, 2: 4, 3: 4 },
  },
];

export class BuildingModel {
  private static cache: Building[] = [];
  private static isInitialized = false;

  private static async ensureDataFile() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify(SEED_BUILDINGS, null, 2), "utf-8");
      }
    } catch (err) {
      console.error("Error ensuring buildings data file:", err);
    }
  }

  public static async getAll(): Promise<Building[]> {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.cache = parsed;
        this.isInitialized = true;
        return this.cache;
      }
    } catch (err) {
      console.error("Error reading buildings.json:", err);
    }

    this.cache = SEED_BUILDINGS;
    this.isInitialized = true;
    await this.save(SEED_BUILDINGS);
    return this.cache;
  }

  public static async save(buildings: Building[]): Promise<void> {
    await this.ensureDataFile();
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(buildings, null, 2), "utf-8");
      this.cache = buildings;
    } catch (err) {
      console.error("Error saving buildings data:", err);
    }
  }

  public static async create(data: Partial<Building>): Promise<Building> {
    const buildings = await this.getAll();
    const newBuilding: Building = {
      id: `bld_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: data.name || "PG New",
      floors: Number(data.floors) || 4,
      roomsPerFloor: Number(data.roomsPerFloor) || 4,
      floorRoomCounts: data.floorRoomCounts || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    buildings.push(newBuilding);
    await this.save(buildings);
    return newBuilding;
  }

  public static async update(originalNameOrId: string, data: Partial<Building>): Promise<Building | null> {
    const buildings = await this.getAll();
    const targetClean = decodeURIComponent(originalNameOrId).trim().toLowerCase();
    const index = buildings.findIndex(
      (b) =>
        (b.id && b.id.trim().toLowerCase() === targetClean) ||
        (b.name && b.name.trim().toLowerCase() === targetClean)
    );

    if (index === -1) return null;

    const existing = buildings[index];
    const updated: Building = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      floors: data.floors !== undefined ? Number(data.floors) : existing.floors,
      roomsPerFloor: data.roomsPerFloor !== undefined ? Number(data.roomsPerFloor) : existing.roomsPerFloor,
      floorRoomCounts: data.floorRoomCounts !== undefined ? data.floorRoomCounts : existing.floorRoomCounts,
      updatedAt: new Date().toISOString(),
    };

    buildings[index] = updated;
    await this.save(buildings);
    return updated;
  }

  public static async delete(nameOrId: string): Promise<boolean> {
    let buildings = await this.getAll();
    const initialLen = buildings.length;
    const targetClean = decodeURIComponent(nameOrId).trim().toLowerCase();

    buildings = buildings.filter((b) => {
      const idMatch = Boolean(b.id && b.id.trim().toLowerCase() === targetClean);
      const nameMatch = Boolean(b.name && b.name.trim().toLowerCase() === targetClean);
      return !idMatch && !nameMatch;
    });

    if (buildings.length < initialLen) {
      await this.save(buildings);
      return true;
    }
    return false;
  }
}
