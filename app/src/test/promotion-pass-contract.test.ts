import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260728213000_etoile_pass_48h.sql",
);

describe("Etoile Pass 48 h server contract", () => {
  it("uses service-only campaign, grant and idempotent turn tables", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/create table(?: if not exists)? public\.promotion_campaigns/i);
    expect(sql).toMatch(/create table(?: if not exists)? public\.promotion_grants/i);
    expect(sql).toMatch(/create table(?: if not exists)? public\.promotion_grant_oracle_turns/i);
    expect(sql).toMatch(/unique\s*\(\s*campaign_code\s*,\s*user_id\s*\)/i);
    expect(sql).toMatch(/unique\s*\(\s*grant_id\s*,\s*request_id\s*\)/i);
    expect(sql).toMatch(/activated_at\s*\+\s*interval\s*'48 hours'/i);
    expect(sql).toMatch(/oracle_hourly_cap[^;]+default\s+20/is);
    expect(sql).toMatch(/oracle_total_cap[^;]+default\s+100/is);
    expect(sql).toMatch(/max_grants[^;]+default\s+30/is);
    expect(sql).toMatch(/enable row level security/gi);
    expect(sql).toMatch(/revoke all on (?:table )?public\.promotion_grants from public,\s*anon,\s*authenticated/i);
  });

  it("keeps activation and Oracle authorization service-only", () => {
    const sql = readFileSync(migrationPath, "utf8");

    for (const fn of [
      "get_effective_app_access",
      "activate_promotion_pass",
      "authorize_promotion_oracle_turn",
      "assign_promotion_offers",
    ]) {
      expect(sql).toMatch(new RegExp(`revoke all on function public\\.${fn}`, "i"));
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${fn}[^;]+to service_role`, "is"));
    }
    expect(sql).toMatch(/campaign\.issuance_enabled/i);
    expect(sql).toMatch(/v_requested\s*>\s*30/i);
    expect(sql).toContain("promotion_campaign_grant_cap_exceeded");
    expect(sql).toContain("karmastro-promotion-turn-retention");
    expect(sql).toMatch(/for update/i);
  });

  it("blocks client writes to billing and admin profile columns", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/before insert or update on public\.profiles/i);
    for (const column of [
      "subscription_tier",
      "subscription_status",
      "subscription_period_end",
      "stripe_customer_id",
      "stripe_subscription_id",
      "credits",
      "is_admin",
      "badges",
    ]) {
      expect(sql).toContain(column);
    }
    expect(sql).toMatch(/revoke execute on function public\.increment_oracle_usage/i);
    expect(sql).toMatch(/revoke execute on function public\.consume_credit/i);
  });

  it("authenticates the Edge caller and never accepts a client user id", () => {
    const source = readFileSync(
      path.join(process.cwd(), "supabase/functions/promotion-pass/index.ts"),
      "utf8",
    );
    const policy = readFileSync(
      path.join(process.cwd(), "supabase/functions/_shared/promotion-pass-policy.ts"),
      "utf8",
    );

    expect(source).toContain("auth.getUser()");
    expect(source).not.toMatch(/body\.(?:userId|user_id)/);
    expect(policy).toContain('"activate"');
    expect(policy).toContain("idempotency_key");
  });

  it("fails Oracle quota checks closed before the model call", () => {
    const source = readFileSync(
      path.join(process.cwd(), "supabase/functions/oracle-chat/index.ts"),
      "utf8",
    );

    expect(source).toContain('"authorize_promotion_oracle_turn"');
    expect(source).toMatch(/usageCheckErr[\s\S]+status:\s*503/);
    expect(source).toMatch(/if\s*\(!SERVICE_KEY\)[^{]*\{?[\s\S]{0,200}identity_service_unavailable/);
  });
});
