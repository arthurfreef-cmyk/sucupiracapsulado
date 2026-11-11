/** One calculation for the displayed total and the PIX request. */
export function normalizeCheckoutPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Autofill and pasted numbers may include Brazil's country code.
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2, 13) : digits.slice(0, 11);
}

export function expressShippingCents(zip: string): number {
  // Keep the displayed quote consistent for everyone at the same destination.
  const seed = zip.replace(/\D/g, "");
  let hash = 7;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) % 100003;
  // R$ 8,01–R$ 11,99: always a non-round amount.
  const cents = 801 + (hash % 399);
  return cents % 10 === 0 ? cents + 1 : cents;
}
export function decodeCampaignCookie(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}