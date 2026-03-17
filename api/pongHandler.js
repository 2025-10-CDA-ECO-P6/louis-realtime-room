const {
  createGameState,
  updateBall,
  checkCollisions,
  movePaddle,
  resetBall,
  WIN_SCORE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT,
} = require('./pongEngine.js');

class PongGameManager {
  constructor() {
    this.games = {};
    this.queues = {};
    this.countdownTimers = {};
    this.playerDirections = {};
  }

  joinQueue(room, username) {
    if (!this.queues[room]) this.queues[room] = [];
    if (this.queues[room].includes(username)) return;
    const game = this.games[room];
    if (game && game.status !== 'finished' && (game.player1 === username || game.player2 === username)) return;
    this.queues[room].push(username);
  }

  leaveQueue(room, username) {
    if (!this.queues[room]) return;
    this.queues[room] = this.queues[room].filter(u => u !== username);
  }

  getLobby(room) {
    const game = this.games[room];
    return {
      queue: this.queues[room] || [],
      player1: game?.player1 || null,
      player2: game?.player2 || null,
      gameStatus: game ? game.status : 'idle',
      winner: game?.winner || null,
    };
  }

  tryStartMatch(room) {
    const game = this.games[room];
    if (game && game.status !== 'finished') return false;
    const queue = this.queues[room];
    if (!queue || queue.length < 2) return false;

    const p1 = queue.shift();
    const p2 = queue.shift();

    const state = createGameState();
    state.player1 = p1;
    state.player2 = p2;
    state.status = 'countdown';
    state.countdown = 3;
    this.games[room] = state;
    return true;
  }

  startCountdown(room, onTick, onStart) {
    const state = this.games[room];
    if (!state) return;

    state.status = 'countdown';
    state.countdown = 3;
    resetBall(state);

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
