import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  OracleRequestError,
  normalizeChatRequest,
} from "./oracle-request.ts";

Deno.test("normalizes pending-turn and request UUIDs", () => {
  const request = normalizeChatRequest({
    messages: [{ role: "user", content: "Ma question" }],
    pendingTurnId: "018f2b65-7b3f-7c1a-8f01-123456789abc",
    requestId: "018f2b65-7b3f-7c1a-8f01-123456789abd",
  });
  assertEquals(request.pendingTurnId, "018f2b65-7b3f-7c1a-8f01-123456789abc");
  assertEquals(request.requestId, "018f2b65-7b3f-7c1a-8f01-123456789abd");
});

Deno.test("rejects malformed pending-turn identifiers", () => {
  const error = assertThrows(() => normalizeChatRequest({
    messages: [{ role: "user", content: "Ma question" }],
    pendingTurnId: "not-a-uuid",
  }));
  if (!(error instanceof OracleRequestError)) {
    throw new Error("Expected OracleRequestError");
  }
  assertEquals(error.message, "invalid_pending_turn_id");
});
