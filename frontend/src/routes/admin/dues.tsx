import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/admin/dues")({
  component: () => <AdminDashboard tab="Dues" />,
});
