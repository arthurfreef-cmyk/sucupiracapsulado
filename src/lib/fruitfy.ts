import { z } from "zod";
import { KIT_PRICING } from "./kit-pricing";

export const FRUITFY_UPSELL_ID = "a324b199-a25a-4d9d-9aeb-57ba9745ca5b";
export const FRUITFY_PROTECTION_ID = "a324c713-3b2a-42f1-a281-30790ae17e6d";

export const FRUITFY_KITS = {
  k1: { amount: KIT_PRICING.k1.priceCents, id: "a2ee0c4c-bde0-4454-88b2-12665be6431c" },
  k3: { amount: KIT_PRICING.k3.priceCents, id: "a2ee0cb3-9100-41b8-b663-e592c71b6d94" },
  k5: { amount: KIT_PRICING.k5.priceCents, id: "a2ee0cf3-ab89-44c1-82ae-a023853ae25b" },
} as const;

const digits = (value: string) => value.replace(/\D/g, "");

export const fruitfyInput = z.object({
  kit: z.enum(["k1", "k3", "k5"]),
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
  const shipping = input.shipping?.method === "express" ? input.shipping.amount : 0;
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

/** Fixed shipping add-on price: R$ 18,61. */
export const SHIPPING_UPSELL_CENTS = 1861;

/** Fixed optional commercial-protection add-on price: R$ 15,90. */
export const PROTECTION_UPSELL_CENTS = 1590;

function buildUpsellUtm(rawUtm?: string) {
  const query = new URLSearchParams(rawUtm?.replace(/^\?/, "") ?? "");
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = query.get(key);
    if (value) utm[key] = value;
  }
  return utm;
}

type UpsellBuyer = { name: string; email: string; document: string; phone: string };

export function buildShippingUpsellPayload(
  buyer: UpsellBuyer,
  amount: number,
  rawUtm?: string,
) {
  if (amount !== SHIPPING_UPSELL_CENTS) {
    throw new Error("Valor do complemento de frete inválido.");
  }
  return {
    name: buyer.name,
    email: buyer.email.toLowerCase(),
    cpf: digits(buyer.document),
    phone: `55${digits(buyer.phone).replace(/^55/, "")}`,
    items: [{ id: FRUITFY_UPSELL_ID, value: amount, quantity: 1 }],
    utm: buildUpsellUtm(rawUtm),
  };
}

export function buildProtectionUpsellPayload(
  buyer: UpsellBuyer,
  amount: number,
  rawUtm?: string,
) {
  if (amount !== PROTECTION_UPSELL_CENTS) {
    throw new Error("Valor da proteção comercial inválido.");
  }
  return {
    name: buyer.name,
    email: buyer.email.toLowerCase(),
    cpf: digits(buyer.document),
    phone: `55${digits(buyer.phone).replace(/^55/, "")}`,
    items: [{ id: FRUITFY_PROTECTION_ID, value: amount, quantity: 1 }],
    utm: buildUpsellUtm(rawUtm),
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
