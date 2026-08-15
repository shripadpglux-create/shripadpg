import { Request, Response } from "express";
import { ExpenseModel } from "../models/expenseModel.js";

export class ExpenseController {
  public static async getAll(_req: Request, res: Response) {
    try {
      const expenses = await ExpenseModel.getAll();
      res.json({ success: true, expenses });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to fetch expenses.", error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { title, category, amount, date, building, notes, createdBy } = req.body;
      if (!title || amount === undefined) {
        return res.status(400).json({ success: false, message: "Title and Amount are required fields." });
      }

      const expense = await ExpenseModel.create({
        title,
        category,
        amount: Number(amount),
        date,
        building,
        notes,
        createdBy,
      });

      const expenses = await ExpenseModel.getAll();
      res.status(201).json({
        success: true,
        message: "Expense entry recorded successfully.",
        expense,
        expenses,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to save expense.", error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const updated = await ExpenseModel.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Expense record not found." });
      }

      const expenses = await ExpenseModel.getAll();
      res.json({
        success: true,
        message: "Expense record updated successfully.",
        expense: updated,
        expenses,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update expense.", error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await ExpenseModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Expense record not found." });
      }

      const expenses = await ExpenseModel.getAll();
      res.json({
        success: true,
        message: "Expense record deleted successfully.",
        expenses,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to delete expense.", error: error.message });
    }
  }
}
