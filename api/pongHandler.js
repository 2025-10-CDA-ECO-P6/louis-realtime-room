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
    this.countdownTimers = {};
    this.playerDirections = {};
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

    // Second player joins — start countdown
    if (!state.player2) {
      state.player2 = username;
      state.status = 'countdown';
      state.countdown = 3;
    }

    return state;
  }

  startCountdown(room, onTick, onStart) {
    const state = this.games[room];
    if (!state) return;

    state.status = 'countdown';
    state.countdown = 3;
    resetBall(state);

    // Reset paddles
    const { CANVAS_HEIGHT, PADDLE_HEIGHT } = require('./pongEngine.js');
    state.paddle1.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    state.paddle2.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;

    onTick(state);

    if (this.countdownTimers[room]) {
      clearInterval(this.countdownTimers[room]);
    }

    this.countdownTimers[room] = setInterval(() => {
      const s = this.games[room];
      if (!s) {
        clearInterval(this.countdownTimers[room]);
        delete this.countdownTimers[room];
        return;
      }
      s.countdown--;
      if (s.countdown <= 0) {
        clearInterval(this.countdownTimers[room]);
        delete this.countdownTimers[room];
        s.status = 'playing';
        s.countdown = null;
        onStart(s);
      } else {
        onTick(s);
      }
    }, 1000);
  }

  restartGame(room, onTick, onStart) {
    const state = this.games[room];
    if (!state || state.status !== 'finished') return null;

    state.score1 = 0;
    state.score2 = 0;
    state.winner = null;
    this.startCountdown(room, onTick, onStart);
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

  setPlayerDirection(room, username, direction) {
    if (!this.playerDirections[room]) {
      this.playerDirections[room] = {};
    }
    this.playerDirections[room][username] = direction;
  }

  clearPlayerDirection(room, username, direction) {
    if (!this.playerDirections[room]) return;
    // Only clear if it matches the current direction (avoid clearing 'up' when 'down' stop comes)
    if (this.playerDirections[room][username] === direction) {
      this.playerDirections[room][username] = null;
    }
  }

  tick(room) {
    const state = this.games[room];
    if (!state || state.status !== 'playing') return state;

    // Apply continuous paddle movement from held keys
    const dirs = this.playerDirections[room];
    if (dirs) {
      if (dirs[state.player1]) {
        movePaddle(state, 1, dirs[state.player1]);
      }
      if (dirs[state.player2]) {
        movePaddle(state, 2, dirs[state.player2]);
      }
    }

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
    if (this.countdownTimers[room]) {
      clearInterval(this.countdownTimers[room]);
      delete this.countdownTimers[room];
    }
    delete this.playerDirections[room];
    delete this.games[room];
  }
}

module.exports = { PongGameManager };
