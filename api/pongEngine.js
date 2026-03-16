const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const BALL_SPEED = 4;
const PADDLE_SPEED = 6;
const WIN_SCORE = 5;

function createGameState() {
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
    player1: null,
    player2: null,
    winner: null,
  };
}

function updateBall(state) {
  if (state.status !== 'playing') return;
  state.ball.x += state.ball.dx;
  state.ball.y += state.ball.dy;
}

function checkCollisions(state) {
  const { ball, paddle1, paddle2 } = state;

  if (ball.y <= 0) {
    ball.y = 0;
    ball.dy = Math.abs(ball.dy);
  }
  if (ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
    ball.y = CANVAS_HEIGHT - BALL_SIZE;
    ball.dy = -Math.abs(ball.dy);
  }

  if (
    ball.dx < 0 &&
    ball.x <= paddle1.x + PADDLE_WIDTH &&
    ball.x >= paddle1.x &&
    ball.y + BALL_SIZE >= paddle1.y &&
    ball.y <= paddle1.y + PADDLE_HEIGHT
  ) {
    ball.dx = Math.abs(ball.dx);
  }

  if (
    ball.dx > 0 &&
    ball.x + BALL_SIZE >= paddle2.x &&
    ball.x <= paddle2.x + PADDLE_WIDTH &&
    ball.y + BALL_SIZE >= paddle2.y &&
    ball.y <= paddle2.y + PADDLE_HEIGHT
  ) {
    ball.dx = -Math.abs(ball.dx);
  }

  if (ball.x <= -BALL_SIZE) {
    return 'score2';
  }
  if (ball.x >= CANVAS_WIDTH + BALL_SIZE) {
    return 'score1';
  }

  return null;
}

function movePaddle(state, player, direction) {
  const paddle = player === 1 ? state.paddle1 : state.paddle2;
  if (direction === 'up') {
    paddle.y = Math.max(0, paddle.y - PADDLE_SPEED);
  } else {
    paddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle.y + PADDLE_SPEED);
  }
}

function resetBall(state) {
  state.ball.x = CANVAS_WIDTH / 2;
  state.ball.y = CANVAS_HEIGHT / 2;
  state.ball.dx = Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED;
  state.ball.dy = Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED;
}

module.exports = {
  createGameState,
  updateBall,
  checkCollisions,
  movePaddle,
  resetBall,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  BALL_SIZE,
  BALL_SPEED,
  PADDLE_SPEED,
  WIN_SCORE,
};
