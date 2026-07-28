import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  PROMOTION_PASS_OFFER_CODE,
  normalizePromotionPassRequest,
} from "./promotion-pass-policy.ts";

Deno.test("promotion pass GET is status-only", () => {
  assertEquals(normalizePromotionPassRequest("GET"), {
    action: "status",
    offerCode: PROMOTION_PASS_OFFER_CODE,
    idempotencyKey: null,
  });
});

Deno.test("promotion pass activation accepts only the fixed offer and UUID", () => {
  assertEquals(normalizePromotionPassRequest("POST", {
    action: "activate",
    offer_code: PROMOTION_PASS_OFFER_CODE,
    idempotency_key: "7bbf41e6-95d9-4c50-a1a4-3cfc2fa37376",
  }), {
    action: "activate",
    offerCode: PROMOTION_PASS_OFFER_CODE,
    idempotencyKey: "7bbf41e6-95d9-4c50-a1a4-3cfc2fa37376",
  });

  assertThrows(() => normalizePromotionPassRequest("POST", {
    action: "activate",
    offer_code: "other",
    idempotency_key: "7bbf41e6-95d9-4c50-a1a4-3cfc2fa37376",
  }));
});

Deno.test("promotion pass never accepts a caller-selected user id", () => {
  const normalized = normalizePromotionPassRequest("POST", {
    action: "activate",
    offer_code: PROMOTION_PASS_OFFER_CODE,
    idempotency_key: "7bbf41e6-95d9-4c50-a1a4-3cfc2fa37376",
    user_id: "another-user",
  });
  assertEquals(Object.keys(normalized).sort(), ["action", "idempotencyKey", "offerCode"]);
});
