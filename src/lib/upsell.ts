/** Optional shipping-complement offer shown after the original order is confirmed. */
export const UPSELL_PRICE_CENTS = 1790;
export const UPSELL_REFERENCE_CENTS = 2000;

export interface ProviderPayment {
  paid_at: string | null;
  total_paid_amount: number;
  total_gross_amount: number;
  refunded_amount: number;
  refunded_at?: string | null;
  canceled_at?: string | null;
  status: string;
}

/** A browser action, a generated PIX, or a pending status is not payment. */
export function isConfirmedPayment(order: ProviderPayment, expectedCents: number): boolean {
  return Boolean(order.paid_at && Number.isFinite(Date.parse(order.paid_at)))
    && order.total_gross_amount === expectedCents
    && order.total_paid_amount >= expectedCents
    && order.refunded_amount === 0
    && !order.refunded_at && !order.canceled_at
    && !["waiting_payment", "pending", "canceled", "cancelled", "refunded", "failed"].includes(order.status.toLowerCase());
}
