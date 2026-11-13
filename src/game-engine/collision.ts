import { HITBOX_SCALE } from './constants';
import type { Entity } from './types';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Axis-aligned overlap of two center-anchored boxes. */
export function aabb(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
}

export function hitbox(e: Box, scale = HITBOX_SCALE): Box {
  return { x: e.x, y: e.y, w: e.w * scale, h: e.h * scale };
}

export function isHazard(e: Entity): boolean {
  return e.kind === 'danfo' || e.kind === 'keke' || e.kind === 'pothole';
}
