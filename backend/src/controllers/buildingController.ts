import { Request, Response } from "express";
import { BuildingModel } from "../models/buildingModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { InvoiceModel } from "../models/invoiceModel.js";
import { ExpenseModel } from "../models/expenseModel.js";

export class BuildingController {
  public static async getAll(req: Request, res: Response) {
    try {
      const buildings = await BuildingModel.getAll();
      res.json({ success: true, buildings });
    } catch (error: any) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ success: false, message: "Failed to fetch buildings", error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, floors, roomsPerFloor, floorRoomCounts, roomBeds, blockedRooms } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: "Building name is required." });
      }

      const building = await BuildingModel.create({
        name,
        floors: Number(floors) || 4,
        roomsPerFloor: Number(roomsPerFloor) || 4,
        floorRoomCounts,
        roomBeds,
        blockedRooms,
      });

      const buildings = await BuildingModel.getAll();

      res.status(201).json({
        success: true,
        message: `Building '${building.name}' created successfully.`,
        building,
        buildings,
      });
    } catch (error: any) {
      console.error("Error creating building:", error);
      res.status(500).json({ success: false, message: "Failed to create building", error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const nameOrId = req.params.name as string;
      const { name, floors, roomsPerFloor, floorRoomCounts, roomBeds, blockedRooms } = req.body;

      const updated = await BuildingModel.update(nameOrId, {
        name,
        floors: floors !== undefined ? Number(floors) : undefined,
        roomsPerFloor: roomsPerFloor !== undefined ? Number(roomsPerFloor) : undefined,
        floorRoomCounts,
        roomBeds,
        blockedRooms,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: `Building '${nameOrId}' not found.` });
      }

      // If the building was renamed, cascade the new name to all residents, invoices, and expenses
      const oldName = decodeURIComponent(nameOrId).trim();
      if (updated.name && updated.name.trim().toLowerCase() !== oldName.toLowerCase()) {
        const bCount = await BookingModel.updateBuildingNames(oldName, updated.name.trim());
        const iCount = await InvoiceModel.updateBuildingNames(oldName, updated.name.trim());
        const eCount = await ExpenseModel.updateBuildingNames(oldName, updated.name.trim());
        console.log(`🏢 Cascaded building rename: "${oldName}" → "${updated.name}" (${bCount} residents, ${iCount} invoices, ${eCount} expenses)`);
      }

      const buildings = await BuildingModel.getAll();

      res.json({
        success: true,
        message: `Building '${updated.name}' updated successfully.`,
        building: updated,
        buildings,
      });
    } catch (error: any) {
      console.error("Error updating building:", error);
      res.status(500).json({ success: false, message: "Failed to update building", error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const nameOrId = req.params.name as string;
      const deleted = await BuildingModel.delete(nameOrId);

      if (!deleted) {
        return res.status(404).json({ success: false, message: `Building '${nameOrId}' not found.` });
      }

      const buildings = await BuildingModel.getAll();

      res.json({
        success: true,
        message: `Building '${nameOrId}' deleted successfully.`,
        buildings,
      });
    } catch (error: any) {
      console.error("Error deleting building:", error);
      res.status(500).json({ success: false, message: "Failed to delete building", error: error.message });
    }
  }
}
