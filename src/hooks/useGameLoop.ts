import { useEffect, useRef } from 'react';

/** Runs `tick(dtSeconds)` on every animation frame while `active`. Cancels on cleanup. */
export function useGameLoop(tick: (dt: number) => void, active: boolean): void {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      tickRef.current(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
