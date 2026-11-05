/** Shared integer-cent pricing keeps the storefront and PIX charges aligned. */
export const KIT_PRICING = {
  k1: { priceCents: 1290, fromCents: 7900 },
  k3: { priceCents: 4790, fromCents: 19700 },
  k5: { priceCents: 9700, fromCents: 29700 },
} as const;

export const formatKitPrice = (cents: number): string =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });