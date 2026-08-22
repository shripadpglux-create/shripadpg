import { BookingModel, Booking, RentDueCycleInfo } from "../models/bookingModel.js";
import { WhatsAppTemplateModel } from "../models/whatsappTemplateModel.js";
import { SettingsModel } from "../models/settingsModel.js";
import { WhatsAppService } from "./whatsappService.js";

export interface ReminderCandidate {
  bookingId: string;
  residentName: string;
  phone: string;
  room: string;
  bed: string;
  building: string;
  rentAmount: number;
  rentDue: number;
  dueDateFormatted: string;
  dueDateISO: string;
  daysUntilDue: number;
  daysOverdue: number;
  reminderType: "upcoming" | "due_today" | "overdue";
  alreadySentToday: boolean;
  lastReminderDate?: string;
  lastReminderType?: string;
  generatedMessage: string;
}

export interface ReminderPreviewResult {
  date: string;
  totalAllocatedResidents: number;
  upcomingCount: number;
  dueTodayCount: number;
  overdueCount: number;
  alreadyPaidCount: number;
  candidates: ReminderCandidate[];
}

export interface ReminderDispatchSummary {
  date: string;
  totalProcessed: number;
  sentCount: number;
  skippedPaid: number;
  skippedAlreadySent: number;
  failedCount: number;
  results: Array<{
    bookingId: string;
    residentName: string;
    phone: string;
    reminderType: string;
    status: "sent" | "skipped_paid" | "skipped_already_sent" | "failed";
    message?: string;
    error?: string;
  }>;
}

export class RentReminderService {
  private static cronTimer: NodeJS.Timeout | null = null;
  private static lastRunDate: string | null = null;

  /**
   * Start automated background timer on server boot
   */
  public static init() {
    if (this.cronTimer) return;

    console.log("⏰ [RentReminderService] Initializing automated daily rent reminder scheduler...");

    // Check on startup after 30 seconds
    setTimeout(() => {
      void this.checkAndRunScheduledReminders();
    }, 30000);

    // Run periodic check every 2 hours
    this.cronTimer = setInterval(() => {
      void this.checkAndRunScheduledReminders();
    }, 2 * 60 * 60 * 1000);
  }

  /**
   * Checks if current time is around morning dispatch time (9:00 AM - 11:00 AM) and runs daily batch
   */
  private static async checkAndRunScheduledReminders() {
    try {
      const now = new Date();
      // Format today in IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      const todayISO = istDate.toISOString().substring(0, 10);
      const currentHour = istDate.getUTCHours(); // Hour in IST

      // Run once per day between 9:00 AM and 12:00 PM IST
      if (currentHour >= 9 && currentHour <= 12 && this.lastRunDate !== todayISO) {
        console.log(`⏰ [RentReminderService] Triggering automated daily morning rent reminder batch for ${todayISO}...`);
        this.lastRunDate = todayISO;
        const summary = await this.sendDailyAutomatedReminders(now, false);
        console.log(`✅ [RentReminderService] Daily batch complete: ${summary.sentCount} sent, ${summary.skippedPaid} paid, ${summary.skippedAlreadySent} already notified.`);
      }
    } catch (err: any) {
      console.warn("[RentReminderService Scheduler Error]:", err?.message);
    }
  }

  /**
   * Previews upcoming, due today, and overdue rent reminder candidates for a target date
   */
  public static async getReminderPreview(targetDate = new Date()): Promise<ReminderPreviewResult> {
    const bookings = await BookingModel.getAll();
    const allocated = bookings.filter((b) => b.status === "allocated" && (b.allocatedRoom || b.room));
    const templates = await WhatsAppTemplateModel.getTemplates();
    const settings = await SettingsModel.getPaymentSettings();

    const todayISO = targetDate.toISOString().substring(0, 10);
    const candidates: ReminderCandidate[] = [];

    let upcomingCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let alreadyPaidCount = 0;

    for (const b of allocated) {
      const dues = BookingModel.calculateResidentDues(b);
      const cycle = BookingModel.calculateNextDueDate(b, targetDate);

      // If resident has already paid rent for the month, skip
      if (dues.rentDue <= 0) {
        alreadyPaidCount++;
        continue;
      }

      let reminderType: "upcoming" | "due_today" | "overdue" | null = null;
      let templateText = "";

      if (cycle.isDueToday) {
        reminderType = "due_today";
        dueTodayCount++;
        templateText = templates.dueTodayRentReminderMessage || WhatsAppTemplateModel.interpolate(templates.dueTodayRentReminderMessage, {});
      } else if (cycle.isUpcoming) {
        reminderType = "upcoming";
        upcomingCount++;
        templateText = templates.upcomingRentReminderMessage;
      } else if (cycle.isOverdue && dues.rentDue > 0) {
        reminderType = "overdue";
        overdueCount++;
        templateText = templates.overdueRentReminderMessage;
      }

      if (!reminderType) continue;

      const alreadySentToday = b.lastRentReminderDate === todayISO && b.lastReminderType === reminderType;

      // Building-specific UPI or global fallback
      const bldName = (b.allocatedBuilding || b.building || "").trim();
      const bldConfig = settings.buildingPayments?.[bldName];
      const effectiveUpi = bldConfig?.upiId || settings.upiId || "shripadpg@okaxis";
      const effectiveAccount = bldConfig?.accountName || settings.accountName || "Shripad PG Services";

      // Interpolate WhatsApp message
      const generatedMessage = WhatsAppTemplateModel.interpolate(templateText, {
        residentName: b.name || "Resident",
        customerName: b.name || "Resident",
        room: b.allocatedRoom || b.room || "101",
        bed: b.allocatedBed || b.bed || "A",
        building: bldName || "Shripad PG",
        rentAmount: dues.rentDue.toLocaleString("en-IN"),
        dueDate: cycle.nextDueDateFormatted,
        daysLeft: String(cycle.daysUntilDue),
        daysOverdue: String(cycle.daysOverdue),
        upiId: effectiveUpi,
        accountName: effectiveAccount,
        adminPhone: settings.adminPhone || "+91 98765 43210",
        portalLink: "https://shripadpg.pages.dev/my-rooms",
      });

      candidates.push({
        bookingId: b.id,
        residentName: b.name,
        phone: b.phone,
        room: b.allocatedRoom || b.room || "101",
        bed: b.allocatedBed || b.bed || "A",
        building: bldName,
        rentAmount: dues.rentDue,
        rentDue: dues.rentDue,
        dueDateFormatted: cycle.nextDueDateFormatted,
        dueDateISO: cycle.nextDueDateISO,
        daysUntilDue: cycle.daysUntilDue,
        daysOverdue: cycle.daysOverdue,
        reminderType,
        alreadySentToday,
        lastReminderDate: b.lastRentReminderDate,
        lastReminderType: b.lastReminderType,
        generatedMessage,
      });
    }

    return {
      date: todayISO,
      totalAllocatedResidents: allocated.length,
      upcomingCount,
      dueTodayCount,
      overdueCount,
      alreadyPaidCount,
      candidates,
    };
  }

  /**
   * Executes the daily automated reminder batch across all matching residents
   */
  public static async sendDailyAutomatedReminders(
    targetDate = new Date(),
    forceSend = false
  ): Promise<ReminderDispatchSummary> {
    const preview = await this.getReminderPreview(targetDate);
    const todayISO = preview.date;

    const summary: ReminderDispatchSummary = {
      date: todayISO,
      totalProcessed: preview.candidates.length,
      sentCount: 0,
      skippedPaid: preview.alreadyPaidCount,
      skippedAlreadySent: 0,
      failedCount: 0,
      results: [],
    };

    for (const cand of preview.candidates) {
      // Anti-spam de-duplication check: Skip if already sent today unless forceSend is true
      if (cand.alreadySentToday && !forceSend) {
        summary.skippedAlreadySent++;
        summary.results.push({
          bookingId: cand.bookingId,
          residentName: cand.residentName,
          phone: cand.phone,
          reminderType: cand.reminderType,
          status: "skipped_already_sent",
          message: "Skipped — reminder already sent to this resident today.",
        });
        continue;
      }

      try {
        const sendResult = await WhatsAppService.sendTextMessage(cand.phone, cand.generatedMessage);

        if (sendResult.success) {
          // Update resident record with last reminder timestamp and type
          await BookingModel.update(cand.bookingId, {
            lastRentReminderDate: todayISO,
            lastReminderType: cand.reminderType,
          });

          summary.sentCount++;
          summary.results.push({
            bookingId: cand.bookingId,
            residentName: cand.residentName,
            phone: cand.phone,
            reminderType: cand.reminderType,
            status: "sent",
            message: `WhatsApp reminder dispatched successfully (${sendResult.gateway || "OpenWA"}).`,
          });
        } else {
          summary.failedCount++;
          summary.results.push({
            bookingId: cand.bookingId,
            residentName: cand.residentName,
            phone: cand.phone,
            reminderType: cand.reminderType,
            status: "failed",
            error: sendResult.error || "Failed to deliver WhatsApp message",
          });
        }
      } catch (err: any) {
        summary.failedCount++;
        summary.results.push({
          bookingId: cand.bookingId,
          residentName: cand.residentName,
          phone: cand.phone,
          reminderType: cand.reminderType,
          status: "failed",
          error: err?.message || "Unexpected dispatch error",
        });
      }
    }

    return summary;
  }

  /**
   * Send an instant manual reminder to a specific resident
   */
  public static async sendSingleResidentReminder(
    bookingId: string,
    forcedType?: "upcoming" | "due_today" | "overdue"
  ): Promise<{ success: boolean; message: string; result?: any }> {
    const booking = await BookingModel.getById(bookingId);
    if (!booking) {
      return { success: false, message: "Resident booking not found." };
    }

    const preview = await this.getReminderPreview(new Date());
    let candidate = preview.candidates.find((c) => c.bookingId === bookingId);

    // If not in candidate list (e.g. rent paid or custom date), construct on-the-fly
    if (!candidate) {
      const dues = BookingModel.calculateResidentDues(booking);
      const cycle = BookingModel.calculateNextDueDate(booking, new Date());
      const templates = await WhatsAppTemplateModel.getTemplates();
      const settings = await SettingsModel.getPaymentSettings();

      const reminderType = forcedType || (cycle.isDueToday ? "due_today" : (cycle.isUpcoming ? "upcoming" : "overdue"));
      let templateText = templates.dueTodayRentReminderMessage;
      if (reminderType === "upcoming") templateText = templates.upcomingRentReminderMessage;
      if (reminderType === "overdue") templateText = templates.overdueRentReminderMessage;

      const bldName = (booking.allocatedBuilding || booking.building || "").trim();
      const bldConfig = settings.buildingPayments?.[bldName];
      const effectiveUpi = bldConfig?.upiId || settings.upiId || "shripadpg@okaxis";
      const effectiveAccount = bldConfig?.accountName || settings.accountName || "Shripad PG Services";

      const generatedMessage = WhatsAppTemplateModel.interpolate(templateText, {
        residentName: booking.name || "Resident",
        customerName: booking.name || "Resident",
        room: booking.allocatedRoom || booking.room || "101",
        bed: booking.allocatedBed || booking.bed || "A",
        building: bldName || "Shripad PG",
        rentAmount: (dues.rentDue || Number(booking.rentAmount) || 5000).toLocaleString("en-IN"),
        dueDate: cycle.nextDueDateFormatted,
        daysLeft: String(cycle.daysUntilDue),
        daysOverdue: String(cycle.daysOverdue),
        upiId: effectiveUpi,
        accountName: effectiveAccount,
        adminPhone: settings.adminPhone || "+91 98765 43210",
        portalLink: "https://shripadpg.pages.dev/my-rooms",
      });

      candidate = {
        bookingId: booking.id,
        residentName: booking.name,
        phone: booking.phone,
        room: booking.allocatedRoom || booking.room || "101",
        bed: booking.allocatedBed || booking.bed || "A",
        building: bldName,
        rentAmount: dues.rentDue || Number(booking.rentAmount) || 5000,
        rentDue: dues.rentDue || Number(booking.rentAmount) || 5000,
        dueDateFormatted: cycle.nextDueDateFormatted,
        dueDateISO: cycle.nextDueDateISO,
        daysUntilDue: cycle.daysUntilDue,
        daysOverdue: cycle.daysOverdue,
        reminderType,
        alreadySentToday: false,
        generatedMessage,
      };
    }

    const sendRes = await WhatsAppService.sendTextMessage(candidate.phone, candidate.generatedMessage);

    if (sendRes.success) {
      await BookingModel.update(booking.id, {
        lastRentReminderDate: new Date().toISOString().substring(0, 10),
        lastReminderType: candidate.reminderType,
      });

      return {
        success: true,
        message: `Rent reminder WhatsApp message sent to ${candidate.residentName} (${candidate.phone})!`,
        result: sendRes,
      };
    } else {
      return {
        success: false,
        message: `Failed to send WhatsApp reminder: ${sendRes.error || "Delivery error"}`,
        result: sendRes,
      };
    }
  }
}
