import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { StaffModel } from "../models/staffModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { generateCustomerCredentials } from "../services/credentialService.js";
import { signToken } from "../middleware/auth.js";

// Admin credentials stored server-side only (move to env vars in production)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shripadpglux@gmail.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("shripad@7444", 10);

export class AuthController {
  /**
   * Unified Portal Login — strictly authenticates Admin, Staff, or Resident/Customer
   * with automatic role detection or explicit role filtering.
   */
  public static async unifiedLogin(req: Request, res: Response) {
    try {
      const { identifier, password, roleHint } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Identifier (Email/ID/Phone) and Password are required.",
        });
      }

      const cleanId = String(identifier).trim();
      const cleanIdLower = cleanId.toLowerCase();
      const cleanPhone = cleanId.replace(/\D/g, "");
      const cleanPass = String(password).trim();
      const cleanRoleHint = String(roleHint || "auto").trim().toLowerCase();

      // ── Tier 1: Check Super Admin ──────────────────────────────────────────
      if (cleanRoleHint === "auto" || cleanRoleHint === "admin" || cleanRoleHint === "all") {
        if (
          cleanIdLower === ADMIN_EMAIL.toLowerCase() ||
          cleanIdLower === "admin" ||
          cleanIdLower === "superadmin"
        ) {
          const isValid = bcrypt.compareSync(cleanPass, ADMIN_PASSWORD_HASH);
          if (isValid) {
            const token = signToken({
              id: "admin_master",
              email: ADMIN_EMAIL,
              role: "super_admin",
            });

            return res.json({
              success: true,
              role: "super_admin",
              message: "Welcome back, Master Admin!",
              token,
              redirectUrl: "/admin/dashboard",
              user: {
                id: "admin_master",
                name: "Master Admin",
                email: ADMIN_EMAIL,
                role: "super_admin",
              },
            });
          }
        }

        // Also check staff table for super_admin members
        const superStaff = await StaffModel.authenticateSecure(cleanIdLower, cleanPass);
        if (superStaff && superStaff.role === "super_admin" && superStaff.status !== "inactive") {
          const token = signToken({
            id: superStaff.id,
            email: superStaff.email,
            role: superStaff.role,
          });
          const { password: _, ...safeStaff } = superStaff as any;

          return res.json({
            success: true,
            role: "super_admin",
            message: `Welcome back, ${superStaff.name}!`,
            token,
            redirectUrl: "/admin/dashboard",
            user: safeStaff,
          });
        }
      }

      // ── Tier 2: Check Staff Members ─────────────────────────────────────────
      if (cleanRoleHint === "auto" || cleanRoleHint === "staff" || cleanRoleHint === "all") {
        const staffMember = await StaffModel.authenticateSecure(cleanIdLower, cleanPass);
        if (staffMember && staffMember.status !== "inactive") {
          const token = signToken({
            id: staffMember.id,
            email: staffMember.email,
            role: staffMember.role,
          });
          const { password: _, ...safeStaff } = staffMember as any;
          const isSuper = staffMember.role === "super_admin";

          return res.json({
            success: true,
            role: staffMember.role,
            message: `Welcome back, ${staffMember.name}!`,
            token,
            redirectUrl: isSuper ? "/admin/dashboard" : "/staff",
            user: safeStaff,
            staff: safeStaff,
          });
        }
      }

      // ── Tier 3: Check Resident Bookings ─────────────────────────────────────
      if (
        cleanRoleHint === "auto" ||
        cleanRoleHint === "resident" ||
        cleanRoleHint === "customer" ||
        cleanRoleHint === "all"
      ) {
        const bookings = await BookingModel.getAll();
        const match = bookings.find((b) => {
          const generated = generateCustomerCredentials(b.name, b.phone);
          const effectiveCustId = (b.customerId || generated.customerId).toLowerCase();
          const effectivePassword = b.customerPassword || generated.customerPassword;
          const effectivePhone = (b.phone || "").replace(/\D/g, "");

          const idMatches =
            effectiveCustId === cleanIdLower ||
            (cleanPhone.length >= 7 && (effectivePhone === cleanPhone || effectivePhone.endsWith(cleanPhone)));
          const passMatches = effectivePassword === cleanPass;

          return idMatches && passMatches;
        });

        if (match) {
          return res.json({
            success: true,
            role: "resident",
            message: `Welcome back, ${match.name}!`,
            redirectUrl: "/my-rooms",
            booking: match,
            user: {
              id: match.id,
              name: match.name,
              phone: match.phone,
              room: match.allocatedRoom || match.roomType,
              building: match.allocatedBuilding || match.building,
              role: "resident",
            },
          });
        }
      }

      // ── Strict Validation Failure ───────────────────────────────────────────
      let failMsg = "Invalid credentials. Please verify your Email, Customer ID, or Mobile number, and Password.";
      if (cleanRoleHint === "admin") {
        failMsg = "Invalid Admin credentials. Please check your admin username/email and password.";
      } else if (cleanRoleHint === "staff") {
        failMsg = "Invalid Staff credentials. Please verify your staff email or registered phone and assigned password.";
      } else if (cleanRoleHint === "resident" || cleanRoleHint === "customer") {
        failMsg = "Invalid Resident credentials. Please check your Customer ID or registered mobile and password.";
      }

      return res.status(401).json({
        success: false,
        message: failMsg,
      });
    } catch (error: any) {
      console.error("Unified login error:", error);
      res.status(500).json({ success: false, message: "Authentication failed. Please try again." });
    }
  }

  /**
   * Admin login — validates credentials server-side and returns JWT.
   */
  public static async adminLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Check hardcoded super admin
      if (cleanEmail === ADMIN_EMAIL.toLowerCase() || cleanEmail === "admin") {
        const isValid = bcrypt.compareSync(cleanPass, ADMIN_PASSWORD_HASH);
        if (isValid) {
          const token = signToken({
            id: "admin_master",
            email: ADMIN_EMAIL,
            role: "super_admin",
          });

          return res.json({
            success: true,
            message: "Admin authentication successful.",
            token,
            user: {
              id: "admin_master",
              name: "Master Admin",
              email: ADMIN_EMAIL,
              role: "super_admin",
            },
          });
        }
      }

      // Also try staff database for super_admin role members
      const staffMember = await StaffModel.authenticateSecure(cleanEmail, cleanPass);
      if (staffMember && staffMember.role === "super_admin") {
        const token = signToken({
          id: staffMember.id,
          email: staffMember.email,
          role: staffMember.role,
        });

        return res.json({
          success: true,
          message: `Welcome back, ${staffMember.name}!`,
          token,
          user: {
            id: staffMember.id,
            name: staffMember.name,
            email: staffMember.email,
            role: staffMember.role,
          },
        });
      }

      return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ success: false, message: "Authentication failed." });
    }
  }

  /**
   * Staff login — validates credentials server-side and returns JWT.
   */
  public static async staffLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }

      const staffMember = await StaffModel.authenticateSecure(email.trim().toLowerCase(), password.trim());
      if (!staffMember) {
        return res.status(401).json({ success: false, message: "Invalid email or password." });
      }

      const token = signToken({
        id: staffMember.id,
        email: staffMember.email,
        role: staffMember.role,
      });

      // Return staff info without password
      const { password: _, ...safeStaff } = staffMember as any;

      res.json({
        success: true,
        message: `Welcome back, ${staffMember.name}!`,
        token,
        staff: safeStaff,
      });
    } catch (error: any) {
      console.error("Staff login error:", error);
      res.status(500).json({ success: false, message: "Login failed." });
    }
  }

  /**
   * Verify an existing token is still valid.
   */
  public static async verifySession(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid session." });
      }
      res.json({
        success: true,
        message: "Session is valid.",
        user,
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: "Session verification failed." });
    }
  }
}
