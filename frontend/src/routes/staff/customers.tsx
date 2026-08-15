import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/customers")({
  component: () => <AdminDashboard isStaffMode={true} tab="Customers" />,
});
