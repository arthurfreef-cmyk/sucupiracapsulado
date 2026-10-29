import { describe, expect, it } from "bun:test";
import { FRUITFY_KITS, buildFruitfyPayload, fruitfyInput } from "../src/lib/fruitfy";
import { isConfirmedPayment, UPSELL_PRICE_CENTS } from "../src/lib/upsell";

describe("five bottle optional offer", () => {
  it("costs exactly R$ 47,90 without changing the regular five bottle price", () => {
    expect(UPSELL_PRICE_CENTS).toBe(4790);
    expect(FRUITFY_KITS.upsell5.amount).toBe(4790);
    expect(FRUITFY_KITS.k5.amount).toBe(14700);
  });
  it("charges one five-bottle kit for 4790 cents with free shipping", () => {
    const input = fruitfyInput.parse({ kit: "upsell5", buyer: { name: "Cliente Teste", email: "teste@example.com", document: "52998224725", phone: "11999999999" }, address: { zip: "01001000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" }, shipping: { method: "free", amount: 0 } });
    expect(buildFruitfyPayload(input).items).toEqual([{ id: "a2ee0cf3-ab89-44c1-82ae-a023853ae25b", value: 4790, quantity: 1 }]);
  });
  it("keeps the additional kit at R$ 47,90 even if express shipping is submitted", () => {
    const input = fruitfyInput.parse({ kit: "upsell5", buyer: { name: "Cliente Teste", email: "teste@example.com", document: "52998224725", phone: "11999999999" }, address: { zip: "01001000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" }, shipping: { method: "express", amount: 691 } });
    expect(buildFruitfyPayload(input).items[0]?.value).toBe(4790);
  });
});
const paidOrder = { status: "paid", paid_at: "2026-10-28T03:00:00Z", total_paid_amount: 2700, total_gross_amount: 2700, refunded_amount: 0 };
describe("upsell requires confirmed original payment", () => {
  it("allows a fully paid, unrefunded original order", () => expect(isConfirmedPayment(paidOrder, 2700)).toBe(true));
  it("rejects a generated but unpaid PIX", () => expect(isConfirmedPayment({ ...paidOrder, status: "waiting_payment", paid_at: null, total_paid_amount: 0 }, 2700)).toBe(false));
  it("rejects a partial payment", () => expect(isConfirmedPayment({ ...paidOrder, total_paid_amount: 1000 }, 2700)).toBe(false));
  it("rejects a refunded order", () => expect(isConfirmedPayment({ ...paidOrder, refunded_amount: 2700 }, 2700)).toBe(false));
  it("rejects an order with a mismatched charge amount", () => expect(isConfirmedPayment(paidOrder, 9700)).toBe(false));
});