import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/staff/dues")({
  component: () => <AdminDashboard isStaffMode={true} tab="Dues" />,
});
