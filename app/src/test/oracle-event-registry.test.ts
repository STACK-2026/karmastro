import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type RegistryEvent = {
  name: string;
  introduced_at: string;
  journey_version: string;
  allowed_properties: string[];
};

const analyticsSource = readFileSync(
  path.join(process.cwd(), "src/lib/oracle-analytics.ts"),
  "utf8",
);
const oraclePageSource = readFileSync(
  path.join(process.cwd(), "src/pages/OraclePage.tsx"),
  "utf8",
);
const registry = JSON.parse(readFileSync(
  path.join(process.cwd(), "../analytics/oracle-events-v1.json"),
  "utf8",
)) as { events: RegistryEvent[] };

describe("Oracle event registry", () => {
  it("has unique, dated and versioned events", () => {
    const names = registry.events.map((event) => event.name);
    expect(new Set(names).size).toBe(names.length);

    for (const event of registry.events) {
      expect(event.introduced_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect([
        "oracle_conversation_v1",
        "oracle_activation_v1",
        "oracle_acquisition_v1",
      ]).toContain(event.journey_version);
      expect(event.allowed_properties).toContain("journey_version");
    }
  });

  it("registers the first-question and category signals", () => {
    expect(registry.events.map((event) => event.name)).toEqual(
      expect.arrayContaining([
        "oracle_category_selected",
        "oracle_first_question_submitted",
        "oracle_first_response",
      ]),
    );
  });

  it("covers every event emitted by the Oracle analytics module and page", () => {
    const registered = new Set(registry.events.map((event) => event.name));
    const emitted = [
      ...analyticsSource.matchAll(/name:\s*"([a-z_]+)"/g),
      ...oraclePageSource.matchAll(/trackEvent\("((?:oracle|paywall)_[a-z_]+)"/g),
    ].map((match) => match[1]);

    for (const event of emitted) expect(registered.has(event)).toBe(true);
  });
});
