import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/upsell2")({
  validateSearch: z.object({ kit: z.enum(["k1", "k3", "k5"]).optional() }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/upsell1", search: { kit: search.kit }, replace: true });
  },
});
