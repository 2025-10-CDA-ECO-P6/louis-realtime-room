import { describe, it, expect, vi, beforeEach } from 'vitest';
const {
  createGameState,
  updateBall,
  checkCollisions,
  movePaddle,
  resetBall,
  WIN_SCORE,
  BALL_SPEED,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT,
} = require('../pongEngine.js');

describe('Backend Pong Engine', () => {
  it('should create a game state', () => {
    const state = createGameState();
    expect(state.status).toBe('waiting');
    expect(state.score1).toBe(0);
    expect(state.score2).toBe(0);
    expect(state.player1).toBeNull();
    expect(state.player2).toBeNull();
  });

  it('should update ball position when playing', () => {
    const state = createGameState();
    state.status = 'playing';
    const oldX = state.ball.x;
    updateBall(state);
    expect(state.ball.x).not.toBe(oldX);
  });

  it('should not update ball position when waiting', () => {
    const state = createGameState();
    const oldX = state.ball.x;
    updateBall(state);
    expect(state.ball.x).toBe(oldX);
  });

  it('should detect score when ball goes past left wall', () => {
    const state = createGameState();
    state.ball.x = -20;
    const result = checkCollisions(state);
    expect(result).toBe('score2');
  });

  it('should detect score when ball goes past right wall', () => {
    const state = createGameState();
    state.ball.x = CANVAS_WIDTH + 20;
    const result = checkCollisions(state);
    expect(result).toBe('score1');
  });

  it('should move paddle within bounds', () => {
    const state = createGameState();
    movePaddle(state, 1, 'up');
    expect(state.paddle1.y).toBeLessThan(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  });

  it('should not move paddle above top', () => {
    const state = createGameState();
    state.paddle1.y = 0;
    movePaddle(state, 1, 'up');
    expect(state.paddle1.y).toBe(0);
  });

  it('should reset ball to center', () => {
    const state = createGameState();
    state.ball.x = 100;
    state.ball.y = 50;
    resetBall(state);
    expect(state.ball.x).toBe(CANVAS_WIDTH / 2);
    expect(state.ball.y).toBe(CANVAS_HEIGHT / 2);
  });
});

describe('Backend Pong Game Manager', () => {
  const { PongGameManager } = require('../pongHandler.js');

  let manager;

  beforeEach(() => {
    manager = new PongGameManager();
  });

  it('should create a game for a room when first player joins', () => {
    const state = manager.joinGame('room1', 'alice');
    expect(state.player1).toBe('alice');
    expect(state.player2).toBeNull();
    expect(state.status).toBe('waiting');
  });

  it('should add second player and start countdown', () => {
    manager.joinGame('room1', 'alice');
    const state = manager.joinGame('room1', 'bob');
    expect(state.player1).toBe('alice');
    expect(state.player2).toBe('bob');
    expect(state.status).toBe('countdown');
    expect(state.countdown).toBe(3);
  });

  it('should not add more than 2 players', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.joinGame('room1', 'charlie');
    // charlie should not be added as a player
    expect(state.player1).toBe('alice');
    expect(state.player2).toBe('bob');
  });

  it('should not let same player join twice', () => {
    manager.joinGame('room1', 'alice');
    const state = manager.joinGame('room1', 'alice');
    expect(state.player2).toBeNull();
  });

  it('should handle player move', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    const oldY = state.paddle1.y;
    manager.handleMove('room1', 'alice', 'up');
    expect(state.paddle1.y).toBeLessThan(oldY);
  });

  it('should move paddle2 for player2', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    const oldY = state.paddle2.y;
    manager.handleMove('room1', 'bob', 'down');
    expect(state.paddle2.y).toBeGreaterThan(oldY);
  });

  it('should set player direction for continuous movement', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    manager.setPlayerDirection('room1', 'alice', 'up');
    const oldY = state.paddle1.y;
    manager.tick('room1');
    expect(state.paddle1.y).toBeLessThan(oldY);
  });

  it('should clear player direction', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    manager.setPlayerDirection('room1', 'alice', 'up');
    manager.clearPlayerDirection('room1', 'alice', 'up');
    const oldY = state.paddle1.y;
    // Ball will move but paddle should not
    const ballX = state.ball.x;
    manager.tick('room1');
    expect(state.paddle1.y).toBe(oldY);
    expect(state.ball.x).not.toBe(ballX);
  });

  it('should not clear direction if it does not match', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    manager.setPlayerDirection('room1', 'alice', 'up');
    manager.clearPlayerDirection('room1', 'alice', 'down'); // wrong direction
    const oldY = state.paddle1.y;
    manager.tick('room1');
    expect(state.paddle1.y).toBeLessThan(oldY); // still moves up
  });

  it('should return game state for a room', () => {
    manager.joinGame('room1', 'alice');
    const state = manager.getGame('room1');
    expect(state).toBeDefined();
    expect(state.player1).toBe('alice');
  });

  it('should handle game tick and update ball', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    const oldX = state.ball.x;
    manager.tick('room1');
    expect(state.ball.x).not.toBe(oldX);
  });

  it('should increment score and reset ball on scoring', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    state.ball.x = -20;
    manager.tick('room1');
    expect(state.score2).toBe(1);
    expect(state.ball.x).toBe(CANVAS_WIDTH / 2);
  });

  it('should finish game when a player reaches WIN_SCORE', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'playing';
    state.score1 = WIN_SCORE - 1;
    state.ball.x = CANVAS_WIDTH + 20;
    manager.tick('room1');
    expect(state.score1).toBe(WIN_SCORE);
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('alice');
  });

  it('should restart game with countdown', () => {
    manager.joinGame('room1', 'alice');
    manager.joinGame('room1', 'bob');
    const state = manager.getGame('room1');
    state.status = 'finished';
    state.score1 = 5;
    state.score2 = 3;
    state.winner = 'alice';

    const ticks = [];
    manager.restartGame(
      'room1',
      (s) => ticks.push({ ...s }),
      () => {},
    );

    expect(state.score1).toBe(0);
    expect(state.score2).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.status).toBe('countdown');
    expect(state.countdown).toBe(3);

    // Clean up timer
    manager.removeGame('room1');
  });

  it('should remove game on cleanup', () => {
    manager.joinGame('room1', 'alice');
    manager.removeGame('room1');
    expect(manager.getGame('room1')).toBeUndefined();
  });
});
