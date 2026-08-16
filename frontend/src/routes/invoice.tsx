import { createFileRoute } from "@tanstack/react-router";
import { InvoiceDesign } from "@/components/InvoiceDesign";

export const Route = createFileRoute("/invoice")({
  head: () => ({
    meta: [
      { title: "Shripad PG Rent Invoice | Printable A4 Invoice" },
      {
        name: "description",
        content:
          "Official Shripad PG verified rent receipt and invoice — printable A4 document for residents.",
      },
      { property: "og:title", content: "Shripad PG Rent Invoice" },
      {
        property: "og:description",
        content: "Verified A4 rent invoice & receipt for Shripad PG residents.",
      },
    ],
  }),
  component: () => {
    return (
      <div className="min-h-screen bg-slate-100 py-6 sm:py-8 px-3 sm:px-4">
        <InvoiceDesign
          readOnly={true}
          hideHeaderTabs={true}
        />
      </div>
    );
  },
});

