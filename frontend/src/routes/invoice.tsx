import { createFileRoute } from "@tanstack/react-router";
import { InvoiceDesign } from "@/components/InvoiceDesign";

export const Route = createFileRoute("/invoice")({
  head: () => ({
    meta: [
      { title: "Shripad PG Rent Invoice | Printable A4 Invoice" },
      {
        name: "description",
        content:
          "Fill and print official Shripad PG rent invoice template — editable A4 sheet for residents and admin.",
      },
      { property: "og:title", content: "Shripad PG Rent Invoice" },
      {
        property: "og:description",
        content: "Editable A4 rent invoice for Shripad PG residents.",
      },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <InvoiceDesign />
    </div>
  ),
});
