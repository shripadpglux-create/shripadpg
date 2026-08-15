import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/report")({
  component: () => <Navigate to="/admin/reports" replace />,
});
