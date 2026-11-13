import { START_LIVES } from './constants';
import { laneCenter } from './lanes';
import type { GameState } from './types';

export function createInitialState(seed = Date.now() >>> 0): GameState {
  return {
    status: 'menu',
    time: 0,
    distance: 0,
    score: 0,
    coins: 0,
    multiplier: 1,
    speed: 0,
    lives: START_LIVES,
    targetLane: 1,
    playerX: laneCenter(1),
    shield: 0,
    nitro: 0,
    invuln: 0,
    shake: 0,
    spawnTimer: 0.6,
    nextId: 1,
    rng: seed | 0,
    maxSpeed: 0,
    nitroUses: 0,
    entities: [],
    particles: [],
    events: [],
  };
}

export function startGame(seed?: number): GameState {
  const s = createInitialState(seed);
  s.status = 'playing';
  s.speed = 240;
  s.maxSpeed = 240;
  return s;
}
