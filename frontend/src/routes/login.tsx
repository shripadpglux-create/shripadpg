import { createFileRoute } from "@tanstack/react-router";
import { CustomerLogin } from "@/features/customer/CustomerLogin";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Resident Login — Shripad PG" },
      { name: "description", content: "Secure resident portal login for Shripad PG members." },
    ],
  }),
  component: CustomerLogin,
});
