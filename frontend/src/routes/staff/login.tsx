import { createFileRoute } from "@tanstack/react-router";
import { UnifiedPortalLogin } from "@/features/auth/UnifiedPortalLogin";

export const Route = createFileRoute("/staff/login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Shripad PG Portal" },
      { name: "description", content: "Dedicated Staff and Caretaker Login Portal for Shripad PG." },
    ],
  }),
  component: UnifiedPortalLogin,
});
