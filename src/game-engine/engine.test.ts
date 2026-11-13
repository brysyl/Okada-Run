import { describe, expect, it } from 'vitest';
import { aabb } from './collision';
import { LANES, NITRO_DURATION, PLAYER_Y, SIZES, START_LIVES } from './constants';
import { clampLane, laneCenter, tweenX } from './lanes';
import { spawnWave } from './spawner';
import { startGame } from './state';
import { moveLane, multiplierFor, speedAt, update } from './update';
import type { Entity, EntityKind, GameState } from './types';

function put(s: GameState, kind: EntityKind, x: number, y = PLAYER_Y): Entity {
  const e: Entity = { id: s.nextId++, kind, x, y, ...SIZES[kind] };
  s.entities.push(e);
  return e;
}

describe('lanes', () => {
  it('clamps and centers lanes', () => {
    expect(clampLane(-3)).toBe(0);
    expect(clampLane(9)).toBe(LANES - 1);
    expect(laneCenter(1)).toBe(180);
  });
  it('tweens smoothly then snaps', () => {
    const a = tweenX(80, 180, 0.016);
    expect(a).toBeGreaterThan(80);
    expect(a).toBeLessThan(180);
    expect(tweenX(80, 180, 5)).toBe(180);
  });
  it('moveLane switches lane and stays in bounds', () => {
    const s = startGame(1);
    moveLane(s, -1);
    moveLane(s, -1);
    expect(s.targetLane).toBe(0);
    moveLane(s, 1);
    expect(s.targetLane).toBe(1);
  });
});

describe('collision', () => {
  it('detects AABB overlap', () => {
    expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 10, h: 10 })).toBe(true);
    expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 11, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('progression', () => {
  it('speed increases and is capped', () => {
    expect(speedAt(10)).toBeGreaterThan(speedAt(0));
    expect(speedAt(1e6)).toBeLessThanOrEqual(640);
  });
  it('multiplier scales with coins and caps', () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(5)).toBe(2);
    expect(multiplierFor(500)).toBe(5);
  });
});

describe('spawner', () => {
  it('danfo spans two lanes and leaves a free lane', () => {
    for (let seed = 1; seed < 300; seed++) {
      const s = startGame(seed);
      spawnWave(s);
      for (const e of s.entities.filter((x) => x.kind === 'danfo')) {
        const left = laneCenter(0), mid = laneCenter(1), right = laneCenter(2);
        expect([(left + mid) / 2, (mid + right) / 2]).toContain(e.x);
        expect(e.w).toBeGreaterThan(150);
      }
    }
  });
  it('produces every kind across seeds', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed < 500; seed++) {
      const s = startGame(seed);
      spawnWave(s);
      s.entities.forEach((e) => kinds.add(e.kind));
    }
    expect([...kinds].sort()).toEqual(['danfo', 'helmet', 'keke', 'naira', 'nitro', 'pothole']);
  });
  it('is deterministic for a seed', () => {
    const a = startGame(42), b = startGame(42);
    for (let i = 0; i < 10; i++) { spawnWave(a); spawnWave(b); }
    expect(a.entities).toEqual(b.entities);
  });
});

describe('update', () => {
  it('collecting naira raises score, coins and emits particles', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    put(s, 'naira', s.playerX);
    update(s, 0.016);
    expect(s.coins).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(10);
    expect(s.particles.length).toBeGreaterThan(0);
    expect(s.events).toContain('coin');
  });
  it('vehicle hit ends the run with shake', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    put(s, 'keke', s.playerX);
    update(s, 0.016);
    expect(s.status).toBe('gameover');
    expect(s.shake).toBeGreaterThan(0);
  });
  it('pothole costs a life, then grants brief invulnerability', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    put(s, 'pothole', s.playerX);
    update(s, 0.016);
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.status).toBe('playing');
    put(s, 'pothole', s.playerX);
    update(s, 0.016);
    expect(s.lives).toBe(START_LIVES - 1);
  });
  it('pothole ends run at zero lives', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    s.lives = 1;
    put(s, 'pothole', s.playerX);
    update(s, 0.016);
    expect(s.status).toBe('gameover');
  });
  it('helmet shields potholes but not vehicles', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    put(s, 'helmet', s.playerX);
    update(s, 0.016);
    expect(s.shield).toBeGreaterThan(0);
    put(s, 'pothole', s.playerX);
    update(s, 0.016);
    expect(s.lives).toBe(START_LIVES);
    put(s, 'danfo', s.playerX);
    update(s, 0.016);
    expect(s.status).toBe('gameover');
  });
  it('nitro clears obstacles, protects for 3s, then expires', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    put(s, 'danfo', 180, 100);
    put(s, 'nitro', s.playerX);
    update(s, 0.016);
    expect(s.entities.some((e) => e.kind === 'danfo')).toBe(false);
    expect(s.nitro).toBeGreaterThan(NITRO_DURATION - 0.1);
    put(s, 'danfo', s.playerX);
    update(s, 0.016);
    expect(s.status).toBe('playing');
    s.spawnTimer = 99;
    for (let i = 0; i < 200; i++) { s.spawnTimer = 99; s.entities = []; update(s, 0.016); }
    expect(s.nitro).toBe(0);
  });
  it('removes offscreen entities and accrues distance', () => {
    const s = startGame(1);
    s.spawnTimer = 99;
    put(s, 'pothole', 50, 790);
    update(s, 0.05);
    expect(s.entities.length).toBe(0);
    expect(s.distance).toBeGreaterThan(0);
  });
});
