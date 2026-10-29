import { createFileRoute } from "@tanstack/react-router";
import { UpsellPage } from "@/components/UpsellPage";

export const Route = createFileRoute("/upsell")({
  head: () => ({ meta: [
    { title: "Kit adicional de 5 frascos — Sucupira Composta" },
    { name: "description", content: "Oferta opcional de cinco frascos por R$ 47,90, com frete grátis e checkout PIX separado." },
    { property: "og:title", content: "Kit adicional de 5 frascos — Sucupira Composta" },
    { property: "og:description", content: "Complemente seu pedido com cinco frascos por R$ 47,90. Compra opcional." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: UpsellPage,
});