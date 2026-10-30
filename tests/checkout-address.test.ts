import { afterEach, describe, expect, it } from "bun:test";
import { AddressLookupError, fetchCheckoutAddress, isCheckoutDeliveryReady, normalizeCheckoutZip } from "../src/lib/checkout-address";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const json = (data: unknown, status = 200) => Response.json(data, { status });

describe("manual delivery readiness", () => {
  const address = { street: "Praça da Sé", neighborhood: "Sé", city: "São Paulo", state: "SP" };
  it("makes completed manual addresses available for shipping", () => {
    expect(isCheckoutDeliveryReady("01001000", "01001000", address)).toBe(true);
  });
  it("does not reuse delivery details after the CEP changes", () => {
    expect(isCheckoutDeliveryReady("69900001", "01001000", address)).toBe(false);
  });
  it("does not release shipping for incomplete manual details", () => {
    expect(isCheckoutDeliveryReady("01001000", "01001000", { ...address, street: " " })).toBe(false);
  });
});

describe("CEP lookup", () => {
  it("preserves leading zeros and accepts pasted formatting", () => {
    expect(normalizeCheckoutZip(" 01.001-000 ")).toBe("01001000");
  });
  it("falls back when ViaCEP is unavailable", async () => {
    globalThis.fetch = (async input => String(input).includes("viacep")
      ? json({}, 503) : json({ city: "Rio Branco", state: "AC", street: "Rua A", neighborhood: "Centro" })) as typeof fetch;
    expect((await fetchCheckoutAddress("69900-001")).city).toBe("Rio Branco");
  });
  it("accepts city-wide CEPs without inventing street or neighborhood", async () => {
    globalThis.fetch = (async () => json({ localidade: "Cidade", uf: "AC", logradouro: "", bairro: "" })) as typeof fetch;
    expect(await fetchCheckoutAddress("69901000")).toEqual({ street: "", neighborhood: "", city: "Cidade", state: "AC" });
  });
  it("does not call an outage an invalid CEP and retries after failure", async () => {
    globalThis.fetch = (async () => { throw new TypeError("Network error"); }) as typeof fetch;
    await expect(fetchCheckoutAddress("69902000")).rejects.toMatchObject({ reason: "unavailable" });
    globalThis.fetch = (async () => json({ localidade: "Cidade", uf: "AC" })) as typeof fetch;
    expect((await fetchCheckoutAddress("69902000")).city).toBe("Cidade");
  });
  it("requires both providers to confirm a missing CEP", async () => {
    globalThis.fetch = (async input => String(input).includes("viacep") ? json({ erro: "true" }) : json({}, 404)) as typeof fetch;
    await expect(fetchCheckoutAddress("99999999")).rejects.toBeInstanceOf(AddressLookupError);
    await expect(fetchCheckoutAddress("99999999")).rejects.toMatchObject({ reason: "not_found" });
  });
  it("rejects malformed successful responses instead of caching them", async () => {
    globalThis.fetch = (async () => json({})) as typeof fetch;
    await expect(fetchCheckoutAddress("69903000")).rejects.toMatchObject({ reason: "unavailable" });
  });
});