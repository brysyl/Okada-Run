# Game state schema

Defined in `src/game-engine/types.ts`. The state is a single mutable object owned by `useOkadaGame` (in a ref) and advanced by `update(state, dt)`. React only receives throttled HUD snapshots (~10Hz).

| Field | Type | Notes |
| --- | --- | --- |
| status | `'menu' \| 'playing' \| 'gameover'` | |
| time, distance | number | seconds, metres (world units / 10) |
| score | number | float internally, `floor` for display |
| coins, multiplier | number | multiplier = `min(5, 1 + floor(coins / 5))` |
| speed | number | world units/s: `min(640, 240 + 6 * time)`, x2 during nitro |
| lives | number | starts at 3, potholes cost 1 |
| targetLane, playerX | number | lane index 0..2; playerX is tweened (`1 - exp(-20 dt)`) |
| shield, nitro, invuln | number | remaining seconds (8, 3, 1.2 on trigger) |
| shake | number | 0..1, decays at 2.5/s |
| entities | `Entity[]` | `kind`: danfo, keke, pothole, naira, helmet, nitro; center x/y, w/h |
| particles | `Particle[]` | short-lived pickup/crash bursts |
| events | `GameEvent[]` | drained each frame for audio: coin, crash, pothole, helmet, nitro, lane |
| rng | number | mulberry32 seed; engine is deterministic for a given seed |

World is 360x640 logical units; the canvas scales it. Road: x 30..330, three 100-wide lanes, centres 80/180/280. Player y = 530.
