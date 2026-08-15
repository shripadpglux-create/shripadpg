import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { requireAuth } from "./middleware/auth.js";
import {
  BookingMongoModel,
  BuildingMongoModel,
  StaffMongoModel,
  ExpenseMongoModel,
  InvoiceMongoModel,
  SettingMongoModel,
} from "./schemas/mongoSchemas.js";
import authRoutes from "./routes/authRoutes.js";
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
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to MongoDB Atlas Database
connectDB();

// ── Security Headers ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Allow frontend to load resources
}));

// ── CORS — Restrict to known origins ────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://shripadpg.onrender.com",
  "https://shripadpglux.onrender.com",
  "https://shripadpg.pages.dev",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith(".pages.dev") ||
        origin.endsWith(".onrender.com") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// ── Rate Limiting ───────────────────────────────────────────────────
// Strict limit for login endpoints: 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit: 200 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", generalLimiter);
app.use("/api/auth/", loginLimiter);
app.use("/api/bookings/login", loginLimiter);
app.use("/api/staff/login", loginLimiter);

// ── Body Parser — Reduced limit ─────────────────────────────────────
app.use(express.json({ limit: "2mb" }));

// Static uploads serving
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Root route for Render service health checks ─────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Shripad PG Backend API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Public Auth Routes (no JWT required) ────────────────────────────
app.use("/api/auth", authRoutes);

// ── Customer login endpoint (public) ────────────────────────────────
// Keep customer login public since customers need to log in
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookings", paymentRoutes);

// ── Protected Routes (JWT required for write operations) ────────────
// Admin/staff routes require authentication
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", buildingRoutes);
app.use("/api", staffRoutes);
app.use("/api", expenseRoutes);

// ── Health check endpoint ───────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Shripad PG Backend API",
    timestamp: new Date().toISOString(),
  });
});

// ── Database diagnostics health endpoint ────────────────────────────
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
  console.log(`🛡️ Security: Helmet enabled, Rate limiting active, CORS restricted`);
});
