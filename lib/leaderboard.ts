import {
  LeaderboardCategory,
  type LeaderboardEntry,
  type LeaderboardSnapshot,
} from "@/models/tournament";

/** Entries for the single combined Mulligan Cup board. */
export function pickLeaderboardEntries(
  snapshots: LeaderboardSnapshot[],
): LeaderboardEntry[] {
  const overall = snapshots.find(
    (s) => s.category === LeaderboardCategory.Overall,
  );
  if (overall) {
    return overall.entries;
  }

  if (snapshots.length === 1) {
    return snapshots[0]?.entries ?? [];
  }

  const merged = new Map<string, LeaderboardEntry>();
  for (const snapshot of snapshots) {
    for (const entry of snapshot.entries) {
      merged.set(entry.playerUuid, entry);
    }
  }
  return [...merged.values()];
}
