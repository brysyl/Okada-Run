import { LANES, LANE_W, PLAYER_H, PLAYER_W, PLAYER_Y, ROAD_X, WORLD_H, WORLD_W } from './constants';
import type { Entity, GameState } from './types';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawEntity(ctx: CanvasRenderingContext2D, e: Entity, t: number): void {
  const x = e.x - e.w / 2;
  const y = e.y - e.h / 2;
  switch (e.kind) {
    case 'danfo':
      ctx.fillStyle = '#ffc300';
      rr(ctx, x, y, e.w, e.h, 10); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillRect(x, e.y - 6, e.w, 12);
      ctx.fillStyle = '#9bd1ff';
      rr(ctx, x + 10, y + 8, e.w - 20, 26, 5); ctx.fill();
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(x + 8, y + e.h - 10, 22, 6);
      ctx.fillRect(x + e.w - 30, y + e.h - 10, 22, 6);
      break;
    case 'keke':
      ctx.fillStyle = '#2e9e4f';
      rr(ctx, x, y, e.w, e.h, 12); ctx.fill();
      ctx.fillStyle = '#f5f5f5';
      rr(ctx, x + 6, y + 6, e.w - 12, 26, 6); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillRect(x - 3, y + e.h - 20, 6, 16);
      ctx.fillRect(x + e.w - 3, y + e.h - 20, 6, 16);
      break;
    case 'pothole':
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.w / 2, e.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.stroke();
      break;
    case 'naira': {
      const wobble = Math.sin(t * 6 + e.id) * 2;
      ctx.fillStyle = '#2fbf71';
      rr(ctx, x, y + wobble, e.w, e.h, 3); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u20A6', e.x, e.y + wobble);
      break;
    }
    case 'helmet':
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath(); ctx.arc(e.x, e.y + 2, 15, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#1d3557'; ctx.fillRect(e.x - 15, e.y + 2, 30, 6);
      break;
    case 'nitro':
      ctx.fillStyle = '#ff7b00';
      rr(ctx, x + 4, y, e.w - 8, e.h, 6); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N', e.x, e.y);
      break;
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, s: GameState): void {
  if (s.invuln > 0 && Math.floor(s.time * 20) % 2 === 0) return;
  const x = s.playerX;
  const y = PLAYER_Y;
  if (s.nitro > 0) {
    ctx.fillStyle = 'rgba(255,123,0,0.8)';
    ctx.beginPath(); ctx.moveTo(x - 10, y + PLAYER_H / 2); ctx.lineTo(x, y + PLAYER_H / 2 + 40 + Math.random() * 20); ctx.lineTo(x + 10, y + PLAYER_H / 2); ctx.fill();
  }
  ctx.fillStyle = '#111';
  rr(ctx, x - 7, y - PLAYER_H / 2, 14, PLAYER_H, 6); ctx.fill();
  ctx.fillStyle = '#e63946';
  rr(ctx, x - PLAYER_W / 2 + 8, y - 18, PLAYER_W - 16, 38, 8); ctx.fill();
  ctx.fillStyle = '#ffb703';
  ctx.beginPath(); ctx.arc(x, y - 22, 9, 0, Math.PI * 2); ctx.fill();
  if (s.shield > 0) {
    ctx.strokeStyle = `rgba(76,201,240,${0.5 + 0.3 * Math.sin(s.time * 10)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2); ctx.stroke();
  }
}

/** Draw the full frame in logical (WORLD_W x WORLD_H) coordinates. */
export function render(ctx: CanvasRenderingContext2D, s: GameState): void {
  ctx.save();
  if (s.shake > 0) ctx.translate((Math.random() - 0.5) * 16 * s.shake, (Math.random() - 0.5) * 16 * s.shake);
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  ctx.fillStyle = '#2b2d33';
  ctx.fillRect(ROAD_X, -20, LANES * LANE_W, WORLD_H + 40);
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(ROAD_X - 4, -20, 4, WORLD_H + 40);
  ctx.fillRect(ROAD_X + LANES * LANE_W, -20, 4, WORLD_H + 40);
  const offset = (s.distance * 10) % 60;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 1; i < LANES; i++) {
    for (let y = -60 + offset; y < WORLD_H; y += 60) ctx.fillRect(ROAD_X + i * LANE_W - 2, y, 4, 30);
  }
  for (const e of s.entities) drawEntity(ctx, e, s.time);
  drawPlayer(ctx, s);
  for (const p of s.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  if (s.nitro > 0) {
    ctx.fillStyle = 'rgba(255,123,0,0.12)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  ctx.restore();
}
