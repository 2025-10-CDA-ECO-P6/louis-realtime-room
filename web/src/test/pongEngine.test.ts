import { describe, it, expect } from 'vitest';
import {
  createGameState,
  updateBall,
  movePaddle,
  checkCollisions,
  resetBall,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  BALL_SIZE,
  BALL_SPEED,
  PADDLE_SPEED,
} from '../pong/pongEngine';

describe('Pong Game Engine', () => {
  describe('createGameState', () => {
    it('should create initial game state with centered ball', () => {
      const state = createGameState();
      expect(state.ball.x).toBe(CANVAS_WIDTH / 2);
      expect(state.ball.y).toBe(CANVAS_HEIGHT / 2);
    });

    it('should create initial game state with paddles at correct positions', () => {
      const state = createGameState();
      // Left paddle near left wall
      expect(state.paddle1.x).toBe(10);
      expect(state.paddle1.y).toBe(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
      // Right paddle near right wall
      expect(state.paddle2.x).toBe(CANVAS_WIDTH - 10 - PADDLE_WIDTH);
      expect(state.paddle2.y).toBe(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    });

    it('should initialize scores to 0', () => {
      const state = createGameState();
      expect(state.score1).toBe(0);
      expect(state.score2).toBe(0);
    });

    it('should set status to waiting', () => {
      const state = createGameState();
      expect(state.status).toBe('waiting');
    });

    it('should have ball velocity', () => {
      const state = createGameState();
      expect(state.ball.dx).not.toBe(0);
      expect(state.ball.dy).not.toBe(0);
    });
  });

  describe('updateBall', () => {
    it('should move ball according to its velocity', () => {
      const state = createGameState();
      state.status = 'playing';
      const oldX = state.ball.x;
      const oldY = state.ball.y;
      const dx = state.ball.dx;
      const dy = state.ball.dy;
      updateBall(state);
      expect(state.ball.x).toBe(oldX + dx);
      expect(state.ball.y).toBe(oldY + dy);
    });

    it('should not move ball when game is not playing', () => {
      const state = createGameState();
      state.status = 'waiting';
      const oldX = state.ball.x;
      const oldY = state.ball.y;
      updateBall(state);
      expect(state.ball.x).toBe(oldX);
      expect(state.ball.y).toBe(oldY);
    });
  });

  describe('checkCollisions', () => {
    it('should bounce ball off top wall', () => {
      const state = createGameState();
      state.status = 'playing';
      state.ball.y = 0;
      state.ball.dy = -BALL_SPEED;
      checkCollisions(state);
      expect(state.ball.dy).toBe(BALL_SPEED);
    });

    it('should bounce ball off bottom wall', () => {
      const state = createGameState();
      state.status = 'playing';
      state.ball.y = CANVAS_HEIGHT - BALL_SIZE;
      state.ball.dy = BALL_SPEED;
      checkCollisions(state);
      expect(state.ball.dy).toBe(-BALL_SPEED);
    });

    it('should bounce ball off paddle1', () => {
      const state = createGameState();
      state.status = 'playing';
      // Position ball at paddle1
      state.ball.x = state.paddle1.x + PADDLE_WIDTH;
      state.ball.y = state.paddle1.y + PADDLE_HEIGHT / 2;
      state.ball.dx = -BALL_SPEED;
      checkCollisions(state);
      expect(state.ball.dx).toBeGreaterThan(0);
    });

    it('should bounce ball off paddle2', () => {
      const state = createGameState();
      state.status = 'playing';
      // Position ball at paddle2
      state.ball.x = state.paddle2.x - BALL_SIZE;
      state.ball.y = state.paddle2.y + PADDLE_HEIGHT / 2;
      state.ball.dx = BALL_SPEED;
      checkCollisions(state);
      expect(state.ball.dx).toBeLessThan(0);
    });

    it('should score for player 2 when ball passes left wall', () => {
      const state = createGameState();
      state.status = 'playing';
      state.ball.x = -BALL_SIZE;
      const result = checkCollisions(state);
      expect(result).toBe('score2');
    });

    it('should score for player 1 when ball passes right wall', () => {
      const state = createGameState();
      state.status = 'playing';
      state.ball.x = CANVAS_WIDTH + BALL_SIZE;
      const result = checkCollisions(state);
      expect(result).toBe('score1');
    });
  });

  describe('movePaddle', () => {
    it('should move paddle up', () => {
      const state = createGameState();
      const oldY = state.paddle1.y;
      movePaddle(state, 1, 'up');
      expect(state.paddle1.y).toBe(oldY - PADDLE_SPEED);
    });

    it('should move paddle down', () => {
      const state = createGameState();
      const oldY = state.paddle1.y;
      movePaddle(state, 1, 'down');
      expect(state.paddle1.y).toBe(oldY + PADDLE_SPEED);
    });

    it('should not move paddle above top wall', () => {
      const state = createGameState();
      state.paddle1.y = 0;
      movePaddle(state, 1, 'up');
      expect(state.paddle1.y).toBe(0);
    });

    it('should not move paddle below bottom wall', () => {
      const state = createGameState();
      state.paddle1.y = CANVAS_HEIGHT - PADDLE_HEIGHT;
      movePaddle(state, 1, 'down');
      expect(state.paddle1.y).toBe(CANVAS_HEIGHT - PADDLE_HEIGHT);
    });

    it('should move paddle 2 independently', () => {
      const state = createGameState();
      const oldY = state.paddle2.y;
      movePaddle(state, 2, 'up');
      expect(state.paddle2.y).toBe(oldY - PADDLE_SPEED);
    });
  });

  describe('resetBall', () => {
    it('should center the ball', () => {
      const state = createGameState();
      state.ball.x = 100;
      state.ball.y = 50;
      resetBall(state);
      expect(state.ball.x).toBe(CANVAS_WIDTH / 2);
      expect(state.ball.y).toBe(CANVAS_HEIGHT / 2);
    });

    it('should reset ball velocity', () => {
      const state = createGameState();
      state.ball.dx = 0;
      state.ball.dy = 0;
      resetBall(state);
      expect(Math.abs(state.ball.dx)).toBe(BALL_SPEED);
      expect(Math.abs(state.ball.dy)).toBe(BALL_SPEED);
    });
  });
});
