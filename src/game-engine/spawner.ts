import { DESPAWN_Y, LANES, SIZES, SPAWN_Y } from './constants';
import { laneCenter } from './lanes';
import { nextRandom } from './rng';
import type { Entity, EntityKind, GameState } from './types';

function rand(state: GameState): number {
  const [v, seed] = nextRandom(state.rng);
  state.rng = seed;
  return v;
}

export function spawnInterval(speed: number): number {
  // Keep spacing in world units roughly constant-ish but tighter as we speed up.
  return Math.max(0.38, 150 / speed + 0.25);
}

function make(state: GameState, kind: EntityKind, x: number, y = SPAWN_Y): Entity {
  const { w, h } = SIZES[kind];
  const e: Entity = { id: state.nextId++, kind, x, y, w, h };
  if (kind === 'keke') {
    e.targetX = x;
    e.decisionTimer = 0.4 + rand(state) * 0.6;
  }
  state.entities.push(e);
  return e;
}

/** Spawn one wave. Danfos span two lanes (always leaving one lane open). */
export function spawnWave(state: GameState): void {
  const r = rand(state);
  if (r < 0.22) {
    const left = Math.floor(rand(state) * (LANES - 1));
    make(state, 'danfo', (laneCenter(left) + laneCenter(left + 1)) / 2);
  } else if (r < 0.44) {
    make(state, 'keke', laneCenter(Math.floor(rand(state) * LANES)));
  } else if (r < 0.7) {
    make(state, 'pothole', laneCenter(Math.floor(rand(state) * LANES)));
  } else if (r < 0.95) {
    const lane = Math.floor(rand(state) * LANES);
    const count = 3 + Math.floor(rand(state) * 3);
    for (let i = 0; i < count; i++) make(state, 'naira', laneCenter(lane), SPAWN_Y - i * 44);
  } else {
    make(state, rand(state) < 0.5 ? 'helmet' : 'nitro', laneCenter(Math.floor(rand(state) * LANES)));
  }
}

/** Steer Keke Napeps erratically between lanes. */
export function updateKeke(state: GameState, e: Entity, dt: number): void {
  if (e.targetX === undefined || e.decisionTimer === undefined) return;
  e.decisionTimer -= dt;
  if (e.decisionTimer <= 0 && e.y > -40) {
    const current = Math.round((e.targetX - laneCenter(0)) / (laneCenter(1) - laneCenter(0)));
    const dir = rand(state) < 0.5 ? -1 : 1;
    const lane = Math.max(0, Math.min(LANES - 1, current + dir));
    e.targetX = laneCenter(lane);
    e.decisionTimer = 0.5 + rand(state) * 0.9;
  }
  const step = 140 * dt;
  const diff = e.targetX - e.x;
  e.x += Math.abs(diff) <= step ? diff : Math.sign(diff) * step;
}

export function isOffscreen(e: Entity): boolean {
  return e.y > DESPAWN_Y;
}
