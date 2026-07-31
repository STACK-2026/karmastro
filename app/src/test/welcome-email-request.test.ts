import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  requestWelcomeEmail,
  resolveWelcomeLocalePreference,
} from "@/lib/welcome-email";

const authContextSource = readFileSync(
  resolve(process.cwd(), "src/contexts/AuthContext.tsx"),
  "utf8",
);
const sendWelcomeSource = readFileSync(
  resolve(process.cwd(), "supabase/functions/send-welcome/index.ts"),
  "utf8",
);
const welcomeDeliverySource = readFileSync(
  resolve(process.cwd(), "supabase/functions/_shared/welcome-delivery.ts"),
  "utf8",
);

describe("authenticated welcome request", () => {
  it("sends only the locale and bearer token, never a recipient address", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ status: "sent" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));

    await requestWelcomeEmail("user-access-token", "es", fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/send-welcome");
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer user-access-token",
        "Content-Type": "application/json",
      },
    });
    expect(JSON.parse(String(init.body))).toEqual({ locale: "es" });
    expect(String(init.body)).not.toContain("email");
    expect(String(init.body)).not.toContain("to");
  });

  it("surfaces a bounded error without including the response body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(
      "sensitive provider response",
      { status: 502 },
    ));

    await expect(requestWelcomeEmail("token", "fr", fetchImpl)).rejects.toThrow("welcome_email_request_failed:502");
  });

  it("wires delivery only to SIGNED_IN and lets the server resolve the recipient", () => {
    expect(authContextSource).toContain('event === "SIGNED_IN"');
    expect(authContextSource).toContain("requestWelcomeEmail(session.access_token, detectWelcomeLocale())");
    expect(sendWelcomeSource).toContain("db.auth.getUser(token)");
    expect(sendWelcomeSource).toContain("email: authUser.email");
    expect(sendWelcomeSource).toContain("deliverWelcome({");
    expect(sendWelcomeSource).toContain(".update({ language: locale })");
    expect(sendWelcomeSource).not.toMatch(/body\.(to|email)/);
  });

  it("carries a stable provider idempotency key into the protected sender", () => {
    expect(welcomeDeliverySource).toContain("idempotencyKey: `welcome-user/${user.id}`");
  });

  it("preserves a regional navigator locale even when the current UI lacks it", () => {
    expect(resolveWelcomeLocalePreference({ navigatorLanguages: ["ko-KR", "en-US"] }))
      .toBe("ko-KR");
    expect(resolveWelcomeLocalePreference({ navigatorLanguages: ["es_MX"] }))
      .toBe("es-MX");
  });

  it("prefers an explicit app choice and ignores malformed locale input", () => {
    expect(resolveWelcomeLocalePreference({
      query: "not a locale",
      cookie: "pt-BR",
      navigatorLanguages: ["fr-FR"],
    })).toBe("pt-BR");
    expect(resolveWelcomeLocalePreference({ navigatorLanguages: [] })).toBe("fr-FR");
  });
});
