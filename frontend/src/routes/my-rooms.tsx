import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortal } from "@/features/customer/CustomerPortal";

export const Route = createFileRoute("/my-rooms")({
  head: () => ({
    meta: [
      { title: "My Rooms — Shripad PG Resident Portal" },
      { name: "description", content: "View your allocated room details and manage your stay at Shripad PG." },
    ],
  }),
  component: CustomerPortal,
});
