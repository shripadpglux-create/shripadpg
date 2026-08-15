import mongoose, { Schema } from "mongoose";

// Booking Mongoose Schema
const bookingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, default: "" },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    building: { type: String, default: "" },
    roomType: { type: String, default: "" },
    source: { type: String, default: "manual" },
    status: { type: String, default: "pending" },
    createdById: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    gender: { type: String, default: "" },
    foodPreference: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    monthlyRent: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    paidDepositAmount: { type: Number, default: 0 },
    allocatedBuilding: { type: String, default: "" },
    allocatedFloor: { type: Number, default: null },
    allocatedRoom: { type: String, default: "" },
    allocatedBed: { type: String, default: "" },
    idProofType: { type: String, default: "" },
    idProofNumber: { type: String, default: "" },
    idProofPhotoUrl: { type: String, default: "" },
    userPhotoUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    payments: { type: Array, default: [] },
    complaints: { type: Array, default: [] },
    depositRefund: { type: Object, default: null },
    checkedOutAt: { type: String, default: "" },
  },
  { timestamps: true, strict: false }
);

// Building Mongoose Schema
const buildingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    floors: { type: Number, default: 4 },
    roomsPerFloor: { type: Number, default: 4 },
    floorRoomCounts: { type: Object, default: {} },
    blockedRooms: { type: Array, default: [] },
  },
  { timestamps: true, strict: false }
);

// Staff Mongoose Schema
const staffSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    role: { type: String, default: "building_manager" },
    assignedBuildings: { type: Array, default: ["PG A"] },
    status: { type: String, default: "active" },
  },
  { timestamps: true, strict: false }
);

// Expense Mongoose Schema
const expenseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: "other" },
    amount: { type: Number, required: true },
    date: { type: String, default: "" },
    building: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true, strict: false }
);

// Invoice Mongoose Schema
const invoiceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    invoiceNo: { type: String, required: true },
    residentName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    building: { type: String, default: "" },
    roomNo: { type: String, default: "" },
    month: { type: String, default: "" },
    year: { type: Number, default: 2026 },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "cash" },
    status: { type: String, default: "paid" },
    date: { type: String, default: "" },
    items: { type: Array, default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true, strict: false }
);

// Settings Mongoose Schema
const settingSchema = new Schema(
  {
    id: { type: String, default: "global_settings", unique: true },
    manualBookingSheetUrl: { type: String, default: "" },
    onlineBookingSheetUrl: { type: String, default: "" },
    upiId: { type: String, default: "shripadpg@okaxis" },
    qrCodeUrl: { type: String, default: "" },
    bankName: { type: String, default: "Axis Bank Ltd" },
    accountNo: { type: String, default: "924020058192041" },
    ifscCode: { type: String, default: "UTIB0001824" },
    accountName: { type: String, default: "Shripad PG Services" },
  },
  { timestamps: true, strict: false }
);

export const BookingMongoModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export const BuildingMongoModel = mongoose.models.Building || mongoose.model("Building", buildingSchema);
export const StaffMongoModel = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export const ExpenseMongoModel = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
export const InvoiceMongoModel = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export const SettingMongoModel = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
