import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/finance")({
  component: () => <AdminDashboard isStaffMode={true} tab="Finance" />,
});
