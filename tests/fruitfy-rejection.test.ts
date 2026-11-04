import { describe, expect, it } from "bun:test";
import { describeFruitfyRejection } from "../src/lib/fruitfy";

describe("Fruitfy rejection diagnostics", () => {
  it("logs the product support-info rejection and gives the buyer a safe message", () => {
    const r = describeFruitfyRejection(422, { success: false, errors: { "items.0.id": ["O produto Complementofrete não possui informações de suporte preenchidas"] } });
    expect(r.log).toContain("items.0.id: O produto Complementofrete não possui informações de suporte preenchidas");
    expect(r.userMessage).toContain("temporariamente indisponível");
  });
  it("falls back to the generic message for non-product errors", () => {
    expect(describeFruitfyRejection(422, { errors: { cpf: ["CPF inválido"] } }).userMessage).toBeNull();
    expect(describeFruitfyRejection(500, null)).toEqual({ log: "status=500", userMessage: null });
  });
});
