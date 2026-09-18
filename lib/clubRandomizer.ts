/** Mulligan penalty: wheel picks one of 14 club numbers. */
export const CLUB_WHEEL_SEGMENT_COUNT = 14;

export function pickRandomClubNumber(): number {
  return Math.floor(Math.random() * CLUB_WHEEL_SEGMENT_COUNT) + 1;
}

/** Total wheel rotation (deg) so `clubNumber` ends under the top pointer. */
export function rotationForClubNumber(
  currentRotation: number,
  clubNumber: number,
): number {
  const slice = 360 / CLUB_WHEEL_SEGMENT_COUNT;
  const clamped = Math.min(
    CLUB_WHEEL_SEGMENT_COUNT,
    Math.max(1, Math.round(clubNumber)),
  );
  const finalMod = (clamped - 0.5) * slice;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = finalMod - currentMod;
  if (delta <= 0) delta += 360;
  const extraSpins = 4 + Math.floor(Math.random() * 3);
  return currentRotation + extraSpins * 360 + delta;
}

/** Which segment (1–14) sits under the top pointer at this rotation. */
export function clubNumberFromRotation(rotation: number): number {
  const slice = 360 / CLUB_WHEEL_SEGMENT_COUNT;
  const mod = ((rotation % 360) + 360) % 360;
  const index = Math.min(
    CLUB_WHEEL_SEGMENT_COUNT - 1,
    Math.floor(mod / slice),
  );
  return index + 1;
}
