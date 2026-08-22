import { Router } from "express";
import { BookingController } from "../controllers/bookingController.js";

const router = Router();

// Route mappings for /api/bookings
router.get("/", BookingController.getBookings);
router.get("/sheet-csv", BookingController.downloadSheetCSV);
router.get("/apps-script-code", BookingController.getAppsScriptCode);
router.post("/", BookingController.createBooking);
router.post("/webhook", BookingController.handleOnlineBookingWebhook);
router.post("/sync", BookingController.syncBookings);
router.post("/push-to-sheet", BookingController.pushToSheet);
router.post("/login", BookingController.customerLogin);
router.post("/change-password", BookingController.changePassword);
router.post("/:id/allocate", BookingController.allocateBooking);
router.post("/:id/checkout-refund", BookingController.checkoutAndRefundBooking);
router.put("/:id/rent-setup", BookingController.setupRent);
router.post("/:id/deallocate", BookingController.deallocateBooking);
router.post("/:id/complaints", BookingController.addComplaint);
router.put("/:id/complaints/:complaintId", BookingController.updateComplaintStatus);
router.put("/:id", BookingController.updateBooking);
router.delete("/:id", BookingController.deleteBooking);

export default router;


