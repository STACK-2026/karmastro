import { describe, expect, it } from "vitest";
import {
  checkoutReturnAnalytics,
  consumeCheckoutReturn,
  parseCheckoutReturn,
  parseCheckoutReturnKind,
} from "@/lib/checkout-return";

describe("checkout return", () => {
  it("accepts only the two server-controlled states", () => {
    expect(parseCheckoutReturn(new URLSearchParams("checkout=success"))).toBe("success");
    expect(parseCheckoutReturn(new URLSearchParams("checkout=canceled"))).toBe("canceled");
    expect(parseCheckoutReturn(new URLSearchParams("checkout=failed"))).toBeNull();
    expect(parseCheckoutReturn(new URLSearchParams("checkout=success&checkout=canceled"))).toBeNull();
  });

  it("accepts only a categorical purchase kind", () => {
    expect(parseCheckoutReturnKind(new URLSearchParams("kind=subscription"))).toBe("subscription");
    expect(parseCheckoutReturnKind(new URLSearchParams("kind=one_time"))).toBe("one_time");
    expect(parseCheckoutReturnKind(new URLSearchParams("kind=price_123"))).toBeNull();
    expect(parseCheckoutReturnKind(new URLSearchParams("kind=subscription&kind=one_time"))).toBeNull();
  });

  it("removes checkout context while preserving unrelated query parameters", () => {
    expect(consumeCheckoutReturn("/dashboard", new URLSearchParams("checkout=success&kind=one_time&utm_source=email")))
      .toBe("/dashboard?utm_source=email");
  });

  it("keeps analytics categorical and free of Stripe identifiers", () => {
    expect(checkoutReturnAnalytics("success", true, "subscription")).toEqual({
      status: "success",
      purchase_type: "subscription",
      activation: "active",
    });
    expect(checkoutReturnAnalytics("success", false, "subscription")).toEqual({
      status: "success",
      purchase_type: "subscription",
      activation: "pending",
    });
    expect(checkoutReturnAnalytics("success", false, "one_time")).toEqual({
      status: "success",
      purchase_type: "one_time",
      activation: "not_applicable",
    });
    expect(checkoutReturnAnalytics("canceled", false, null)).toEqual({
      status: "canceled",
    });
  });
});
