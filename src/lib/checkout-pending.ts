import { z } from "zod";
import { fruitfyInput } from "./fruitfy";

export const checkoutPaymentSchema = z.object({
  id: z.string().min(1), status: z.string(), amount: z.number().int().positive(),
  orderProof: z.string().min(1).max(2048),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string().default(""), expires_at: z.string().datetime({ offset: true }) }),
});
export const originalCheckoutSchema = fruitfyInput.pick({ buyer: true, address: true, utm: true })
  .extend({ proof: z.string().min(1).max(2048) });
export const pendingCheckoutSchema = z.object({
  kit: z.enum(["k1", "k3", "k5"]), payment: checkoutPaymentSchema, original: originalCheckoutSchema,
}).refine(value => value.payment.orderProof === value.original.proof);
export const pendingCheckoutKey = (kit: string) => `sucupira_checkout_pix_${kit}`;