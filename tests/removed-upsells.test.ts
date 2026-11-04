import { describe, expect, it } from "bun:test";
import { FRUITFY_KITS, fruitfyInput } from "../src/lib/fruitfy";

describe("removed additional offers", () => {
  it("rejects the retired upsell kit even with valid customer data", () => {
    const order = {
      buyer: { name: "Cliente Teste", email: "teste@example.com", document: "52998224725", phone: "11999999999" },
      address: { zip: "01001000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" },
    };
    expect(fruitfyInput.safeParse({ ...order, kit: "k5" }).success).toBe(true);
    expect(fruitfyInput.safeParse({ ...order, kit: "upsell5" }).success).toBe(false);
    expect(Object.keys(FRUITFY_KITS)).toEqual(["k1", "k3", "k5"]);
  });
});