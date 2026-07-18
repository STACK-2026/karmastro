import { describe, expect, it } from "vitest";
import { getMoonPhase } from "@/lib/numerology";

describe("getMoonPhase", () => {
  it.each([
    ["2023-12-12", "Nouvelle Lune"],
    ["2024-01-11", "Nouvelle Lune"],
    ["2024-02-09", "Nouvelle Lune"],
  ])("classe la nouvelle lune connue du %s", (isoDate, expectedPhase) => {
    const result = getMoonPhase(new Date(`${isoDate}T12:00:00Z`));

    expect(result.phase).toBe(expectedPhase);
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.illumination).toBeLessThanOrEqual(100);
  });

  it("ne mute pas la date reçue pendant le passage janvier/février", () => {
    const date = new Date("2024-01-31T12:00:00Z");
    const before = date.getTime();

    getMoonPhase(date);

    expect(date.getTime()).toBe(before);
  });
});
