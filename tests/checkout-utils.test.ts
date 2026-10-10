import { describe, expect, it } from "bun:test";
import { normalizeCheckoutPhone, expressShippingCents } from "../src/lib/checkout-utils";

describe("checkout phone autofill", () => {
  it("keeps the local number when a Brazilian country code is pasted", () => {
    expect(normalizeCheckoutPhone("+55 (11) 99999-9999")).toBe("11999999999");
  });
  it("does not remove a valid local DDD 55", () => {
    expect(normalizeCheckoutPhone("(55) 99999-9999")).toBe("55999999999");
  });
  it("preserves partially typed input", () => {
    expect(normalizeCheckoutPhone("55")).toBe("55");
  });
});

describe("checkout shipping", () => {
  it("uses the same price for masked and unmasked ZIP codes", () => {
    expect(expressShippingCents("01001-000")).toBe(expressShippingCents("01001000"));
  });
});