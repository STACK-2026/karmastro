import { describe, expect, it } from "vitest";

import {
  pricingAttributionProperties,
  pricingSourceFromSearch,
} from "@/lib/pricing-attribution";

describe("Pricing attribution", () => {
  it("accepts only the two Oracle conversion sources", () => {
    expect(pricingSourceFromSearch("?source=oracle_app_limit")).toBe("oracle_app_limit");
    expect(pricingSourceFromSearch("?source=oracle_site_limit")).toBe("oracle_site_limit");
    expect(pricingSourceFromSearch("?source=campaign_free_text")).toBe("direct");
    expect(pricingSourceFromSearch("?source=oracle_app_limit&source=oracle_site_limit")).toBe("direct");
  });

  it("builds a content-free versioned payload", () => {
    expect(pricingAttributionProperties({
      source: "oracle_app_limit",
      locale: "fr",
      isAuthenticated: true,
    })).toEqual({
      source: "oracle_app_limit",
      locale: "fr",
      is_authenticated: true,
      journey_version: "oracle_conversation_v1",
    });
  });
});
