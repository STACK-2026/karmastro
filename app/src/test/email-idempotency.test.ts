import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeEmailIdempotencyKey } from "../../supabase/functions/_shared/email-idempotency";

const sendEmailSource = readFileSync(
  resolve(process.cwd(), "supabase/functions/send-email/index.ts"),
  "utf8",
);

describe("Resend idempotency key policy", () => {
  it("accepts a stable welcome entity key", () => {
    expect(normalizeEmailIdempotencyKey("welcome-user/123e4567-e89b-12d3-a456-426614174000"))
      .toBe("welcome-user/123e4567-e89b-12d3-a456-426614174000");
  });

  it("rejects empty, header-injection and oversized keys", () => {
    expect(normalizeEmailIdempotencyKey(null)).toBeNull();
    expect(normalizeEmailIdempotencyKey("welcome\r\nInjected: true")).toBeNull();
    expect(normalizeEmailIdempotencyKey("x".repeat(257))).toBeNull();
  });

  it("forwards only the normalized key to Resend", () => {
    expect(sendEmailSource).toContain('"Idempotency-Key": idempotencyKey');
    expect(sendEmailSource).toContain("normalizeEmailIdempotencyKey(idempotencyKey)");
  });
});
