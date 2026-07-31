import {
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isAuthorizedServiceRequest } from "./internal-auth.ts";

const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role.abc123DEF456ghi789";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon.zzz000zzz000zzz000";

Deno.test("authorizes the exact configured bearer token", () => {
  assertEquals(
    isAuthorizedServiceRequest(`Bearer ${SERVICE_KEY}`, SERVICE_KEY),
    true,
  );
  assertEquals(
    isAuthorizedServiceRequest(`bearer ${SERVICE_KEY}`, SERVICE_KEY),
    true,
  );
});

Deno.test("rejects missing, malformed, user and partial tokens", () => {
  assertFalse(isAuthorizedServiceRequest(null, SERVICE_KEY));
  assertFalse(isAuthorizedServiceRequest("", SERVICE_KEY));
  assertFalse(isAuthorizedServiceRequest(SERVICE_KEY, SERVICE_KEY));
  assertFalse(isAuthorizedServiceRequest("Bearer", SERVICE_KEY));
  assertFalse(isAuthorizedServiceRequest("Bearer wrong-token", SERVICE_KEY));
  assertFalse(isAuthorizedServiceRequest(`Bearer ${ANON_KEY}`, SERVICE_KEY));
  assertFalse(
    isAuthorizedServiceRequest(
      `Bearer ${SERVICE_KEY.slice(0, -3)}`,
      SERVICE_KEY,
    ),
  );
});

Deno.test("fails closed without a configured secret", () => {
  assertFalse(isAuthorizedServiceRequest(`Bearer ${SERVICE_KEY}`, ""));
  assertFalse(isAuthorizedServiceRequest(`Bearer ${SERVICE_KEY}`, null));
  assertFalse(isAuthorizedServiceRequest(`Bearer ${SERVICE_KEY}`, undefined));
});
