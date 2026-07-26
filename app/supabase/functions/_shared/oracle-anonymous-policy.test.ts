import {
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ANONYMOUS_ORACLE_CONTEXT,
  ORACLE_PROFILE_USAGE_RULES,
  missingOracleProfileContext,
  profileForOracleIdentity,
  shouldPersistOracleProfileHints,
} from "./oracle-anonymous-policy.ts";

Deno.test("anonymous Oracle directs personalisation to free signup", () => {
  assertStringIncludes(ANONYMOUS_ORACLE_CONTEXT, "compte gratuit");
  assertStringIncludes(ANONYMOUS_ORACLE_CONTEXT, "onboarding");
  assertStringIncludes(ANONYMOUS_ORACLE_CONTEXT, "ne demande JAMAIS");
  assertFalse(ANONYMOUS_ORACLE_CONTEXT.includes("partager dans sa prochaine réponse"));
});

Deno.test("base profile rules are conditional and preserve the anonymous policy", () => {
  assertStringIncludes(ORACLE_PROFILE_USAGE_RULES, "SI un profil");
  assertStringIncludes(ORACLE_PROFILE_USAGE_RULES, "politique anonyme");
  assertFalse(ORACLE_PROFILE_USAGE_RULES.includes("CROISE TOUJOURS"));
  assertFalse(ORACLE_PROFILE_USAGE_RULES.includes("Ne demande une info QUE"));
});

Deno.test("anonymous callers cannot inject a profile into the Oracle context", () => {
  assertEquals(
    profileForOracleIdentity(
      { firstName: "Alice", birthDate: "1990-07-16", lifePath: "7" },
      null,
    ),
    {},
  );
});

Deno.test("authenticated callers keep their normalized profile", () => {
  const profile = { firstName: "Alice", birthDate: "1990-07-16" };
  assertEquals(
    profileForOracleIdentity(profile, "00000000-0000-4000-8000-000000000001"),
    profile,
  );
});

Deno.test("authenticated users with an incomplete profile go to onboarding without signing up again", () => {
  const context = missingOracleProfileContext(
    "00000000-0000-4000-8000-000000000001",
  );
  assertStringIncludes(context, "déjà connecté");
  assertStringIncludes(context, "onboarding");
  assertFalse(context.includes("créer son compte gratuit"));
});

Deno.test("profile hints are persisted only for authenticated identities", () => {
  assertFalse(shouldPersistOracleProfileHints(null));
  assertEquals(
    shouldPersistOracleProfileHints("00000000-0000-4000-8000-000000000001"),
    true,
  );
});
