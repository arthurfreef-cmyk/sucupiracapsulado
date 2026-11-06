import { describe, expect, it } from "bun:test";
import { KIT_PRICING } from "../src/lib/kit-pricing";
import { buildFruitfyPayload, fruitfyInput } from "../src/lib/fruitfy";

const buyer = { name: "Cliente Teste", email: "teste@example.com", document: "52998224725", phone: "11999999999" };
const address = { zip: "01001000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" };

describe("Black Friday pricing", () => {
  for (const [kit, cents, anchor, savings] of [
    ["k1", 1290, 7900, 6610], ["k3", 4790, 19700, 14910], ["k5", 9700, 29700, 20000],
  ] as const) {
    it(`${kit} displays and charges ${cents} cents with matching savings`, () => {
      expect(KIT_PRICING[kit].priceCents).toBe(cents);
      expect(KIT_PRICING[kit].fromCents).toBe(anchor);
      expect(KIT_PRICING[kit].fromCents - KIT_PRICING[kit].priceCents).toBe(savings);
      const input = fruitfyInput.parse({ kit, buyer, address, shipping: { method: "free", amount: 0 } });
      expect(buildFruitfyPayload(input).items[0]?.value).toBe(cents);
    });
    it(`${kit} adds only the selected express shipping to the campaign price`, () => {
      const input = fruitfyInput.parse({ kit, buyer, address, shipping: { method: "express", amount: 691 } });
      expect(buildFruitfyPayload(input).items[0]?.value).toBe(cents + 691);
    });
  }
});