import { describe, expect, it } from "vitest";
import { sanitizePostAuthPath } from "@/lib/postAuth";

describe("sanitizePostAuthPath", () => {
  it("keeps only supported same-origin product destinations", () => {
    expect(sanitizePostAuthPath("/oracle")).toBe("/oracle");
    expect(sanitizePostAuthPath("/pricing")).toBe("/pricing");
    expect(sanitizePostAuthPath("/dashboard")).toBe("/dashboard");
  });

  it("rejects open redirects, protocol-relative URLs and unknown routes", () => {
    expect(sanitizePostAuthPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizePostAuthPath("//evil.example")).toBe("/dashboard");
    expect(sanitizePostAuthPath("/admin")).toBe("/dashboard");
    expect(sanitizePostAuthPath(null)).toBe("/dashboard");
  });
});
