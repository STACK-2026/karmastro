import { describe, expect, it } from "vitest";
import { OFFER_CATALOG } from "@/lib/offer-catalog";

describe("commercial offer catalog", () => {
  it("keeps the app prices aligned with the server contract", () => {
    expect(OFFER_CATALOG.etoile_monthly.amount).toBe(5.99);
    expect(OFFER_CATALOG.etoile_annual.amount).toBe(49.99);
    expect(OFFER_CATALOG.ame_soeur.amount).toBe(3.99);
  });

  it("keeps subscription and one-shot products explicit", () => {
    expect(OFFER_CATALOG.etoile_monthly.kind).toBe("subscription");
    expect(OFFER_CATALOG.etoile_annual.kind).toBe("subscription");
    expect(OFFER_CATALOG.ame_soeur.kind).toBe("one_time");
  });
});
