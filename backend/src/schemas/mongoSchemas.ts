import mongoose, { Schema } from "mongoose";

// 1. Booking Mongoose Schema
const bookingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, default: "", index: true },
    name: { type: String, required: true, index: true },
    email: { type: String, default: "", index: true },
    phone: { type: String, default: "", index: true },
    building: { type: String, default: "", index: true },
    roomType: { type: String, default: "" },
    source: { type: String, default: "manual", index: true },
    status: { type: String, default: "pending", index: true },
    createdById: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    gender: { type: String, default: "" },
    foodPreference: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    monthlyRent: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    paidDepositAmount: { type: Number, default: 0 },
    allocatedBuilding: { type: String, default: "", index: true },
    allocatedFloor: { type: Number, default: null },
    allocatedRoom: { type: String, default: "", index: true },
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
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

// Compound Production Indexes for Bookings
bookingSchema.index({ building: 1, status: 1 });
bookingSchema.index({ allocatedBuilding: 1, status: 1 });
bookingSchema.index({ phone: 1, email: 1 });
bookingSchema.index({ createdAt: -1 });

// 2. Building Mongoose Schema
const buildingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    floors: { type: Number, default: 4 },
    roomsPerFloor: { type: Number, default: 4 },
    floorRoomCounts: { type: Object, default: {} },
    blockedRooms: { type: Array, default: [] },
  },
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

// 3. Staff Mongoose Schema
const staffSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "", index: true },
    email: { type: String, default: "", index: true },
    password: { type: String, default: "" },
    role: { type: String, default: "building_manager", index: true },
    assignedBuildings: { type: Array, default: ["PG A"] },
    status: { type: String, default: "active", index: true },
  },
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

staffSchema.index({ email: 1, status: 1 });

// 4. Expense Mongoose Schema
const expenseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: "other", index: true },
    amount: { type: Number, required: true },
    date: { type: String, default: "", index: true },
    building: { type: String, default: "", index: true },
    notes: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

expenseSchema.index({ building: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });

// 5. Invoice Mongoose Schema
const invoiceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    invoiceNo: { type: String, required: true, index: true },
    residentName: { type: String, default: "", index: true },
    phone: { type: String, default: "", index: true },
    email: { type: String, default: "" },
    building: { type: String, default: "", index: true },
    roomNo: { type: String, default: "" },
    month: { type: String, default: "", index: true },
    year: { type: Number, default: 2026, index: true },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "cash" },
    status: { type: String, default: "paid", index: true },
    date: { type: String, default: "" },
    items: { type: Array, default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

invoiceSchema.index({ building: 1, year: -1, month: -1 });
invoiceSchema.index({ residentName: 1, phone: 1 });

// 6. Settings Mongoose Schema
const settingSchema = new Schema(
  {
    id: { type: String, default: "global_settings", unique: true, index: true },
    manualBookingSheetUrl: { type: String, default: "" },
    onlineBookingSheetUrl: { type: String, default: "" },
    upiId: { type: String, default: "shripadpg@okaxis" },
    qrCodeUrl: { type: String, default: "" },
    bankName: { type: String, default: "Axis Bank Ltd" },
    accountNo: { type: String, default: "924020058192041" },
    ifscCode: { type: String, default: "UTIB0001824" },
    accountName: { type: String, default: "Shripad PG Services" },
  },
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

// 7. WhatsApp Templates & Chatbot Mongoose Schema
const whatsAppTemplateSchema = new Schema(
  {
    id: { type: String, default: "global_whatsapp_templates", unique: true, index: true },
    invoiceMessage: { type: String, default: "" },
    complaintUpdateMessage: { type: String, default: "" },
    paymentConfirmationMessage: { type: String, default: "" },
    welcomeAllotmentMessage: { type: String, default: "" },
    chatbotEnabled: { type: Boolean, default: true },
    chatbotGreetingMessage: { type: String, default: "" },
    chatbotLocations: { type: Array, default: [] },
    chatbotDefaultReply: { type: String, default: "" },
  },
  { timestamps: true, strict: true, versionKey: false, minimize: true }
);

export const BookingMongoModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export const BuildingMongoModel = mongoose.models.Building || mongoose.model("Building", buildingSchema);
export const StaffMongoModel = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export const ExpenseMongoModel = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
export const InvoiceMongoModel = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export const SettingMongoModel = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export const WhatsAppTemplateMongoModel = mongoose.models.WhatsAppTemplate || mongoose.model("WhatsAppTemplate", whatsAppTemplateSchema);
