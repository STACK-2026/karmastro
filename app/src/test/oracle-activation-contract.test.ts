import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appOracle = readFileSync(
  path.join(process.cwd(), "src/pages/OraclePage.tsx"),
  "utf8",
);
const siteOracle = readFileSync(
  path.join(process.cwd(), "../site/src/pages/oracle.astro"),
  "utf8",
);
const chatFunction = readFileSync(
  path.join(process.cwd(), "supabase/functions/oracle-chat/index.ts"),
  "utf8",
);
const pendingFunction = readFileSync(
  path.join(process.cwd(), "supabase/functions/pending-turn/index.ts"),
  "utf8",
);
const claimFunction = readFileSync(
  path.join(process.cwd(), "supabase/functions/claim-anon-session/index.ts"),
  "utf8",
);

describe("Oracle activation journey contract", () => {
  it("keeps the anonymous wall free and separate from paid products", () => {
    expect(siteOracle).toContain("Créer mon profil gratuit et continuer");
    expect(siteOracle).not.toContain('id="km-pw-etoile"');
    expect(siteOracle).not.toContain('id="km-pw-one-shot"');
    expect(siteOracle).not.toContain("4,90 €");
    expect(siteOracle).not.toContain("5,99 €");
    expect(appOracle).not.toContain('navigate("/pricing")');
    expect(appOracle).not.toContain("oraclePaywallEtoileClickEvent");
  });

  it("does not show a delayed quota reset on the immediate signup continuation wall", () => {
    expect(siteOracle).not.toContain("pw && pw.next_available_at");
    expect(appOracle).toContain(
      'pendingTurn.wallType === "authenticated_interim_limit_v1" && pendingAvailabilityText',
    );
  });

  it("stores the blocked question before returning the limit response", () => {
    const storeIndex = chatFunction.indexOf("const pending = await storePendingTurn");
    const responseIndex = chatFunction.indexOf('error: "daily_limit"', storeIndex);
    expect(storeIndex).toBeGreaterThan(-1);
    expect(responseIndex).toBeGreaterThan(storeIndex);
    expect(chatFunction).toContain("pending_turn_id: pending.id");
  });

  it("never extends the 72-hour retention window when updating a pending turn", () => {
    const updateStart = chatFunction.indexOf("if (existing?.id)");
    const insertStart = chatFunction.indexOf("const { data, error }", updateStart);
    const updateBlock = chatFunction.slice(updateStart, insertStart);
    const insertBlock = chatFunction.slice(insertStart, insertStart + 400);

    expect(updateBlock).not.toContain("expires_at");
    expect(insertBlock).toContain("expires_at: expiresAt");
  });

  it("requires ownership and encrypted content for continuation", () => {
    expect(pendingFunction).toContain('.eq("user_id", userId)');
    expect(pendingFunction).toContain("decryptPendingTurn");
    expect(chatFunction).toContain("pending_turn_content_mismatch");
    expect(claimFunction).toContain("sessionHmac(normalizedSessionId");
    expect(claimFunction).not.toContain(
      '.from("oracle_pending_turns")\n      .eq("session_id"',
    );
  });

  it("consumes the activation grant only after the exchange is persisted", () => {
    const persistedGuard = chatFunction.indexOf("if (!exchangePersisted)");
    const consume = chatFunction.indexOf('"consume_oracle_activation_grant"', persistedGuard);
    expect(persistedGuard).toBeGreaterThan(-1);
    expect(consume).toBeGreaterThan(persistedGuard);
    expect(chatFunction).toContain("releaseActivationReservation");
  });
});
