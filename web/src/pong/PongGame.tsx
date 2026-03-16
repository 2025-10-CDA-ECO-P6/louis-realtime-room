import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import {
  type PongState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_SIZE,
} from './pongEngine';

interface PongGameProps {
  socket: Socket;
  username: string;
  room: string;
}

const PongGame: React.FC<PongGameProps> = ({ socket, username, room }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<PongState | null>(null);
  const [joined, setJoined] = useState(false);

  // Listen for game state updates
  useEffect(() => {
    const handleState = (state: PongState) => {
      setGameState(state);
    };
    socket.on('pong:state', handleState);
    return () => {
      socket.off('pong:state', handleState);
    };
  }, [socket]);

  // Draw on canvas whenever gameState changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center line
    ctx.setLineDash([5, 10]);
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(gameState.paddle1.x, gameState.paddle1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = '#ff6688';
    ctx.fillRect(gameState.paddle2.x, gameState.paddle2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gameState.ball.x, gameState.ball.y, BALL_SIZE, BALL_SIZE);

    // Countdown overlay
    if (gameState.status === 'countdown' && gameState.countdown != null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(gameState.countdown), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gameState]);

  const handleJoin = () => {
    socket.emit('pong:join', { room });
    setJoined(true);
  };

  const handleRestart = () => {
    socket.emit('pong:restart', { room });
  };

  const isPlayer = gameState?.player1 === username || gameState?.player2 === username;
  const isSpectator = gameState && gameState.player1 && gameState.player2 && !isPlayer;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isPlayer || gameState?.status !== 'playing') return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        socket.emit('pong:move', { room, direction: 'up' });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        socket.emit('pong:move', { room, direction: 'down' });
      }
    },
    [socket, room, isPlayer, gameState?.status],
  );

  return (
    <div
      data-testid="pong-container"
      className="pong-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="pong-header">
        <h3>Pong</h3>
        {gameState && (
          <div className="pong-scores">
            <span className="pong-player">{gameState.player1 ?? '?'}</span>
            <span data-testid="score1" className="pong-score">{gameState.score1}</span>
            <span className="pong-vs">-</span>
            <span data-testid="score2" className="pong-score">{gameState.score2}</span>
            <span className="pong-player">{gameState.player2 ?? '?'}</span>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        data-testid="pong-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="pong-canvas"
      />

      {!joined && !gameState && (
        <button className="pong-start-btn" onClick={handleJoin}>
          Start Pong
        </button>
      )}

      {gameState?.status === 'waiting' && (
        <p className="pong-status">Waiting for opponent...</p>
      )}

      {gameState?.status === 'countdown' && (
        <p className="pong-status">Get ready!</p>
      )}

      {isSpectator && gameState?.status === 'playing' && (
        <p className="pong-status">Spectating</p>
      )}

      {gameState?.status === 'finished' && gameState.winner && (
        <div className="pong-finished">
          <p className="pong-status">{gameState.winner} wins!</p>
          {isPlayer && (
            <button className="pong-start-btn" onClick={handleRestart}>
              Restart
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PongGame;
