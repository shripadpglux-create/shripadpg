import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import {
  BookingMongoModel,
  BuildingMongoModel,
  StaffMongoModel,
  ExpenseMongoModel,
  InvoiceMongoModel,
  SettingMongoModel,
} from "./schemas/mongoSchemas.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import buildingRoutes from "./routes/buildingRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas Database
connectDB();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));

// Static uploads serving
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Root route for Render service health checks
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Shripad PG Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookings", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", buildingRoutes);
app.use("/api", staffRoutes);
app.use("/api", expenseRoutes);

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Shripad PG Backend API",
    timestamp: new Date().toISOString(),
  });
});

// Database diagnostics health endpoint
app.get("/api/health/db", async (_req: Request, res: Response) => {
  const readyStateMap = ["disconnected", "connected", "connecting", "disconnecting"];
  const stateStr = readyStateMap[mongoose.connection.readyState] || "unknown";

  let counts = { bookings: 0, buildings: 0, staff: 0, expenses: 0, invoices: 0, settings: 0 };
  let errorMsg = null;

  if (mongoose.connection.readyState === 1) {
    try {
      counts = {
        bookings: await BookingMongoModel.countDocuments(),
        buildings: await BuildingMongoModel.countDocuments(),
        staff: await StaffMongoModel.countDocuments(),
        expenses: await ExpenseMongoModel.countDocuments(),
        invoices: await InvoiceMongoModel.countDocuments(),
        settings: await SettingMongoModel.countDocuments(),
      };
    } catch (e: any) {
      errorMsg = e.message;
    }
  }

  res.json({
    status: mongoose.connection.readyState === 1 ? "ok" : "warning",
    mongoConnectionState: mongoose.connection.readyState,
    mongoConnectionStatus: stateStr,
    database: mongoose.connection.name || "shripad_pg",
    counts,
    error: errorMsg,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
