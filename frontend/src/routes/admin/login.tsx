import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "@/features/admin/AdminLogin";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});
