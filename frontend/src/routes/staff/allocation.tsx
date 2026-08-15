import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/allocation")({
  component: () => <AdminDashboard isStaffMode={true} tab="Allocation" />,
});
