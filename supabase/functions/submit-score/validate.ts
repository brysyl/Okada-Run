/**
 * Pure score plausibility checks for the submit-score edge function.
 * No Deno or URL imports so vitest can run it under Node.
 *
 * IMPORTANT: every metric here is reported by the client. These checks bound what a
 * forged payload can claim (raising the cost of cheating); they cannot prove a run happened.
 */

// Duplicated from src/game-engine/constants.ts and spawner.ts (a vitest asserts they match).
export const BASE_SPEED = 240;
export const SPEED_PER_SECOND = 6;
export const MAX_SPEED = 640;
export const NITRO_DURATION = 3;
export const NITRO_SPEED_FACTOR = 2;
export const MAX_MULTIPLIER = 5;
/** Shortest possible gap between spawn waves (spawnInterval floor). */
export const MIN_WAVE_INTERVAL = 0.38;
/** Most coins one wave can spawn (3 + floor(r * 3) with r < 1). */
export const MAX_COINS_PER_WAVE = 5;

export const MIN_DURATION_S = 1;
export const MAX_DURATION_S = 3600;
export const MAX_SCORE = 10_000_000;
export const MAX_NAME_LENGTH = 12;

export interface SubmittedScore {
  name: string;
  score: number;
  coins: number;
  distance: number;
  durationS: number;
  maxSpeed: number;
  nitroUses: number;
}

export type RejectReason =
  | 'invalid_body'
  | 'invalid_name'
  | 'invalid_number'
  | 'duration_out_of_range'
  | 'max_speed_implausible'
  | 'distance_too_low'
  | 'distance_too_high'
  | 'too_many_coins'
  | 'too_many_nitro'
  | 'score_too_high';

export type ValidationResult = { ok: true; value: SubmittedScore } | { ok: false; reason: RejectReason };

export function sanitizeName(name: string): string {
  const n = name.replace(/[^\w \-.]/g, '').trim().slice(0, MAX_NAME_LENGTH);
  return n || 'RIDER';
}

export function speedAt(time: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + SPEED_PER_SECOND * time);
}

/** Integral of the base (non-Nitro) speed over [0, t], in world units. */
export function baseDistanceUnits(t: number): number {
  const tc = (MAX_SPEED - BASE_SPEED) / SPEED_PER_SECOND;
  if (t <= tc) return BASE_SPEED * t + (SPEED_PER_SECOND * t * t) / 2;
  return BASE_SPEED * tc + (SPEED_PER_SECOND * tc * tc) / 2 + MAX_SPEED * (t - tc);
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function validateSubmission(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, reason: 'invalid_body' };
  const b = body as Record<string, unknown>;

  // Names are sanitised (never trusted); only non-strings and absurdly long input are rejected.
  if (typeof b.name !== 'string' || b.name.length > 64) return { ok: false, reason: 'invalid_name' };
  const name = sanitizeName(b.name);

  if (!isInt(b.score) || !isInt(b.coins) || !isInt(b.distance) || !isInt(b.nitroUses)) {
    return { ok: false, reason: 'invalid_number' };
  }
  if (!isNum(b.durationS) || !isNum(b.maxSpeed)) return { ok: false, reason: 'invalid_number' };
  const { score, coins, distance, nitroUses, durationS, maxSpeed } = b;
  if (score > MAX_SCORE) return { ok: false, reason: 'score_too_high' };

  if (durationS < MIN_DURATION_S || durationS > MAX_DURATION_S) return { ok: false, reason: 'duration_out_of_range' };

  const base = speedAt(durationS);

  // Nitro pickups: at most one wave can contain one, and waves are >= MIN_WAVE_INTERVAL apart.
  const maxWaves = Math.ceil(durationS / MIN_WAVE_INTERVAL) + 1;
  if (nitroUses > maxWaves) return { ok: false, reason: 'too_many_nitro' };
  if (coins > maxWaves * MAX_COINS_PER_WAVE) return { ok: false, reason: 'too_many_coins' };

  // Highest speed seen: at least the final base speed, at most doubled if Nitro was ever used.
  const speedCeiling = base * (nitroUses > 0 ? NITRO_SPEED_FACTOR : 1) * 1.01 + 1;
  if (maxSpeed > speedCeiling || maxSpeed < base * 0.99 - 1) return { ok: false, reason: 'max_speed_implausible' };

  // Distance = integral of speed / 10. Nitro only ever adds (extra speed <= current base speed for <= 3s per pickup).
  const baseUnits = baseDistanceUnits(durationS);
  const nitroSeconds = Math.min(nitroUses * NITRO_DURATION, durationS);
  const lower = (baseUnits / 10) * 0.98 - 2;
  const upper = ((baseUnits + nitroSeconds * (NITRO_SPEED_FACTOR - 1) * base) / 10) * 1.02 + 2;
  if (distance < lower) return { ok: false, reason: 'distance_too_low' };
  if (distance > upper) return { ok: false, reason: 'distance_too_high' };

  // score = sum(dy/100 * mult) + sum(10 * mult), mult <= MAX_MULTIPLIER, dy summed = distance * 10.
  const scoreCeiling = (0.1 * MAX_MULTIPLIER * distance + 10 * MAX_MULTIPLIER * coins) * 1.01 + 5;
  if (score > scoreCeiling) return { ok: false, reason: 'score_too_high' };

  return { ok: true, value: { name, score, coins, distance, durationS, maxSpeed, nitroUses } };
}
