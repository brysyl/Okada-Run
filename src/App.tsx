import { useRef } from 'react';
import { GameOver } from './components/GameOver';
import { Hud } from './components/Hud';
import { MainMenu } from './components/MainMenu';
import { useKeyboard } from './hooks/useKeyboard';
import { useOkadaGame } from './hooks/useOkadaGame';
import { useSwipe } from './hooks/useSwipe';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const game = useOkadaGame(canvasRef);

  useKeyboard({
    onLeft: game.left,
    onRight: game.right,
    onConfirm: () => { if (game.status === 'menu') game.start(); },
  });
  useSwipe(stageRef, game.left, game.right);

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950">
      <div
        ref={stageRef}
        className="relative h-full max-h-[100dvh] w-auto max-w-full touch-none select-none overflow-hidden"
        style={{ aspectRatio: '9 / 16' }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" aria-label="Okada Run game" />
        {game.status === 'playing' && <Hud hud={game.hud} muted={game.muted} onMute={game.toggleMute} />}
        {game.status === 'menu' && <MainMenu onStart={game.start} />}
        {game.status === 'gameover' && <GameOver result={game.result} onRestart={game.start} onMenu={game.toMenu} />}
      </div>
    </div>
  );
}
