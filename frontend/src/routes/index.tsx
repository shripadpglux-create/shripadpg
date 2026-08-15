import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shripad PG — Premium Living, Trusted Care" },
      {
        name: "description",
        content:
          "Experience comfortable and hassle-free stays with modern amenities, nutritious meals, high-speed Wi-Fi, and trusted support — all under one roof.",
      },
      {
        property: "og:title",
        content: "Shripad PG — Premium Living, Trusted Care",
      },
      {
        property: "og:description",
        content:
          "Experience comfortable and hassle-free stays with modern amenities, nutritious meals, high-speed Wi-Fi, and trusted support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});
