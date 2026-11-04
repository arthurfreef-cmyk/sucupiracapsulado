import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve old links without presenting another purchase.
export const Route = createFileRoute("/oferta")({
  beforeLoad: () => { throw redirect({ to: "/obrigado", replace: true }); },
});
