import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/bookings")({
  component: () => <AdminDashboard isStaffMode={true} tab="Bookings" />,
});
