# Backend integration contract

Derived from `NicolasEmmel/golf-mulligancup-backend` (TournamentHub, REST controllers, DTOs).

## Base URL

Configure via `NEXT_PUBLIC_API_BASE_URL` (no trailing slash).

Production default: `https://golf-tournament-backend.fly.dev`

## SignalR

- **Hub path:** `/hubs/tournament`
- **Full URL:** `NEXT_PUBLIC_SIGNALR_HUB_URL` (e.g. `https://golf-tournament-backend.fly.dev/hubs/tournament`)
- **CORS:** Backend allows any origin with credentials for SignalR.

### Hub methods (invoke from client)

| Method | Arguments | Returns |
|--------|-----------|---------|
| `RegisterScoringClient` | `playerUuid` (GUID string) | `OperationResultDto` |
| `RegisterLeaderboardViewer` | none | void |
| `SubmitScore` | `SubmitScoreRequest` | `OperationResultDto` |
| `SubmitScores` | `SubmitScoresRequest` `{ day, scores: [{ playerUuid, holeId, strokes }] }` | `OperationResultDto` |

After successful scoring registration, server sends `ReceiveSyncState` to caller.

After `RegisterLeaderboardViewer`, server sends `ReceiveSyncState` when payload is available.

### Client events (listen)

| Event | Payload |
|-------|---------|
| `ReceiveSyncState` | `ClientSyncPayloadDto` |
| `ScorecardUpdated` | `PlayerScorecardDto` |
| `LeaderboardUpdated` | `LeaderboardSnapshotDto` |

JSON uses **camelCase** (ASP.NET default serialization).

### Payload notes

- **Leaderboard categories:** `men`, `women`, `seniors` (enum numeric 0–2 in JSON depending on serializer; confirm at integration time).
- **Scoring registration** requires the player to be assigned to a flight for the **current tournament day**.
- Frontend must **not** recalculate gross/net/handicap; display backend values only.

## REST API

### Players — `/api/players`

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/players` | — | `PlayerResponse[]` |
| GET | `/api/players/{uuid}` | — | `PlayerResponse` |
| POST | `/api/players` | `CreatePlayerRequest` | `PlayerResponse` |
| PUT | `/api/players/{uuid}` | `UpdatePlayerRequest` | `PlayerResponse` |
| DELETE | `/api/players/{uuid}` | — | `OperationResultDto` |

### Flights — `/api/flights`

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/flights/{day}` | — | `Flight[]` |
| POST | `/api/flights` | `CreateFlightRequest` | `Flight` |
| POST | `/api/flights/assign` | `AssignPlayerToFlightRequest` | `PlayerFlight` |
| DELETE | `/api/flights/{day}/players/{playerUuid}` | — | `OperationResultDto` |
| GET | `/api/flights/{day}/{flightNumber}/players` | — | `PlayerFlight[]` |

### Tournament — `/api/tournament`

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/tournament/state` | — | `TournamentState` |
| PUT | `/api/tournament/current-day` | `SetCurrentDayRequest` | `TournamentState` |
| POST | `/api/tournament/reset` | `ResetTournamentRequest` | `OperationResultDto` |
| GET | `/api/tournament/course` | — | `{ par, holes[] }` |
| GET | `/api/tournament/leaderboards/{day}` | — | `LeaderboardSnapshotDto[]` |
| GET | `/api/tournament/scorecard/{day}/{playerUuid}` | — | `PlayerScorecardDto` |

### Health

| GET | `/health` | — | `{ status: "ok" }` |

## TypeScript models

See `models/tournament.ts`. Update when backend DTOs change.
