import { useEffect, useRef } from 'react';

export interface KeyHandlers {
  onLeft: () => void;
  onRight: () => void;
  onConfirm?: () => void;
}

/** A/D and arrow keys steer; Enter/Space confirm. Ignores typing in inputs. */
export function useKeyboard(handlers: KeyHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      switch (ev.key) {
        case 'ArrowLeft': case 'a': case 'A':
          ev.preventDefault(); if (!ev.repeat) ref.current.onLeft(); break;
        case 'ArrowRight': case 'd': case 'D':
          ev.preventDefault(); if (!ev.repeat) ref.current.onRight(); break;
        case 'Enter': case ' ':
          if (ref.current.onConfirm && t?.tagName !== 'BUTTON') { ev.preventDefault(); ref.current.onConfirm(); }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
