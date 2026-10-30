import { describe, expect, it } from "bun:test";
import { checkoutPaymentSchema, pendingCheckoutKey, pendingCheckoutSchema } from "../src/lib/checkout-pending";

const payment = { id: "test-order", status: "pending", amount: 2700, orderProof: "signed-proof", pix: { code: "000201" + "1234567890".repeat(12), expires_at: "2026-10-31T09:12:00Z" } };
const original = { proof: "signed-proof", buyer: { name: "Cliente Teste", email: "cliente@example.com", document: "52998224725", phone: "11999999999" }, address: { zip: "01001000", street: "Praça da Sé", number: "123", neighborhood: "Sé", city: "São Paulo", state: "SP" } };
describe("pending checkout payment", () => {
  it("restores the original R$ 27 PIX with its matching original order", () => {
    const parsed = pendingCheckoutSchema.parse(JSON.parse(JSON.stringify({ kit: "k1", payment, original })));
    expect(parsed.payment.amount).toBe(2700);
    expect(parsed.payment.pix.code).toBe(payment.pix.code);
  });
  it("rejects a pending PIX belonging to a different original proof", () => {
    expect(pendingCheckoutSchema.safeParse({ kit: "k1", payment, original: { ...original, proof: "other" } }).success).toBe(false);
  });
  it("does not restore malformed PIX codes", () => {
    expect(checkoutPaymentSchema.safeParse({ ...payment, pix: { ...payment.pix, code: "invalid" } }).success).toBe(false);
  });
  it("separates pending charges by kit", () => {
    expect(pendingCheckoutKey("k1")).not.toBe(pendingCheckoutKey("k5"));
  });
});