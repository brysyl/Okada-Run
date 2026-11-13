import { LANES, LANE_W, ROAD_X, LANE_TWEEN_RATE } from './constants';

export function clampLane(lane: number): number {
  return Math.max(0, Math.min(LANES - 1, lane));
}

export function laneCenter(lane: number): number {
  return ROAD_X + LANE_W / 2 + lane * LANE_W;
}

/** Frame-rate independent exponential tween toward a target x. */
export function tweenX(current: number, target: number, dt: number): number {
  const next = current + (target - current) * (1 - Math.exp(-LANE_TWEEN_RATE * dt));
  return Math.abs(target - next) < 0.2 ? target : next;
}
