import { createFileRoute } from "@tanstack/react-router";
import { UnifiedPortalLogin } from "@/features/auth/UnifiedPortalLogin";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Shripad PG" },
      { name: "description", content: "Executive Administrative Console Sign In for Shripad PG." },
    ],
  }),
  component: UnifiedPortalLogin,
});
