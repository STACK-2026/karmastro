import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pricing = readFileSync(path.join(process.cwd(), "src/pages/PricingPage.tsx"), "utf8");
const oracle = readFileSync(path.join(process.cwd(), "src/pages/OraclePage.tsx"), "utf8");
const siteOracle = readFileSync(path.join(process.cwd(), "../site/src/pages/oracle.astro"), "utf8");

describe("Oracle to Pricing funnel contract", () => {
  it("routes both Oracle walls through an attributed pricing page", () => {
    expect(oracle).toContain('navigate("/pricing?source=oracle_app_limit")');
    expect(oracle).toContain("paywallEtoileClickEvent");
    expect(siteOracle).toContain("/pricing?source=oracle_site_limit");
  });

  it("measures pricing exposure once and propagates source to checkout", () => {
    expect(pricing).toContain('trackEvent("pricing_viewed"');
    expect(pricing).toContain("pricingViewed.current");
    expect(pricing).toMatch(/trackEvent\("checkout_started",\s*\{[^}]*source:/s);
  });
});
