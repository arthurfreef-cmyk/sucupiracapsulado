import { z } from "zod";
import { UPSELL_PRICE_CENTS } from "./upsell";

export const FRUITFY_KITS = {
  k1: { amount: 2700, id: "a2ee0c4c-bde0-4454-88b2-12665be6431c" },
  k3: { amount: 9700, id: "a2ee0cb3-9100-41b8-b663-e592c71b6d94" },
  k5: { amount: 14700, id: "a2ee0cf3-ab89-44c1-82ae-a023853ae25b" },
  upsell5: { amount: UPSELL_PRICE_CENTS, id: "a2ee0cf3-ab89-44c1-82ae-a023853ae25b" },
} as const;

const digits = (value: string) => value.replace(/\D/g, "");

export const fruitfyInput = z.object({
  kit: z.enum(["k1", "k3", "k5", "upsell5"]),
  originalOrderProof: z.string().min(1).max(2048).optional(),
  buyer: z.object({
    name: z.string().trim().min(3).max(150).regex(/^\S+(\s+\S+)+$/),
    email: z.string().trim().email().max(254),
    document: z.string().max(20).transform(digits).pipe(z.string().length(11)),
    phone: z.string().max(25).transform(digits).transform((phone) =>
      phone.length > 11 && phone.startsWith("55") ? phone.slice(2) : phone,
    ).pipe(z.string().regex(/^\d{10,11}$/)),
  }),
  address: z.object({
    zip: z.string().transform(digits).pipe(z.string().length(8)),
    street: z.string().trim().min(1).max(255),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(100).optional(),
    neighborhood: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().length(2),
  }),
  shipping: z.object({
    method: z.enum(["free", "express"]),
    amount: z.number().int().min(0).max(5000),
  }).optional(),
  utm: z.string().max(4096).optional(),
});

export function buildFruitfyPayload(input: z.infer<typeof fruitfyInput>) {
  const kit = FRUITFY_KITS[input.kit];
  const shipping = input.kit !== "upsell5" && input.shipping?.method === "express" ? input.shipping.amount : 0;
  const amount = kit.amount + shipping;
  const query = new URLSearchParams(input.utm?.replace(/^\?/, ""));
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = query.get(key);
    if (value) utm[key] = value;
  }
  return {
    name: input.buyer.name,
    email: input.buyer.email.toLowerCase(),
    cpf: input.buyer.document,
    phone: `55${input.buyer.phone}`,
    address: {
      zip: input.address.zip,
      street: input.address.street,
      number: input.address.number,
      complement: input.address.complement || "",
      neighborhood: input.address.neighborhood,
      city: input.address.city,
      state: input.address.state.toUpperCase(),
    },
    items: [{ id: kit.id, value: amount, quantity: 1 }],
    utm,
  };
}

export const fruitfyResponse = z.object({
  success: z.literal(true),
  data: z.object({
    order_id: z.string().min(1),
    order_uuid: z.string().min(1).optional(),
    status: z.string(),
    amount: z.number().int().positive(),
    pix: z.object({
      code: z.string().min(50).startsWith("000201"),
      expires_at: z.string().datetime({ offset: true }),
    }),
  }),
});
