/** One calculation for the displayed total and the PIX request. */
export function normalizeCheckoutPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Autofill and pasted numbers may include Brazil's country code.
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2, 13) : digits.slice(0, 11);
}

export function expressShippingCents(zip: string): number {
  let hash = 7;
  for (const digit of zip.replace(/\D/g, "")) hash = (hash * 31 + Number(digit)) % 100003;
  const cents = 500 + (hash % 200);
  return cents % 10 === 0 ? cents + 7 : cents;
}

export function decodeCampaignCookie(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}