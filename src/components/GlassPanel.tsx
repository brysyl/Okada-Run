import type { ReactNode } from 'react';

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}
