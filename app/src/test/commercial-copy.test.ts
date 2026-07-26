import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  firstOracleEmail,
  paymentSuccessEmail,
  welcomeEmail,
} from "../../supabase/functions/_shared/email-templates";

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("commercial promise", () => {
  it("describes only the current Star subscription benefits", () => {
    const email = paymentSuccessEmail("Léa", "Karmastro Étoile", "5,99 €", true);
    const combined = `${email.html}\n${email.text}`;
    expect(combined).toContain("Oracle illimité");
    expect(combined).toContain("guidance mensuelle");
    expect(combined).toContain("https://app.karmastro.com/settings");
    expect(combined).not.toContain("compatibilités illimitées");
    expect(combined).not.toContain("calendrier cosmique détaillé");
    expect(combined).not.toContain("https://app.karmastro.com/profile");
  });

  it("keeps lifecycle emails aligned with one Oracle and two free messages", () => {
    const combined = [
      welcomeEmail("Léa").html,
      welcomeEmail("Léa").text,
      firstOracleEmail("Léa", "Sibylle").html,
      firstOracleEmail("Léa", "Sibylle").text,
    ].join("\n");
    expect(combined).toContain("2 messages gratuits par jour");
    expect(combined).not.toContain("quatre guides");
    expect(combined).not.toContain("4 guides");
    expect(combined).not.toContain("3 consultations");
  });

  it("removes the dead credit CTA from the authenticated Oracle paywall", () => {
    expect(source("../pages/OraclePage.tsx")).not.toContain("oracle.paywall_cta_credits");
  });

  it("does not publish static testimonials without consent provenance", () => {
    const landing = source("../pages/LandingPage.tsx");
    expect(landing).not.toContain("landing.testi_1_name");
    expect(landing).not.toContain("testimonials.map");
  });
});
