import {
  BASE_SPEED, COINS_PER_MULTIPLIER, INVULN_DURATION, MAX_MULTIPLIER, MAX_SPEED, NITRO_DURATION,
  NITRO_SPEED_FACTOR, PLAYER_H, PLAYER_W, PLAYER_Y, SHIELD_DURATION, SPEED_PER_SECOND,
} from './constants';
import { aabb, hitbox, isHazard } from './collision';
import { clampLane, laneCenter, tweenX } from './lanes';
import { nextRandom } from './rng';
import { isOffscreen, spawnInterval, spawnWave, updateKeke } from './spawner';
import type { Entity, GameState } from './types';

export function speedAt(time: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + SPEED_PER_SECOND * time);
}

export function multiplierFor(coins: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(coins / COINS_PER_MULTIPLIER));
}

export function moveLane(state: GameState, dir: -1 | 1): void {
  if (state.status !== 'playing') return;
  const next = clampLane(state.targetLane + dir);
  if (next !== state.targetLane) {
    state.targetLane = next;
    state.events.push('lane');
  }
}

export function burst(state: GameState, x: number, y: number, color: string, count: number, power = 160): void {
  for (let i = 0; i < count; i++) {
    const [a, s1] = nextRandom(state.rng);
    const [b, s2] = nextRandom(s1);
    state.rng = s2;
    const angle = a * Math.PI * 2;
    const v = power * (0.4 + b * 0.6);
    const life = 0.35 + b * 0.35;
    state.particles.push({ x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, life, maxLife: life, size: 2 + b * 3, color });
  }
}

function crash(state: GameState): void {
  state.shake = 1;
  state.events.push('crash');
  state.status = 'gameover';
  burst(state, state.playerX, PLAYER_Y, '#ff5a36', 30, 260);
}

function collect(state: GameState, e: Entity): void {
  switch (e.kind) {
    case 'naira':
      state.coins += 1;
      state.multiplier = multiplierFor(state.coins);
      state.score += 10 * state.multiplier;
      state.events.push('coin');
      burst(state, e.x, e.y, '#ffd60a', 10);
      break;
    case 'helmet':
      state.shield = SHIELD_DURATION;
      state.events.push('helmet');
      burst(state, e.x, e.y, '#4cc9f0', 14);
      break;
    case 'nitro':
      state.nitro = NITRO_DURATION;
      state.events.push('nitro');
      burst(state, e.x, e.y, '#ff7b00', 16);
      // Turbo surge clears everything dangerous on screen.
      for (const o of state.entities) {
        if (isHazard(o)) {
          burst(state, o.x, o.y, '#ff7b00', 6);
          o.y = Infinity;
        }
      }
      break;
    default:
      break;
  }
}

function hitHazard(state: GameState, e: Entity): void {
  if (state.nitro > 0) {
    e.y = Infinity; // smashed through
    state.shake = Math.max(state.shake, 0.4);
    return;
  }
  if (e.kind === 'pothole') {
    if (state.shield > 0 || state.invuln > 0) return;
    state.lives -= 1;
    state.invuln = INVULN_DURATION;
    state.shake = 0.6;
    state.events.push('pothole');
    burst(state, e.x, e.y, '#8d6e63', 12);
    if (state.lives <= 0) crash(state);
    return;
  }
  // Vehicles: unavoidable end of run (helmet only protects vs potholes).
  crash(state);
}

/** Advance the simulation by dt seconds (mutates and returns state). */
export function update(state: GameState, rawDt: number): GameState {
  if (state.status !== 'playing') {
    tickEffects(state, rawDt);
    return state;
  }
  const dt = Math.min(rawDt, 0.05);
  state.time += dt;
  state.nitro = Math.max(0, state.nitro - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.invuln = Math.max(0, state.invuln - dt);

  const base = speedAt(state.time);
  state.speed = state.nitro > 0 ? base * NITRO_SPEED_FACTOR : base;
  const dy = state.speed * dt;
  state.distance += dy / 10;
  state.score += (dy / 100) * state.multiplier;

  state.playerX = tweenX(state.playerX, laneCenter(state.targetLane), dt);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnWave(state);
    state.spawnTimer += spawnInterval(state.speed);
  }

  const player = hitbox({ x: state.playerX, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H });
  const kept: Entity[] = [];
  for (const e of state.entities) {
    e.y += dy * (e.kind === 'keke' ? 0.85 : 1);
    if (e.kind === 'keke') updateKeke(state, e, dt);
    if (isOffscreen(e) || e.y === Infinity) continue;
    if (state.status === 'playing' && aabb(player, hitbox(e))) {
      if (isHazard(e)) {
        hitHazard(state, e);
        if (e.y === Infinity) continue;
      } else {
        collect(state, e);
        continue;
      }
    }
    kept.push(e);
  }
  state.entities = kept.filter((e) => e.y !== Infinity);
  state.score = Math.floor(state.score * 1000) / 1000;
  tickEffects(state, dt);
  return state;
}

function tickEffects(state: GameState, dt: number): void {
  state.shake = Math.max(0, state.shake - dt * 2.5);
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

export function displayScore(state: GameState): number {
  return Math.floor(state.score);
}
