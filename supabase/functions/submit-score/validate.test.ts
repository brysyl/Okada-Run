import { describe, expect, it } from 'vitest';
import * as C from '../../../src/game-engine/constants';
import { startGame } from '../../../src/game-engine/state';
import { displayScore, moveLane, update } from '../../../src/game-engine/update';
import { spawnInterval } from '../../../src/game-engine/spawner';
import * as V from './validate';

/** Plays the real engine with a naive bot that dodges by lane hopping until it dies or time runs out. */
function simulate(seed: number, maxSeconds: number, invincible = false) {
  const s = startGame(seed);
  for (let i = 0; i < maxSeconds * 60 && s.status === 'playing'; i++) {
    if (i % 25 === 0) moveLane(s, i % 50 === 0 ? 1 : -1);
    update(s, 1 / 60);
    s.events.length = 0;
    if (invincible) { s.lives = 3; s.status = 'playing'; }
  }
  return {
    name: 'Tunde', score: displayScore(s), coins: s.coins, distance: Math.floor(s.distance),
    durationS: Math.round(s.time * 1000) / 1000, maxSpeed: Math.round(s.maxSpeed * 100) / 100, nitroUses: s.nitroUses,
  };
}

const reason = (b: unknown) => { const r = V.validateSubmission(b); return r.ok ? 'ok' : r.reason; };

describe('constants stay in sync with the engine', () => {
  it('matches', () => {
    expect(V.BASE_SPEED).toBe(C.BASE_SPEED);
    expect(V.SPEED_PER_SECOND).toBe(C.SPEED_PER_SECOND);
    expect(V.MAX_SPEED).toBe(C.MAX_SPEED);
    expect(V.NITRO_DURATION).toBe(C.NITRO_DURATION);
    expect(V.NITRO_SPEED_FACTOR).toBe(C.NITRO_SPEED_FACTOR);
    expect(V.MAX_MULTIPLIER).toBe(C.MAX_MULTIPLIER);
    expect(V.MIN_WAVE_INTERVAL).toBe(spawnInterval(1e9));
  });
});

describe('validateSubmission accepts genuine engine runs', () => {
  it('accepts many seeds, short and long', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const run = simulate(seed, 20);
      expect(reason(run), `seed ${seed} ${JSON.stringify(run)}`).toBe('ok');
    }
  });

  it('accepts long runs that reach max speed (with nitro and coins when they occur)', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const run = simulate(seed, 180, true);
      expect(run.durationS).toBeGreaterThan(100);
      expect(reason(run), `seed ${seed} ${JSON.stringify(run)}`).toBe('ok');
    }
  });

  it('sanitises the stored name', () => {
    const r = V.validateSubmission({ ...simulate(3, 10), name: '<b>Tunde</b>!!' });
    expect(r.ok && r.value.name).toBe('bTundeb');
  });
});

describe('validateSubmission rejects tampered payloads', () => {
  const good = simulate(7, 30, true);

  it('rejects inflated score', () => {
    expect(reason({ ...good, score: good.score * 10 + 5000 })).toBe('score_too_high');
    expect(reason({ ...good, score: 10_000_001 })).toBe('score_too_high');
  });
  it('rejects impossible speed', () => {
    expect(reason({ ...good, maxSpeed: 5000 })).toBe('max_speed_implausible');
    expect(reason({ ...good, maxSpeed: 1 })).toBe('max_speed_implausible');
    expect(reason({ ...good, nitroUses: 0, maxSpeed: 2 * good.maxSpeed })).toBe('max_speed_implausible');
  });
  it('rejects too-short duration with huge distance', () => {
    expect(reason({ ...good, durationS: 2, maxSpeed: 252, nitroUses: 0, coins: 0, distance: 5000 })).toBe('distance_too_high');
    expect(reason({ ...good, durationS: 0.2 })).toBe('duration_out_of_range');
    expect(reason({ ...good, durationS: 99999 })).toBe('duration_out_of_range');
  });
  it('rejects distance far below what the duration implies', () => {
    expect(reason({ ...good, distance: 1 })).toBe('distance_too_low');
  });
  it('rejects too many coins', () => {
    expect(reason({ ...good, coins: 100000 })).toBe('too_many_coins');
  });
  it('rejects too many nitro pickups', () => {
    expect(reason({ ...good, nitroUses: 500 })).toBe('too_many_nitro');
  });
  it('rejects bad names', () => {
    expect(reason({ ...good, name: 42 })).toBe('invalid_name');
    expect(reason({ ...good, name: 'x'.repeat(65) })).toBe('invalid_name');
  });
  it('rejects non-integers, negatives, NaN and bad bodies', () => {
    expect(reason({ ...good, score: 10.5 })).toBe('invalid_number');
    expect(reason({ ...good, coins: -1 })).toBe('invalid_number');
    expect(reason({ ...good, distance: '100' })).toBe('invalid_number');
    expect(reason({ ...good, durationS: NaN })).toBe('invalid_number');
    expect(reason({ ...good, maxSpeed: undefined })).toBe('invalid_number');
    expect(reason(null)).toBe('invalid_body');
    expect(reason([])).toBe('invalid_body');
    expect(reason('x')).toBe('invalid_body');
  });
});
