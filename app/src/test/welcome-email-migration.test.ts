import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260731143000_welcome_email_delivery.sql"),
  "utf8",
);
const config = readFileSync(
  resolve(process.cwd(), "supabase/config.toml"),
  "utf8",
);

describe("welcome delivery database contract", () => {
  it("uses a private one-row-per-user delivery ledger", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.welcome_email_deliveries");
    expect(migration).toMatch(/user_id\s+UUID\s+PRIMARY KEY/i);
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).not.toMatch(/CREATE POLICY/i);
  });

  it("stores all canonical app locales while migrating legacy profile values", () => {
    const canonicalLocales = [
      "fr-FR", "en-US", "es-ES", "es-MX", "de-DE", "it-IT", "pt-BR",
      "nl-NL", "ja-JP", "ko-KR", "zh-Hans", "ar", "tr-TR", "pl-PL",
      "ru-RU", "uk-UA", "cs-CZ", "hu-HU", "ro-RO", "sv-SE", "da-DK",
      "nb-NO", "fi-FI", "el-GR", "th-TH", "vi-VN", "id-ID", "ms-MY",
    ];
    for (const locale of canonicalLocales) {
      expect(migration).toContain(`'${locale}'`);
    }
    expect(migration).toContain("WHEN 'es' THEN 'es-ES'");
    expect(migration).toContain("WHEN 'es-mx' THEN 'es-MX'");
  });

  it("keeps profile creation but removes the obsolete direct email POST", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
    expect(migration).toContain("INSERT INTO public.profiles (user_id)");
    expect(migration).not.toContain("net.http_post");
    expect(migration).not.toContain("functions/v1/send-email");
  });

  it("defines its own updated-at trigger instead of depending on live schema drift", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.set_welcome_email_delivery_updated_at()",
    );
    expect(migration).toContain(
      "EXECUTE FUNCTION public.set_welcome_email_delivery_updated_at()",
    );
    expect(migration).not.toContain(
      "EXECUTE FUNCTION public.update_updated_at_column()",
    );
  });

  it("seeds successful historical welcomes before the new client path", () => {
    expect(migration).toContain("FROM public.email_log AS email_log");
    expect(migration).toContain("email_log.status = 'sent'");
    expect(migration).toContain("lower(email_log.recipient) = lower(users.email)");
    expect(migration).toContain("ON CONFLICT (user_id) DO NOTHING");
  });

  it("records code-authenticated JWT modes for both email functions", () => {
    expect(config).toMatch(/\[functions\.send-email\][\s\S]*?verify_jwt\s*=\s*false/);
    expect(config).toMatch(/\[functions\.send-welcome\][\s\S]*?verify_jwt\s*=\s*false/);
  });
});
