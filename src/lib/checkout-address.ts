import { z } from "zod";

export interface CheckoutAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Manual delivery details are ready only when bound to the current ZIP. */
export function isCheckoutDeliveryReady(zip: string, resolvedZip: string | null, address: CheckoutAddress): boolean {
  return /^\d{8}$/.test(zip) && zip === resolvedZip
    && Boolean(address.street.trim() && address.neighborhood.trim() && address.city.trim())
    && /^[A-Z]{2}$/.test(address.state.trim());
}

const viaCepSchema = z.object({
  logradouro: z.string().optional(), bairro: z.string().optional(),
  localidade: z.string().trim().min(1), uf: z.string().regex(/^[A-Z]{2}$/),
});
const brasilApiSchema = z.object({
  street: z.string().nullable().optional(), neighborhood: z.string().nullable().optional(),
  city: z.string().trim().min(1), state: z.string().regex(/^[A-Z]{2}$/),
});
const cache = new Map<string, CheckoutAddress>();
const pending = new Map<string, Promise<CheckoutAddress>>();

export class AddressLookupError extends Error {
  constructor(public readonly reason: "invalid" | "not_found" | "unavailable") {
    super(reason === "invalid" ? "CEP incompleto" : reason === "not_found" ? "CEP não encontrado" : "Não foi possível buscar o CEP");
  }
}

export function normalizeCheckoutZip(value: string): string {
  return value.replace(/\D/g, "");
}

async function lookup(zip: string): Promise<CheckoutAddress> {
  let notFound = 0;
  for (const provider of ["viacep", "brasilapi"] as const) {
    try {
      const url = provider === "viacep"
        ? `https://viacep.com.br/ws/${zip}/json/`
        : `https://brasilapi.com.br/api/cep/v1/${zip}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (response.status === 404) { notFound++; continue; }
      if (!response.ok) continue;
      const raw: unknown = await response.json();
      if (provider === "viacep") {
        if (raw && typeof raw === "object" && "erro" in raw && (raw.erro === true || raw.erro === "true")) {
          notFound++; continue;
        }
        const parsed = viaCepSchema.safeParse(raw);
        if (!parsed.success) continue;
        const d = parsed.data;
        return { street: d.logradouro ?? "", neighborhood: d.bairro ?? "", city: d.localidade, state: d.uf };
      }
      const parsed = brasilApiSchema.safeParse(raw);
      if (!parsed.success) continue;
      const d = parsed.data;
      return { street: d.street ?? "", neighborhood: d.neighborhood ?? "", city: d.city, state: d.state };
    } catch {
      // A provider outage is not evidence of an invalid ZIP code.
    }
  }
  throw new AddressLookupError(notFound === 2 ? "not_found" : "unavailable");
}

export async function fetchCheckoutAddress(value: string, signal?: AbortSignal): Promise<CheckoutAddress> {
  const zip = normalizeCheckoutZip(value);
  if (!/^\d{8}$/.test(zip)) throw new AddressLookupError("invalid");
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const cached = cache.get(zip);
  if (cached) return cached;
  let request = pending.get(zip);
  if (!request) {
    request = lookup(zip).then(address => {
      if (cache.size >= 100) cache.clear();
      cache.set(zip, address);
      return address;
    }).finally(() => pending.delete(zip));
    pending.set(zip, request);
  }
  if (!signal) return request;
  // Cancelling one field lookup must not cancel a submit sharing the request.
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    request.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}