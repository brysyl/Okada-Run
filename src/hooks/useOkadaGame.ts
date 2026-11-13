import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { WORLD_H, WORLD_W } from '../game-engine/constants';
import { render } from '../game-engine/renderer';
import { createInitialState, startGame } from '../game-engine/state';
import { displayScore, moveLane, update } from '../game-engine/update';
import type { GameStatus } from '../game-engine/types';
import { useGameLoop } from './useGameLoop';

export interface Hud {
  score: number;
  coins: number;
  multiplier: number;
  lives: number;
  shield: number;
  nitro: number;
  distance: number;
}

export interface RunResult {
  score: number;
  coins: number;
  distance: number;
  /** Game-time seconds survived (client-reported, used by server plausibility checks). */
  durationS: number;
  maxSpeed: number;
  nitroUses: number;
}

const EMPTY_HUD: Hud = { score: 0, coins: 0, multiplier: 1, lives: 3, shield: 0, nitro: 0, distance: 0 };

export function useOkadaGame(canvasRef: RefObject<HTMLCanvasElement>) {
  const stateRef = useRef(createInitialState());
  const audioRef = useRef<AudioEngine | null>(null);
  const hudClock = useRef(0);
  const [status, setStatus] = useState<GameStatus>('menu');
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [result, setResult] = useState<RunResult>({ score: 0, coins: 0, distance: 0, durationS: 0, maxSpeed: 0, nitroUses: 0 });
  const [muted, setMuted] = useState(false);

  if (!audioRef.current) audioRef.current = new AudioEngine();

  // Size the backing store once for crisp rendering on high-DPI screens.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = WORLD_W * dpr;
    c.height = WORLD_H * dpr;
  }, [canvasRef]);

  // Release audio resources on unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.dispose();
  }, []);

  const tick = useCallback((dt: number) => {
    const s = stateRef.current;
    const audio = audioRef.current!;
    const wasPlaying = s.status === 'playing';
    update(s, dt);

    for (const ev of s.events) {
      switch (ev) {
        case 'coin': audio.coin(); break;
        case 'crash': audio.crash(); break;
        case 'pothole': audio.pothole(); break;
        case 'helmet': audio.helmet(); break;
        case 'nitro': audio.nitro(); break;
        case 'lane': audio.lane(); break;
      }
    }
    s.events.length = 0;
    if (s.status === 'playing') audio.setEngineSpeed(s.speed);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const scale = (canvasRef.current as HTMLCanvasElement).width / WORLD_W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      render(ctx, s);
    }

    hudClock.current += dt;
    if (wasPlaying && s.status === 'gameover') {
      audio.stopEngine();
      const r: RunResult = {
        score: displayScore(s), coins: s.coins, distance: Math.floor(s.distance),
        durationS: Math.round(s.time * 1000) / 1000, maxSpeed: Math.round(s.maxSpeed * 100) / 100, nitroUses: s.nitroUses,
      };
      setResult(r);
      setHud({ ...EMPTY_HUD, score: r.score, coins: r.coins, distance: r.distance, multiplier: s.multiplier, lives: 0 });
      setStatus('gameover');
    } else if (s.status === 'playing' && hudClock.current > 0.1) {
      hudClock.current = 0;
      setHud({
        score: displayScore(s), coins: s.coins, multiplier: s.multiplier, lives: s.lives,
        shield: s.shield, nitro: s.nitro, distance: Math.floor(s.distance),
      });
    }
  }, [canvasRef]);

  useGameLoop(tick, true);

  const start = useCallback(() => {
    const audio = audioRef.current!;
    audio.unlock();
    audio.stopEngine();
    stateRef.current = startGame();
    setHud(EMPTY_HUD);
    setStatus('playing');
    audio.startEngine();
  }, []);

  const left = useCallback(() => moveLane(stateRef.current, -1), []);
  const right = useCallback(() => moveLane(stateRef.current, 1), []);
  const toggleMute = useCallback(() => {
    setMuted((m) => { audioRef.current?.setMuted(!m); return !m; });
  }, []);
  const toMenu = useCallback(() => {
    stateRef.current = createInitialState();
    setStatus('menu');
  }, []);

  return { status, hud, result, muted, start, left, right, toggleMute, toMenu };
}
