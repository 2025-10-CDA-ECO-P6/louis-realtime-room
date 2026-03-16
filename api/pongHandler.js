const {
  createGameState,
  updateBall,
  checkCollisions,
  movePaddle,
  resetBall,
  WIN_SCORE,
  CANVAS_WIDTH,
} = require('./pongEngine.js');

class PongGameManager {
  constructor() {
    this.games = {};
  }

  joinGame(room, username) {
    if (!this.games[room]) {
      const state = createGameState();
      state.player1 = username;
      this.games[room] = state;
      return state;
    }

    const state = this.games[room];

    // Already a player
    if (state.player1 === username || state.player2 === username) {
      return state;
    }

    // Second player joins
    if (!state.player2) {
      state.player2 = username;
      state.status = 'playing';
    }

    return state;
  }

  getGame(room) {
    return this.games[room];
  }

  handleMove(room, username, direction) {
    const state = this.games[room];
    if (!state || state.status !== 'playing') return;

    if (username === state.player1) {
      movePaddle(state, 1, direction);
    } else if (username === state.player2) {
      movePaddle(state, 2, direction);
    }
  }

  tick(room) {
    const state = this.games[room];
    if (!state || state.status !== 'playing') return state;

    updateBall(state);
    const scoreResult = checkCollisions(state);

    if (scoreResult === 'score1') {
      state.score1++;
      if (state.score1 >= WIN_SCORE) {
        state.status = 'finished';
        state.winner = state.player1;
      } else {
        resetBall(state);
      }
    } else if (scoreResult === 'score2') {
      state.score2++;
      if (state.score2 >= WIN_SCORE) {
        state.status = 'finished';
        state.winner = state.player2;
      } else {
        resetBall(state);
      }
    }

    return state;
  }

  removeGame(room) {
    delete this.games[room];
  }
}

module.exports = { PongGameManager };
