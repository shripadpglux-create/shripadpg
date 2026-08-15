import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/buildings")({
  component: () => <AdminDashboard isStaffMode={true} tab="Buildings" />,
});
