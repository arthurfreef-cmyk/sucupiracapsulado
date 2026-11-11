import { describe, expect, it } from "bun:test";
import { trackStorefrontEvent } from "../src/lib/storefront-tracking";

describe("storefront tracking isolation", () => {
  it("does not propagate a failed pixel into kit selection", () => {
    expect(() => trackStorefrontEvent(() => { throw new Error("Blocked pixel"); }, "track", "AddToCart")).not.toThrow();
  });
  it("preserves event values when tracking is available", () => {
    const events: unknown[][] = [];
    trackStorefrontEvent((...args: unknown[]) => events.push(args), "track", "AddToCart", { content_ids: ["k1"], value: 12.9, currency: "BRL" });
    expect(events).toEqual([["track", "AddToCart", { content_ids: ["k1"], value: 12.9, currency: "BRL" }]]);
  });
  it("allows selection without an installed pixel", () => {
    expect(() => trackStorefrontEvent(undefined, "track", "AddToCart")).not.toThrow();
  });
});