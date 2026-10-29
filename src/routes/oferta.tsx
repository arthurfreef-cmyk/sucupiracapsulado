import { createFileRoute } from "@tanstack/react-router";
import { UpsellPage } from "@/components/UpsellPage";

export const Route = createFileRoute("/oferta")({
  head: () => ({ meta: [
    { title: "Oferta Especial — Sucupira Composta" },
    { name: "description", content: "Oferta opcional de cinco frascos por R$ 47,90 com checkout PIX separado." },
    { property: "og:title", content: "Oferta Especial — Sucupira Composta" },
    { property: "og:description", content: "Adicione cinco frascos por R$ 47,90. Compra opcional, com frete grátis." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: UpsellPage,
});
