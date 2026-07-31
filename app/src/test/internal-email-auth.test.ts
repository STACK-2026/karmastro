import { describe, expect, it } from "vitest";
import { isAuthorizedServiceRequest } from "../../supabase/functions/_shared/internal-auth";

const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role.abc123DEF456ghi789";

describe("internal email authorization", () => {
  it("accepts only the exact configured bearer token", () => {
    expect(isAuthorizedServiceRequest(`Bearer ${SERVICE_KEY}`, SERVICE_KEY)).toBe(true);
    expect(isAuthorizedServiceRequest(`bearer ${SERVICE_KEY}`, SERVICE_KEY)).toBe(true);
    expect(isAuthorizedServiceRequest("Bearer wrong", SERVICE_KEY)).toBe(false);
    expect(isAuthorizedServiceRequest(SERVICE_KEY, SERVICE_KEY)).toBe(false);
    expect(isAuthorizedServiceRequest(null, SERVICE_KEY)).toBe(false);
  });

  it("fails closed when the configured secret is empty", () => {
    expect(isAuthorizedServiceRequest(`Bearer ${SERVICE_KEY}`, "")).toBe(false);
    expect(isAuthorizedServiceRequest("Bearer ", undefined)).toBe(false);
  });
});
