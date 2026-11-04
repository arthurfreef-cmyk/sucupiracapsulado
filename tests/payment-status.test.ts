import { describe, expect, it } from "bun:test";
import { isConfirmedPayment } from "../src/lib/payment-status";

const paidOrder = { status: "paid", paid_at: "2026-10-28T03:00:00Z", total_paid_amount: 2700, total_gross_amount: 2700, refunded_amount: 0 };
describe("confirmed payment", () => {
  it("allows a fully paid, unrefunded original order", () => expect(isConfirmedPayment(paidOrder, 2700)).toBe(true));
  it("rejects a generated but unpaid PIX", () => expect(isConfirmedPayment({ ...paidOrder, status: "waiting_payment", paid_at: null, total_paid_amount: 0 }, 2700)).toBe(false));
  it("rejects a partial payment", () => expect(isConfirmedPayment({ ...paidOrder, total_paid_amount: 1000 }, 2700)).toBe(false));
  it("rejects a refunded order", () => expect(isConfirmedPayment({ ...paidOrder, refunded_amount: 2700 }, 2700)).toBe(false));
  it("rejects an order with a mismatched charge amount", () => expect(isConfirmedPayment(paidOrder, 9700)).toBe(false));
});
