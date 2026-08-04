import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  resolve(import.meta.dirname, "../pages/OraclePage.tsx"),
  "utf8",
);

describe("Oracle mobile viewport", () => {
  it("keeps the reply input inside the dynamic iOS viewport", () => {
    expect(page).toContain(
      'className="h-[100dvh] min-h-0 overflow-hidden bg-background pb-20 flex flex-col relative"',
    );
    expect(page).toContain(
      'className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4"',
    );
    expect(page).toContain('className="relative z-10 shrink-0 px-5 pb-4"');
  });
});
