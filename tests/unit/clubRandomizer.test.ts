import { describe, expect, it } from "vitest";
import {
  CLUB_WHEEL_SEGMENT_COUNT,
  clubNumberFromRotation,
  rotationForClubNumber,
} from "@/lib/clubRandomizer";

describe("clubRandomizer", () => {
  it("maps rotation back to club number 1–14", () => {
    for (let n = 1; n <= CLUB_WHEEL_SEGMENT_COUNT; n++) {
      const rot = rotationForClubNumber(0, n);
      expect(clubNumberFromRotation(rot)).toBe(n);
    }
  });

  it("accumulates rotation on repeated spins", () => {
    let rot = 0;
    rot = rotationForClubNumber(rot, 3);
    const afterFirst = rot;
    rot = rotationForClubNumber(rot, 7);
    expect(rot).toBeGreaterThan(afterFirst);
    expect(clubNumberFromRotation(rot)).toBe(7);
  });
});
