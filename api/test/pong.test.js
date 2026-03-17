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

  // Queue management
  it('should add user to queue', () => {
    manager.joinQueue('room1', 'alice');
    const lobby = manager.getLobby('room1');
    expect(lobby.queue).toEqual(['alice']);
    expect(lobby.gameStatus).toBe('idle');
  });

  it('should not add same user to queue twice', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'alice');
    expect(manager.getLobby('room1').queue).toEqual(['alice']);
  });

  it('should remove user from queue', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.leaveQueue('room1', 'alice');
    expect(manager.getLobby('room1').queue).toEqual(['bob']);
  });

  it('should preserve queue order', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.joinQueue('room1', 'charlie');
    expect(manager.getLobby('room1').queue).toEqual(['alice', 'bob', 'charlie']);
  });

  // Match starting
  it('should start match when 2 in queue and no active game', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    const started = manager.tryStartMatch('room1');
    expect(started).toBe(true);
    const game = manager.getGame('room1');
    expect(game.player1).toBe('alice');
    expect(game.player2).toBe('bob');
    expect(game.status).toBe('countdown');
    expect(manager.getLobby('room1').queue).toEqual([]);
  });

  it('should not start match with fewer than 2 in queue', () => {
    manager.joinQueue('room1', 'alice');
    expect(manager.tryStartMatch('room1')).toBe(false);
  });

  it('should not start match if game is in progress', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    manager.getGame('room1').status = 'playing';
    manager.joinQueue('room1', 'charlie');
    manager.joinQueue('room1', 'dave');
    expect(manager.tryStartMatch('room1')).toBe(false);
  });

  it('should not let active player join queue', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    manager.joinQueue('room1', 'alice');
    expect(manager.getLobby('room1').queue).toEqual([]);
  });

  it('should let player of finished game join queue', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    manager.getGame('room1').status = 'finished';
    manager.joinQueue('room1', 'alice');
    expect(manager.getLobby('room1').queue).toEqual(['alice']);
  });

  it('should start next match after game finishes', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.joinQueue('room1', 'charlie');
    manager.joinQueue('room1', 'dave');
    manager.tryStartMatch('room1');
    manager.getGame('room1').status = 'finished';
    manager.getGame('room1').winner = 'alice';
    const started = manager.tryStartMatch('room1');
    expect(started).toBe(true);
    const lobby = manager.getLobby('room1');
    expect(lobby.player1).toBe('charlie');
    expect(lobby.player2).toBe('dave');
  });

  // Lobby state
  it('should return idle lobby for empty room', () => {
    const lobby = manager.getLobby('room1');
    expect(lobby.queue).toEqual([]);
    expect(lobby.player1).toBeNull();
    expect(lobby.gameStatus).toBe('idle');
  });

  it('should return correct lobby during game', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    manager.getGame('room1').status = 'playing';
    const lobby = manager.getLobby('room1');
    expect(lobby.player1).toBe('alice');
    expect(lobby.player2).toBe('bob');
    expect(lobby.gameStatus).toBe('playing');
  });

  // Game mechanics
  it('should handle player move', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    const oldY = state.paddle1.y;
    manager.handleMove('room1', 'alice', 'up');
    expect(state.paddle1.y).toBeLessThan(oldY);
  });

  it('should move paddle2 for player2', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    const oldY = state.paddle2.y;
    manager.handleMove('room1', 'bob', 'down');
    expect(state.paddle2.y).toBeGreaterThan(oldY);
  });

  it('should set player direction for continuous movement', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    manager.setPlayerDirection('room1', 'alice', 'up');
    const oldY = state.paddle1.y;
    manager.tick('room1');
    expect(state.paddle1.y).toBeLessThan(oldY);
  });

  it('should clear player direction', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    manager.setPlayerDirection('room1', 'alice', 'up');
    manager.clearPlayerDirection('room1', 'alice', 'up');
    const oldY = state.paddle1.y;
    const ballX = state.ball.x;
    manager.tick('room1');
    expect(state.paddle1.y).toBe(oldY);
    expect(state.ball.x).not.toBe(ballX);
  });

  it('should not clear direction if it does not match', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    manager.setPlayerDirection('room1', 'alice', 'up');
    manager.clearPlayerDirection('room1', 'alice', 'down');
    const oldY = state.paddle1.y;
    manager.tick('room1');
    expect(state.paddle1.y).toBeLessThan(oldY);
  });

  it('should return game state for a room', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    expect(manager.getGame('room1')).toBeDefined();
    expect(manager.getGame('room1').player1).toBe('alice');
  });

  it('should handle game tick and update ball', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    const oldX = state.ball.x;
    manager.tick('room1');
    expect(state.ball.x).not.toBe(oldX);
  });

  it('should increment score and reset ball on scoring', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    state.ball.x = -20;
    manager.tick('room1');
    expect(state.score2).toBe(1);
    expect(state.ball.x).toBe(CANVAS_WIDTH / 2);
  });

  it('should finish game when a player reaches WIN_SCORE', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    const state = manager.getGame('room1');
    state.status = 'playing';
    state.score1 = WIN_SCORE - 1;
    state.ball.x = CANVAS_WIDTH + 20;
    manager.tick('room1');
    expect(state.score1).toBe(WIN_SCORE);
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('alice');
  });

  it('should remove game on cleanup', () => {
    manager.joinQueue('room1', 'alice');
    manager.joinQueue('room1', 'bob');
    manager.tryStartMatch('room1');
    manager.removeGame('room1');
    expect(manager.getGame('room1')).toBeUndefined();
  });
});
