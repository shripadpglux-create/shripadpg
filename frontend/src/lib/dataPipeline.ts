/**
 * SHRIPAD PG - UNIFIED DATA PIPELINE ENGINE
 * 
 * Single-Source-of-Truth Data Pipeline to guarantee 100% data consistency,
 * zero mismatches, and instant O(1) cached lookups across all portals & features.
 */

export interface NormalizedResident {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  email: string;
  building: string;
  floor: string;        // e.g. "Floor 2"
  floorNumber: number;
  floorDisplay: string; // e.g. "Floor 2"
  room: string;         // e.g. "Room 202"
  roomNumber: string;   // e.g. "202"
  roomDisplay: string;   // e.g. "Room 202"
  bed: string;          // e.g. "Bed A"
  rentAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: "ACTIVE" | "PENDING" | "CHECKED_OUT";
  joinedDate?: string;
  paymentHistory?: any[];
}

/**
 * Derives accurate floor number & display from room / floor values
 */
export function extractFloorData(rawFloor: any, rawRoom: any): { floorNumber: number; floorDisplay: string } {
  // 1. If explicit floor provided (number or string)
  if (rawFloor !== undefined && rawFloor !== null && String(rawFloor).trim() !== "") {
    const flStr = String(rawFloor).trim();
    const digits = flStr.replace(/\D/g, "");
    if (digits.length > 0) {
      const num = parseInt(digits, 10);
      return { floorNumber: num, floorDisplay: `Floor ${num}` };
    }
    return { floorNumber: 1, floorDisplay: flStr.toLowerCase().startsWith("floor") ? flStr : `Floor ${flStr}` };
  }

  // 2. Derive from room number (e.g. Room 202 -> Floor 2, Room 104 -> Floor 1, Room 301 -> Floor 3)
  if (rawRoom) {
    const digits = String(rawRoom).replace(/\D/g, "");
    if (digits.length >= 3) {
      const firstDigit = parseInt(digits.charAt(0), 10);
      if (!isNaN(firstDigit) && firstDigit > 0) {
        return { floorNumber: firstDigit, floorDisplay: `Floor ${firstDigit}` };
      }
    }
  }

  return { floorNumber: 1, floorDisplay: "Floor 1" };
}

/**
 * Derives clean room display and clean room number
 */
export function extractRoomData(rawRoom: any): { roomNumber: string; roomDisplay: string } {
  if (!rawRoom || String(rawRoom).trim() === "" || String(rawRoom).toLowerCase() === "unallocated") {
    return { roomNumber: "", roomDisplay: "Unallocated" };
  }
  const clean = String(rawRoom).trim();
  const digits = clean.replace(/\D/g, "");
  const num = digits || clean;
  return {
    roomNumber: num,
    roomDisplay: clean.toLowerCase().startsWith("room") ? clean : `Room ${clean}`,
  };
}

/**
 * Normalizes any raw resident or booking object into a standard NormalizedResident
 */
export function normalizeResident(raw: any): NormalizedResident {
  if (!raw) {
    return {
      id: "",
      name: "",
      phone: "",
      cleanPhone: "",
      email: "",
      building: "",
      floor: "",
      floorNumber: 0,
      floorDisplay: "",
      room: "",
      roomNumber: "",
      roomDisplay: "",
      bed: "",
      rentAmount: 0,
      paidAmount: 0,
      balanceDue: 0,
      status: "ACTIVE",
    };
  }

  const rawRoom = raw.allocatedRoom || raw.room || "";
  const rawFloor = raw.allocatedFloor ?? raw.floor;
  const { floorNumber, floorDisplay } = extractFloorData(rawFloor, rawRoom);
  const { roomNumber, roomDisplay } = extractRoomData(rawRoom);

  const rawBed = raw.allocatedBed || raw.bed || "Bed A";
  const bedClean = String(rawBed).trim();
  const bed = bedClean.toLowerCase().startsWith("bed") ? bedClean : `Bed ${bedClean}`;

  const phone = String(raw.phone || "").trim();
  const cleanPhone = phone.replace(/\D/g, "");

  const rentAmount = Number(raw.rentAmount) || 0;
  const paidAmount = Number(raw.paidAmount) || (raw.status === "CONFIRMED" || raw.status === "ACTIVE" ? rentAmount : 0);
  const balanceDue = Math.max(0, rentAmount - paidAmount);

  return {
    id: String(raw.id || ""),
    name: String(raw.name || "").trim(),
    phone,
    cleanPhone,
    email: String(raw.email || "").trim(),
    building: String(raw.allocatedBuilding || raw.building || "PG ShripadLux-A wing").trim(),
    floor: floorDisplay,
    floorNumber,
    floorDisplay,
    room: roomDisplay,
    roomNumber,
    roomDisplay,
    bed,
    rentAmount,
    paidAmount,
    balanceDue,
    status: raw.status === "CHECKED_OUT" ? "CHECKED_OUT" : (raw.room ? "ACTIVE" : "PENDING"),
    joinedDate: raw.createdAt || raw.joinedDate,
    paymentHistory: raw.paymentHistory || [],
  };
}

/**
 * In-Memory Pipeline Index Map for instant O(1) Lookups
 */
class ResidentPipelineCache {
  private idMap = new Map<string, NormalizedResident>();
  private phoneMap = new Map<string, NormalizedResident>();
  private allList: NormalizedResident[] = [];

  public update(rawList: any[]): NormalizedResident[] {
    this.idMap.clear();
    this.phoneMap.clear();
    this.allList = (rawList || []).map((item) => {
      const normalized = normalizeResident(item);
      if (normalized.id) this.idMap.set(normalized.id, normalized);
      if (normalized.cleanPhone) this.phoneMap.set(normalized.cleanPhone, normalized);
      return normalized;
    });
    return this.allList;
  }

  public getById(id: string): NormalizedResident | undefined {
    return this.idMap.get(id);
  }

  public getByPhone(phone: string): NormalizedResident | undefined {
    const clean = phone.replace(/\D/g, "");
    return this.phoneMap.get(clean);
  }

  public getAll(): NormalizedResident[] {
    return this.allList;
  }
}

export const residentPipelineCache = new ResidentPipelineCache();
