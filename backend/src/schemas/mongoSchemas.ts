import mongoose, { Schema } from "mongoose";

// 1. Booking Mongoose Schema - Lean & Production-Optimized
const bookingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    timestamp: { type: String },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    guardianPhone: { type: String },
    building: { type: String },
    roomType: { type: String },
    source: { type: String, default: "manual" },
    status: { type: String, default: "pending" },
    createdById: { type: String },
    createdBy: { type: String },
    createdByRole: { type: String, default: "admin" },
    gender: { type: String },
    foodPreference: { type: String },
    joiningDate: { type: String },
    rentAmount: { type: Number },
    depositAmount: { type: Number },
    paidDepositAmount: { type: Number },
    depositStatus: { type: String },
    depositRefundDetails: { type: Schema.Types.Mixed },
    rentStartDate: { type: String },
    checkoutDate: { type: String },
    stayType: { type: String, default: "monthly" },
    allocatedBuilding: { type: String },
    allocatedFloor: { type: Number },
    allocatedRoom: { type: String },
    allocatedBed: { type: String },
    customerId: { type: String },
    customerPassword: { type: String },
    documents: { type: String },
    idProofType: { type: String },
    idProofNumber: { type: String },
    idProofPhotoUrl: { type: String },
    userPhotoUrl: { type: String },
    notes: { type: String },
    paymentHistory: { type: Array, default: undefined },
    complaintHistory: { type: Array, default: undefined },
    depositRefund: { type: Object, default: undefined },
    checkedOutAt: { type: String },
  },
  { timestamps: true, strict: false, versionKey: false }
);

// High-Cardinality Production Compound Indexes for Bookings (Only 3 essential queries)
bookingSchema.index({ allocatedBuilding: 1, status: 1 });
bookingSchema.index({ phone: 1, email: 1 });
bookingSchema.index({ createdAt: -1 });

// 2. Building Mongoose Schema
const buildingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    floors: { type: Number, default: 4 },
    roomsPerFloor: { type: Number, default: 4 },
    floorRoomCounts: { type: Object, default: {} },
    roomBeds: { type: Object, default: {} },
    blockedRooms: { type: Array, default: [] },
  },
  { timestamps: true, strict: false, versionKey: false }
);

// 3. Staff Mongoose Schema
const staffSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    password: { type: String },
    plainPassword: { type: String },
    role: { type: String, default: "building_manager" },
    assignedBuildings: { type: Array, default: ["PG A"] },
    status: { type: String, default: "active" },
  },
  { timestamps: true, strict: false, versionKey: false }
);

staffSchema.index({ email: 1, status: 1 });

// 4. Expense Mongoose Schema
const expenseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, default: "other" },
    amount: { type: Number, required: true },
    date: { type: String },
    building: { type: String },
    notes: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true, strict: false, versionKey: false }
);

expenseSchema.index({ building: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });

// 5. Invoice Mongoose Schema
const invoiceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    invoiceNo: { type: String, required: true },
    residentId: { type: String },
    tenantName: { type: String },
    residentName: { type: String },
    contact: { type: String },
    phone: { type: String },
    email: { type: String },
    building: { type: String },
    floor: { type: String },
    room: { type: String },
    roomNo: { type: String },
    bed: { type: String },
    date: { type: String },
    dueDate: { type: String },
    rentAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentModes: { type: Array, default: ["UPI"] },
    notes: { type: String },
    status: { type: String, default: "PAID" },
  },
  { timestamps: true, strict: false, versionKey: false }
);

invoiceSchema.index({ building: 1, date: -1 });
invoiceSchema.index({ tenantName: 1, contact: 1 });

// 6. Settings Mongoose Schema
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
  { timestamps: true, strict: false, versionKey: false }
);

// 7. WhatsApp Templates & Chatbot Mongoose Schema
const whatsAppTemplateSchema = new Schema(
  {
    id: { type: String, default: "global_whatsapp_templates", unique: true },
    invoiceMessage: { type: String, default: "" },
    complaintUpdateMessage: { type: String, default: "" },
    paymentConfirmationMessage: { type: String, default: "" },
    welcomeAllotmentMessage: { type: String, default: "" },
    chatbotEnabled: { type: Boolean, default: true },
    chatbotGreetingMessage: { type: String, default: "" },
    chatbotLocations: { type: Array, default: [] },
    chatbotDefaultReply: { type: String, default: "" },
  },
  { timestamps: true, strict: false, versionKey: false }
);

// 8. WhatsApp Baileys Multi-Device Persistent Auth State Backup Schema (Gzip Compressed)
const whatsAppAuthBackupSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    compressedData: { type: String }, // Base64 encoded Gzip compressed JSON
    isCompressed: { type: Boolean, default: true },
    authFiles: { type: Schema.Types.Mixed }, // Backwards compatibility for legacy uncompressed records
    filesCount: { type: Number, default: 0 },
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false, versionKey: false }
);

export const BookingMongoModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export const BuildingMongoModel = mongoose.models.Building || mongoose.model("Building", buildingSchema);
export const StaffMongoModel = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export const ExpenseMongoModel = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
export const InvoiceMongoModel = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export const SettingMongoModel = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export const WhatsAppTemplateMongoModel = mongoose.models.WhatsAppTemplate || mongoose.model("WhatsAppTemplate", whatsAppTemplateSchema);
export const WhatsAppAuthBackupMongoModel = mongoose.models.WhatsAppAuthBackup || mongoose.model("WhatsAppAuthBackup", whatsAppAuthBackupSchema);

