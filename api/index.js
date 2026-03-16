require('dotenv').config({ path: '../.env' });
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PongGameManager } = require('./pongHandler');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

const users = {};
const pongManager = new PongGameManager();
const pongIntervals = {};

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', ({ username, room }) => {
    socket.join(room);
    
    users[socket.id] = { username, room };
    
    socket.to(room).emit('message', {
      user: 'System',
      text: `${username} has joined the room`
    });
    
    socket.emit('message', {
      user: 'System',
      text: `Welcome to ${room}, ${username}!`
    });
    
    const roomUsers = Object.values(users)
      .filter(u => u.room === room)
      .map(u => u.username);
    
    io.to(room).emit('roomUsers', roomUsers);
    
    console.log(`${username} joined room: ${room}`);
  });

  socket.on('sendMessage', (message) => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('message', {
        user: user.username,
        text: message
      });
    }
  });

  // Pong game events
  socket.on('pong:join', ({ room }) => {
    const user = users[socket.id];
    if (!user) return;

    const state = pongManager.joinGame(room, user.username);
    io.to(room).emit('pong:state', state);

    // Start countdown when both players are in
    if (state.status === 'countdown' && !pongIntervals[room]) {
      pongManager.startCountdown(
        room,
        (s) => io.to(room).emit('pong:state', { ...s }),
        (s) => {
          io.to(room).emit('pong:state', { ...s });
          // Start game loop
          pongIntervals[room] = setInterval(() => {
            const updated = pongManager.tick(room);
            if (updated) {
              io.to(room).emit('pong:state', { ...updated });
              if (updated.status === 'finished') {
                clearInterval(pongIntervals[room]);
                delete pongIntervals[room];
              }
            }
          }, 1000 / 60);
        },
      );
    }
  });

  socket.on('pong:restart', ({ room }) => {
    const user = users[socket.id];
    if (!user) return;
    const game = pongManager.getGame(room);
    if (!game || game.status !== 'finished') return;
    if (game.player1 !== user.username && game.player2 !== user.username) return;

    if (pongIntervals[room]) {
      clearInterval(pongIntervals[room]);
      delete pongIntervals[room];
    }

    pongManager.restartGame(
      room,
      (s) => io.to(room).emit('pong:state', { ...s }),
      (s) => {
        io.to(room).emit('pong:state', { ...s });
        pongIntervals[room] = setInterval(() => {
          const updated = pongManager.tick(room);
          if (updated) {
            io.to(room).emit('pong:state', { ...updated });
            if (updated.status === 'finished') {
              clearInterval(pongIntervals[room]);
              delete pongIntervals[room];
            }
          }
        }, 1000 / 60);
      },
    );
  });

  socket.on('pong:startMove', ({ room, direction }) => {
    const user = users[socket.id];
    if (!user) return;
    pongManager.setPlayerDirection(room, user.username, direction);
  });

  socket.on('pong:stopMove', ({ room, direction }) => {
    const user = users[socket.id];
    if (!user) return;
    pongManager.clearPlayerDirection(room, user.username, direction);
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.room).emit('message', {
        user: 'System',
        text: `${user.username} has left the room`
      });
      
      delete users[socket.id];
      
      const roomUsers = Object.values(users)
        .filter(u => u.room === user.room)
        .map(u => u.username);
      
      io.to(user.room).emit('roomUsers', roomUsers);
      
      // Clean up pong game if a player disconnects
      const game = pongManager.getGame(user.room);
      if (game && (game.player1 === user.username || game.player2 === user.username)) {
        if (pongIntervals[user.room]) {
          clearInterval(pongIntervals[user.room]);
          delete pongIntervals[user.room];
        }
        pongManager.removeGame(user.room);
        io.to(user.room).emit('pong:ended', { reason: `${user.username} left the game` });
      }

      console.log(`${user.username} disconnected from room: ${user.room}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`API with Socket.IO listening on port ${PORT}`);
});
