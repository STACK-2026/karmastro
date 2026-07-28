import { describe, expect, it } from "vitest";
import {
  getPostAuthPath,
  POST_AUTH_PATH_KEY,
  sanitizePostAuthPath,
} from "@/lib/postAuth";
import { sanitizeHandoffId } from "@/lib/tracker";

describe("sanitizePostAuthPath", () => {
  it("keeps only supported same-origin product destinations", () => {
    expect(sanitizePostAuthPath("/oracle")).toBe("/oracle");
    expect(sanitizePostAuthPath("/pricing")).toBe("/pricing");
    expect(sanitizePostAuthPath("/dashboard")).toBe("/dashboard");
    expect(sanitizePostAuthPath("/astral")).toBe("/astral");
    expect(sanitizePostAuthPath("/onboarding")).toBe("/onboarding");
    expect(sanitizePostAuthPath(
      "/onboarding?resume=550e8400-e29b-41d4-a716-446655440000&next=%2Foracle&reason=oracle_pending",
    )).toBe(
      "/onboarding?resume=550e8400-e29b-41d4-a716-446655440000&next=%2Foracle&reason=oracle_pending",
    );
  });

  it("rejects open redirects, protocol-relative URLs and unknown routes", () => {
    expect(sanitizePostAuthPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizePostAuthPath("//evil.example")).toBe("/dashboard");
    expect(sanitizePostAuthPath("/admin")).toBe("/dashboard");
    expect(sanitizePostAuthPath("/onboarding?next=https://evil.example")).toBe("/onboarding");
    expect(sanitizePostAuthPath(null)).toBe("/dashboard");
  });

  it("consumes the post-auth destination once", () => {
    localStorage.setItem(POST_AUTH_PATH_KEY, "/oracle");
    expect(getPostAuthPath()).toBe("/oracle");
    expect(localStorage.getItem(POST_AUTH_PATH_KEY)).toBeNull();
  });
});

describe("sanitizeHandoffId", () => {
  it("accepts only random UUID v4 handoff identifiers", () => {
    expect(sanitizeHandoffId("550E8400-E29B-41D4-A716-446655440000"))
      .toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(sanitizeHandoffId("../profile")).toBeNull();
    expect(sanitizeHandoffId("550e8400-e29b-11d4-a716-446655440000")).toBeNull();
    expect(sanitizeHandoffId(null)).toBeNull();
  });
});
