import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  type PongState,
  type LobbyState,
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

const defaultLobby: LobbyState = {
  queue: [],
  player1: null,
  player2: null,
  gameStatus: 'idle',
  winner: null,
};

const PongGame: React.FC<PongGameProps> = ({ socket, username, room }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lobby, setLobby] = useState<LobbyState>(defaultLobby);
  const [gameState, setGameState] = useState<PongState | null>(null);
  const heldKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleLobby = (state: LobbyState) => setLobby(state);
    const handleState = (state: PongState) => setGameState(state);
    const handleEnded = () => setGameState(null);

    socket.on('pong:lobby', handleLobby);
    socket.on('pong:state', handleState);
    socket.on('pong:ended', handleEnded);
    return () => {
      socket.off('pong:lobby', handleLobby);
      socket.off('pong:state', handleState);
      socket.off('pong:ended', handleEnded);
    };
  }, [socket]);

  // Draw on canvas whenever gameState changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!gameState) {
      ctx.fillStyle = '#444';
      ctx.font = '24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Waiting for match...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      return;
    }

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

  const isPlayer = lobby.player1 === username || lobby.player2 === username;
  const isInQueue = lobby.queue.includes(username);
  const queuePosition = lobby.queue.indexOf(username) + 1;
  const isGameActive = lobby.gameStatus === 'playing' || lobby.gameStatus === 'countdown';
  const canJoinQueue = !isInQueue && !(isPlayer && isGameActive);

  const handleJoinQueue = () => socket.emit('pong:queue', { room });
  const handleLeaveQueue = () => socket.emit('pong:dequeue', { room });

  // Continuous key tracking via keydown/keyup on the container
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isPlayer || lobby.gameStatus !== 'playing') return;
    const dir = e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : null;
    if (!dir) return;
    e.preventDefault();
    if (heldKeysRef.current.has(dir)) return;
    heldKeysRef.current.add(dir);
    socket.emit('pong:startMove', { room, direction: dir });
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const dir = e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : null;
    if (!dir) return;
    if (!heldKeysRef.current.has(dir)) return;
    heldKeysRef.current.delete(dir);
    socket.emit('pong:stopMove', { room, direction: dir });
  };

  return (
    <div
      data-testid="pong-container"
      className="pong-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <div className="pong-header">
        <h3>Pong</h3>
        {lobby.player1 && lobby.player2 && gameState && (
          <div className="pong-scores">
            <span className="pong-player">{lobby.player1}</span>
            <span data-testid="score1" className="pong-score">{gameState.score1}</span>
            <span className="pong-vs">-</span>
            <span data-testid="score2" className="pong-score">{gameState.score2}</span>
            <span className="pong-player">{lobby.player2}</span>
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

      {/* Status messages */}
      {lobby.gameStatus === 'countdown' && (
        <p className="pong-status">Get ready!</p>
      )}

      {lobby.gameStatus === 'playing' && !isPlayer && (
        <p className="pong-status">
          Spectating{isInQueue ? ` · You're #${queuePosition} in queue` : ''}
        </p>
      )}

      {lobby.gameStatus === 'finished' && lobby.winner && (
        <p className="pong-status">{lobby.winner} wins!</p>
      )}

      {/* Lobby panel */}
      <div data-testid="pong-lobby" className="pong-lobby">
        {canJoinQueue && (
          <button className="pong-start-btn" onClick={handleJoinQueue}>
            Join Queue
          </button>
        )}
        {isInQueue && (
          <button className="pong-start-btn pong-leave-btn" onClick={handleLeaveQueue}>
            Leave Queue (#{queuePosition})
          </button>
        )}
        {lobby.queue.length > 0 && (
          <div data-testid="pong-queue" className="pong-queue">
            <h4>Queue</h4>
            <ol>
              {lobby.queue.map((user) => (
                <li key={user} className={user === username ? 'pong-queue-you' : ''}>
                  {user}{user === username ? ' (You)' : ''}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default PongGame;
