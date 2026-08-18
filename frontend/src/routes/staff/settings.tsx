import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/settings")({
  component: () => <AdminDashboard tab="Settings" isStaffMode={true} />,
});
