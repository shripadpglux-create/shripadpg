import mongoose, { Schema } from "mongoose";

// 1. Booking Mongoose Schema
const bookingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, default: "", index: true },
    name: { type: String, required: true, index: true },
    email: { type: String, default: "", index: true },
    phone: { type: String, default: "", index: true },
    guardianPhone: { type: String, default: "" },
    building: { type: String, default: "", index: true },
    roomType: { type: String, default: "" },
    source: { type: String, default: "manual", index: true },
    status: { type: String, default: "pending", index: true },
    createdById: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    createdByRole: { type: String, default: "admin" },
    gender: { type: String, default: "" },
    foodPreference: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    rentAmount: { type: Number, default: 0 },
    monthlyRent: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    paidDepositAmount: { type: Number, default: 0 },
    depositStatus: { type: String, default: "pending" },
    depositRefundDetails: { type: Schema.Types.Mixed, default: null },
    rentStartDate: { type: String, default: "" },
    checkoutDate: { type: String, default: "" },
    stayType: { type: String, default: "monthly" },
    allocatedBuilding: { type: String, default: "", index: true },
    allocatedFloor: { type: Number, default: null },
    allocatedRoom: { type: String, default: "", index: true },
    allocatedBed: { type: String, default: "" },
    customerId: { type: String, default: "" },
    customerPassword: { type: String, default: "" },
    documents: { type: String, default: "" },
    idProofType: { type: String, default: "" },
    idProofNumber: { type: String, default: "" },
    idProofPhotoUrl: { type: String, default: "" },
    userPhotoUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    paymentHistory: { type: Array, default: [] },
    complaintHistory: { type: Array, default: [] },
    payments: { type: Array, default: [] },
    complaints: { type: Array, default: [] },
    depositRefund: { type: Object, default: null },
    checkedOutAt: { type: String, default: "" },
  },
  { timestamps: true, strict: false, versionKey: false }
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
    roomBeds: { type: Object, default: {} },
    blockedRooms: { type: Array, default: [] },
  },
  { timestamps: true, strict: false, versionKey: false }
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
  { timestamps: true, strict: false, versionKey: false }
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
  { timestamps: true, strict: false, versionKey: false }
);

expenseSchema.index({ building: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });

// 5. Invoice Mongoose Schema
const invoiceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    invoiceNo: { type: String, required: true, index: true },
    residentId: { type: String, default: "", index: true },
    tenantName: { type: String, default: "", index: true },
    residentName: { type: String, default: "", index: true },
    contact: { type: String, default: "", index: true },
    phone: { type: String, default: "", index: true },
    email: { type: String, default: "" },
    building: { type: String, default: "", index: true },
    floor: { type: String, default: "" },
    room: { type: String, default: "" },
    roomNo: { type: String, default: "" },
    bed: { type: String, default: "" },
    date: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    rentAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentModes: { type: Array, default: ["UPI"] },
    notes: { type: String, default: "" },
    status: { type: String, default: "PAID", index: true },
  },
  { timestamps: true, strict: false, versionKey: false }
);

invoiceSchema.index({ building: 1, date: -1 });
invoiceSchema.index({ tenantName: 1, contact: 1 });

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
  { timestamps: true, strict: false, versionKey: false }
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
  { timestamps: true, strict: false, versionKey: false }
);

// 8. WhatsApp Baileys Multi-Device Persistent Auth State Backup Schema
const whatsAppAuthBackupSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    authFiles: { type: Schema.Types.Mixed, default: {} },
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
