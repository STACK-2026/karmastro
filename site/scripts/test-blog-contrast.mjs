import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const LIGHT_TLDR_BACKGROUND = "#f5f5f5";

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("light TLDR cards have WCAG AA text contrast in the dark theme", async () => {
  const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
  const color = css.match(/\.tldr\s*\{[^}]*\bcolor:\s*(#[0-9a-f]{6})/i)?.[1];
  const strongColor = css.match(/\.tldr\s+strong\s*\{[^}]*\bcolor:\s*(#[0-9a-f]{6})/i)?.[1];

  assert.ok(color, "A .tldr foreground color must be explicit");
  assert.ok(strongColor, "A .tldr strong foreground color must be explicit");
  assert.ok(contrast(color, LIGHT_TLDR_BACKGROUND) >= 4.5);
  assert.ok(contrast(strongColor, LIGHT_TLDR_BACKGROUND) >= 4.5);
});
