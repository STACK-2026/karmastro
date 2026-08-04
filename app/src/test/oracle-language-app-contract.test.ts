import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Oracle App UI-language contract", () => {
  it("passes the current locale to oracle-chat", () => {
    const page = readFileSync(resolve(import.meta.dirname, "../pages/OraclePage.tsx"), "utf8");
    expect(page).toMatch(/body: JSON\.stringify\(\{[\s\S]{0,700}messages:[\s\S]{0,500}locale,/);
  });
});
