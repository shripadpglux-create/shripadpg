import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_change_me";

export interface AuthPayload {
  id: string;
  email: string;
  role: "super_admin" | "building_manager" | "caretaker" | "customer";
  iat?: number;
  exp?: number;
}

/**
 * Generate a signed JWT token for authenticated users.
 */
export function signToken(payload: Omit<AuthPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/**
 * Express middleware: require a valid JWT Bearer token.
 * Attaches decoded payload to `req.user`.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required. Please log in." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    } else {
      res.status(401).json({ success: false, message: "Invalid authentication token." });
    }
  }
}

/**
 * Express middleware: require specific roles.
 */
export function requireRole(...roles: AuthPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthPayload | undefined;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: "Insufficient permissions for this action." });
      return;
    }
    next();
  };
}
