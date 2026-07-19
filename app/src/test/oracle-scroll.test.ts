import { describe, expect, it } from "vitest";
import { shouldAutoScrollOracle } from "@/lib/oracle-scroll";

describe("Oracle conversation scrolling", () => {
  it("scrolls once when a new message bubble is added", () => {
    expect(shouldAutoScrollOracle(2, 3)).toBe(true);
  });

  it("keeps the viewport stable while streaming updates an existing bubble", () => {
    expect(shouldAutoScrollOracle(3, 3)).toBe(false);
  });

  it("does not jump when history is cleared or replaced with fewer messages", () => {
    expect(shouldAutoScrollOracle(3, 0)).toBe(false);
  });
});
