import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decideCheckout } from "./checkout-policy.ts";

const completeProfile = {
  exists: true,
  firstName: "Léa",
  birthDate: "1990-02-14",
  tier: "eveil",
  status: null,
};

Deno.test("only a personalized reading requires a complete profile", () => {
  assertEquals(decideCheckout("ame_soeur", { ...completeProfile, birthDate: null }), {
    allowed: false,
    reason: "profile_required",
  });
  for (const priceKey of ["etoile_monthly", "etoile_annual"]) {
    assertEquals(decideCheckout(priceKey, { ...completeProfile, birthDate: null }), {
      allowed: true,
      reason: null,
    });
  }
});

Deno.test("a complete profile can start a supported checkout", () => {
  assertEquals(decideCheckout("etoile_monthly", completeProfile), {
    allowed: true,
    reason: null,
  });
});

Deno.test("legacy credit packs keep their existing profile behavior", () => {
  assertEquals(decideCheckout("pack_lune", {
    ...completeProfile,
    firstName: null,
    birthDate: null,
  }), {
    allowed: true,
    reason: null,
  });
});

Deno.test("an existing Star subscription wins over profile completion", () => {
  assertEquals(decideCheckout("etoile_annual", {
    ...completeProfile,
    firstName: null,
    birthDate: null,
    tier: "etoile",
    status: "active",
  }), {
    allowed: false,
    reason: "subscription_exists",
  });
});

Deno.test("unknown products are rejected", () => {
  assertEquals(decideCheckout("invented", completeProfile), {
    allowed: false,
    reason: "unknown_product",
  });
});
