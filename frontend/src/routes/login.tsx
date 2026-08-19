import { createFileRoute } from "@tanstack/react-router";
import { UnifiedPortalLogin } from "@/features/auth/UnifiedPortalLogin";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Portal Login — Shripad PG" },
      { name: "description", content: "Fast & Secure Unified Portal Login for Admins, Staff, and Residents of Shripad PG." },
    ],
  }),
  component: UnifiedPortalLogin,
});
