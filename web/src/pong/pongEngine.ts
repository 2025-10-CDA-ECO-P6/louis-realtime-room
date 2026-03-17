export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const PADDLE_HEIGHT = 80;
export const PADDLE_WIDTH = 10;
export const BALL_SIZE = 10;
export const BALL_SPEED = 4;
export const PADDLE_SPEED = 10;
export const WIN_SCORE = 5;

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface Paddle {
  x: number;
  y: number;
}

export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'finished';

export interface PongState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  score1: number;
  score2: number;
  status: GameStatus;
  countdown: number | null;
  player1: string | null;
  player2: string | null;
  winner: string | null;
}

export interface LobbyState {
  queue: string[];
  player1: string | null;
  player2: string | null;
  gameStatus: GameStatus | 'idle';
  winner: string | null;
}

export function createGameState(): PongState {
  return {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: BALL_SPEED,
      dy: BALL_SPEED,
    },
    paddle1: {
      x: 10,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    },
    paddle2: {
      x: CANVAS_WIDTH - 10 - PADDLE_WIDTH,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    },
    score1: 0,
    score2: 0,
    status: 'waiting',
    countdown: null,
    player1: null,
    player2: null,
    winner: null,
  };
}

export function updateBall(state: PongState): void {
  if (state.status !== 'playing') return;
  state.ball.x += state.ball.dx;
  state.ball.y += state.ball.dy;
}

export function checkCollisions(state: PongState): 'score1' | 'score2' | null {
  const { ball, paddle1, paddle2 } = state;

  // Top/bottom wall bounce
  if (ball.y <= 0) {
    ball.y = 0;
    ball.dy = Math.abs(ball.dy);
  }
  if (ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
    ball.y = CANVAS_HEIGHT - BALL_SIZE;
    ball.dy = -Math.abs(ball.dy);
  }

  // Paddle 1 collision (left paddle)
  if (
    ball.dx < 0 &&
    ball.x <= paddle1.x + PADDLE_WIDTH &&
    ball.x >= paddle1.x &&
    ball.y + BALL_SIZE >= paddle1.y &&
    ball.y <= paddle1.y + PADDLE_HEIGHT
  ) {
    ball.dx = Math.abs(ball.dx);
  }

  // Paddle 2 collision (right paddle)
  if (
    ball.dx > 0 &&
    ball.x + BALL_SIZE >= paddle2.x &&
    ball.x <= paddle2.x + PADDLE_WIDTH &&
    ball.y + BALL_SIZE >= paddle2.y &&
    ball.y <= paddle2.y + PADDLE_HEIGHT
  ) {
    ball.dx = -Math.abs(ball.dx);
  }

  // Score detection
  if (ball.x <= -BALL_SIZE) {
    return 'score2';
  }
  if (ball.x >= CANVAS_WIDTH + BALL_SIZE) {
    return 'score1';
  }

  return null;
}

export function movePaddle(state: PongState, player: 1 | 2, direction: 'up' | 'down'): void {
  const paddle = player === 1 ? state.paddle1 : state.paddle2;
  if (direction === 'up') {
    paddle.y = Math.max(0, paddle.y - PADDLE_SPEED);
  } else {
    paddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle.y + PADDLE_SPEED);
  }
}

export function resetBall(state: PongState): void {
  state.ball.x = CANVAS_WIDTH / 2;
  state.ball.y = CANVAS_HEIGHT / 2;
  state.ball.dx = Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED;
  state.ball.dy = Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED;
}
