import { describe, expect, it } from "vitest";
import {
  isFlightDayComplete,
  scoreDraftKey,
} from "@/lib/scoring";

describe("isFlightDayComplete", () => {
  it("is false when no mates", () => {
    expect(isFlightDayComplete([], {})).toBe(false);
  });

  it("is true for a three-player flight with all holes", () => {
    const mates = ["a", "b", "c"];
    const scores: Record<string, number> = {};
    for (const uuid of mates) {
      for (let h = 1; h <= 18; h++) scores[scoreDraftKey(uuid, h)] = 4;
    }
    expect(isFlightDayComplete(mates, scores)).toBe(true);
  });

  it("is false when any hole is missing", () => {
    const uuid = "a";
    const scores: Record<string, number> = {};
    for (let h = 1; h <= 17; h++) scores[scoreDraftKey(uuid, h)] = 4;
    expect(isFlightDayComplete([uuid], scores)).toBe(false);
  });

  it("is true when every mate has all 18 holes", () => {
    const mates = ["a", "b"];
    const scores: Record<string, number> = {};
    for (const uuid of mates) {
      for (let h = 1; h <= 18; h++) scores[scoreDraftKey(uuid, h)] = 4;
    }
    expect(isFlightDayComplete(mates, scores)).toBe(true);
  });
});
