export const WORLD_W = 360;
export const WORLD_H = 640;
export const LANES = 3;
export const ROAD_X = 30;
export const LANE_W = 100;
export const PLAYER_Y = 530;
export const PLAYER_W = 44;
export const PLAYER_H = 78;
/** Fraction of the sprite used as hitbox, per kind. */
export const HITBOX_SCALE = 0.8;

export const BASE_SPEED = 240;
export const SPEED_PER_SECOND = 6;
export const MAX_SPEED = 640;
export const NITRO_DURATION = 3;
export const NITRO_SPEED_FACTOR = 2;
export const SHIELD_DURATION = 8;
export const INVULN_DURATION = 1.2;
export const START_LIVES = 3;
export const MAX_MULTIPLIER = 5;
export const COINS_PER_MULTIPLIER = 5;
export const LANE_TWEEN_RATE = 20;
export const SPAWN_Y = -140;
export const DESPAWN_Y = WORLD_H + 160;

export const SIZES = {
  danfo: { w: 190, h: 130 },
  keke: { w: 52, h: 72 },
  pothole: { w: 62, h: 40 },
  naira: { w: 30, h: 22 },
  helmet: { w: 32, h: 32 },
  nitro: { w: 32, h: 36 },
} as const;
