import { z } from "zod";
import { isConfirmedPayment } from "./payment-status";

const proofSchema = z.object({
  id: z.string().min(1).max(128),
  kit: z.enum(["k1", "k3", "k5", "upsell5"]),
  amount: z.number().int().positive(),
  expires: z.number().int().positive(),
});
export type OrderProof = z.infer<typeof proofSchema>;

function credentials() {
  const token = process.env.FRUITFY_TOKEN?.trim().replace(/^Bearer\s+/i, "");
  const storeId = process.env.FRUITFY_STORE_ID?.trim().replace(/^store[-_\s]?id\s*[:=]\s*/i, "");
  if (!token || !storeId) throw new Error("Pagamento indisponível no momento.");
  return { token, storeId };
}
const encoder = new TextEncoder();
const base64 = (data: Uint8Array) => btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unbase64 = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
async function signingKey() {
  return crypto.subtle.importKey("raw", encoder.encode(`fruitfy-order-v1:${credentials().token}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signOrderProof(order: Omit<OrderProof, "expires">): Promise<string> {
  const payload = base64(encoder.encode(JSON.stringify({ ...order, expires: Date.now() + 7 * 86400000 })));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload));
  return `${payload}.${base64(new Uint8Array(signature))}`;
}

export async function verifyOrderProof(value: string): Promise<OrderProof | null> {
  try {
    if (value.length > 2048) return null;
    const parts = value.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    if (!payload || !signature) return null;
    const valid = await crypto.subtle.verify("HMAC", await signingKey(), unbase64(signature), encoder.encode(payload));
    if (!valid) return null;
    const parsed = proofSchema.safeParse(JSON.parse(new TextDecoder().decode(unbase64(payload))));
    return parsed.success && parsed.data.expires > Date.now() ? parsed.data : null;
  } catch {
    return null;
  }
}

const orderResponse = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.string(), paid_at: z.string().nullable(),
    total_paid_amount: z.number().int().nonnegative(),
    total_gross_amount: z.number().int().positive(),
    refunded_amount: z.number().int().nonnegative(),
    refunded_at: z.string().nullable().optional(), canceled_at: z.string().nullable().optional(),
  }),
});

/** Only a signed charge reference can be used; never return provider customer data. */
export async function checkOrderPaid(order: OrderProof): Promise<boolean> {
  const { token, storeId } = credentials();
  const response = await fetch(`https://api.fruitfy.io/api/order/${encodeURIComponent(order.id)}`, {
    headers: { Authorization: `Bearer ${token}`, "Store-Id": storeId, Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  const result = orderResponse.safeParse(await response.json().catch(() => null));
  if (!response.ok || !result.success) throw new Error("Não foi possível consultar o pagamento agora. Tente novamente.");
  return isConfirmedPayment(result.data.data, order.amount);
}