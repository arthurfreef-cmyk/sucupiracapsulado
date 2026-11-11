import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  kit: z.enum(["k1", "k3", "k5"]).optional(),
  preview: z.boolean().optional(),
});

export const Route = createFileRoute("/upsell1")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/upsell-protecao",
      search: {
        ...(search.kit ? { kit: search.kit } : {}),
        ...(search.preview ? { preview: true } : {}),
      },
      replace: true,
    });
  },
  component: () => null,
});
