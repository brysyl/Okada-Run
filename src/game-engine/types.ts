export type EntityKind = 'danfo' | 'keke' | 'pothole' | 'naira' | 'helmet' | 'nitro';
export type GameStatus = 'menu' | 'playing' | 'gameover';
export type GameEvent = 'coin' | 'crash' | 'pothole' | 'helmet' | 'nitro' | 'lane';

export interface Entity {
  id: number;
  kind: EntityKind;
  /** Center position in logical world units. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Keke Napep only: x the vehicle is steering toward. */
  targetX?: number;
  /** Keke Napep only: seconds until next lane decision. */
  decisionTimer?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameState {
  status: GameStatus;
  time: number;
  distance: number;
  score: number;
  coins: number;
  multiplier: number;
  speed: number;
  lives: number;
  targetLane: number;
  playerX: number;
  /** Seconds of Iron Helmet shield remaining. */
  shield: number;
  /** Seconds of Agbero Nitro remaining. */
  nitro: number;
  /** Seconds of post-hit invulnerability. */
  invuln: number;
  shake: number;
  spawnTimer: number;
  nextId: number;
  rng: number;
  entities: Entity[];
  particles: Particle[];
  events: GameEvent[];
}
