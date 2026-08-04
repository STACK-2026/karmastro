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
const siteOracleLocale = readFileSync(
  path.join(process.cwd(), "../site/src/utils/oracle-locale.mjs"),
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
  it("keeps signup for anonymous App users and exposes attributed Étoile CTAs at quota", () => {
    expect(siteOracle).toContain('id="km-pw-etoile"');
    expect(siteOracle).toContain("/pricing?source=oracle_site_limit");
    expect(siteOracle).toContain("oraclePaywallCopy(oracleLocale)");
    expect(siteOracleLocale).toContain("5,99 €");
    expect(appOracle).toContain('pendingTurn.wallType === "anonymous_signup_wall_v1" && !user');
    expect(appOracle).toContain('navigate("/pricing?source=oracle_app_limit")');
    expect(appOracle).toContain("paywallEtoileClickEvent");
    expect(appOracle).toContain("shouldShowOracleEtoileLimitCta");
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

  it("reuses an already-rendered pending question without duplicating it", () => {
    expect(appOracle).toContain("const reusesQueuedMessage = Boolean(");
    expect(appOracle).toContain(
      "const requestMessages = reusesQueuedMessage ? messages : [...messages, userMsg]",
    );
    expect(appOracle).toContain(
      "if (!reusesQueuedMessage) setMessages(prev => [...prev, userMsg])",
    );
    expect(appOracle).toContain(
      "assignPendingTurnId(current, limit.pendingTurnId, lastIndex)",
    );
    expect(appOracle).toContain("message.pendingTurnId === pendingTurn.id");
    expect(appOracle).not.toContain("const previousText = pendingTurn.text");
  });

  it("preserves every chat question length accepted by the server", () => {
    expect(chatFunction).toContain("if (text.length > 4_000)");
    expect(pendingFunction).toContain("text.length <= 4_000");
    expect(appOracle).toContain("maxLength={4000}");
  });

  it("marks expired active rows inactive before inserting a replacement", () => {
    const expiration = chatFunction.indexOf('.update({ status: "expired"');
    const lookup = chatFunction.indexOf("let existingQuery", expiration);
    const insert = chatFunction.indexOf(".insert({", lookup);
    expect(expiration).toBeGreaterThan(-1);
    expect(lookup).toBeGreaterThan(expiration);
    expect(insert).toBeGreaterThan(lookup);
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

  it("allows every browser method used by pending-turn and refreshes at availability", () => {
    expect(pendingFunction).toContain(
      '"Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"',
    );
    expect(appOracle).toContain("window.setTimeout(");
    expect(appOracle).toContain("setPendingAvailabilityNow(Date.now())");
    expect(appOracle).toContain(
      "Date.parse(pendingTurn.nextAvailableAt) <= pendingAvailabilityNow",
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
