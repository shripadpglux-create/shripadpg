import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { StaffModel } from "../models/staffModel.js";
import { signToken } from "../middleware/auth.js";

// Admin credentials stored server-side only (move to env vars in production)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shripadpglux@gmail.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("shripad@7444", 10);

export class AuthController {
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
