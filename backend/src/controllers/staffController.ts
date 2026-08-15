import { Request, Response } from "express";
import { StaffModel } from "../models/staffModel.js";

export class StaffController {
  public static async getAll(req: Request, res: Response) {
    try {
      const staff = await StaffModel.getAll();
      res.json({ success: true, staff });
    } catch (error: any) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ success: false, message: "Failed to fetch staff members", error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, phone, email, password, role, assignedBuildings, status } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: "Staff member name and email are required." });
      }

      const member = await StaffModel.create({
        name,
        phone,
        email,
        password: password || "staff123",
        role,
        assignedBuildings,
        status,
      });

      const staff = await StaffModel.getAll();

      res.status(201).json({
        success: true,
        message: `Staff member '${member.name}' created with login email '${member.email}'.`,
        member,
        staff,
      });
    } catch (error: any) {
      console.error("Error creating staff member:", error);
      res.status(500).json({ success: false, message: "Failed to create staff member", error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, phone, email, password, role, assignedBuildings, status } = req.body;

      const updated = await StaffModel.update(id, {
        name,
        phone,
        email,
        password,
        role,
        assignedBuildings,
        status,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: `Staff member '${id}' not found.` });
      }

      const staff = await StaffModel.getAll();

      res.json({
        success: true,
        message: `Staff member '${updated.name}' credentials updated successfully.`,
        member: updated,
        staff,
      });
    } catch (error: any) {
      console.error("Error updating staff member:", error);
      res.status(500).json({ success: false, message: "Failed to update staff member", error: error.message });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }

      const staff = await StaffModel.authenticate(email, password);
      if (!staff) {
        return res.status(401).json({ success: false, message: "Invalid email or password. Please contact Super Admin." });
      }

      res.json({
        success: true,
        message: `Welcome back, ${staff.name}!`,
        staff,
      });
    } catch (error: any) {
      console.error("Error authenticating staff member:", error);
      res.status(500).json({ success: false, message: "Login failed", error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const deleted = await StaffModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: `Staff member '${id}' not found.` });
      }

      const staff = await StaffModel.getAll();

      res.json({
        success: true,
        message: `Staff member '${id}' deleted successfully.`,
        staff,
      });
    } catch (error: any) {
      console.error("Error deleting staff member:", error);
      res.status(500).json({ success: false, message: "Failed to delete staff member", error: error.message });
    }
  }
}
