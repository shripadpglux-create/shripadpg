import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/dashboard")({
  component: () => <AdminDashboard isStaffMode={true} tab="Dashboard" />,
});
