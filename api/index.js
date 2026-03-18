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
const nextMatchTimers = {};

function getActiveRooms() {
  const roomMap = {};
  for (const u of Object.values(users)) {
    if (!roomMap[u.room]) roomMap[u.room] = 0;
    roomMap[u.room]++;
  }
  return Object.entries(roomMap).map(([name, count]) => ({ name, users: count }));
}

function broadcastRoomList() {
  io.emit('rooms:list', getActiveRooms());
}

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

function broadcastLobby(room) {
  io.to(room).emit('pong:lobby', pongManager.getLobby(room));
}

function startGameForRoom(room) {
  pongManager.startCountdown(
    room,
    (s) => {
      io.to(room).emit('pong:state', { ...s });
      broadcastLobby(room);
    },
    (s) => {
      io.to(room).emit('pong:state', { ...s });
      broadcastLobby(room);
      pongIntervals[room] = setInterval(() => {
        const updated = pongManager.tick(room);
        if (updated) {
          io.to(room).emit('pong:state', { ...updated });
          if (updated.status === 'finished') {
            clearInterval(pongIntervals[room]);
            delete pongIntervals[room];
            broadcastLobby(room);
            // Auto-start next match after delay
            nextMatchTimers[room] = setTimeout(() => {
              delete nextMatchTimers[room];
              if (pongManager.tryStartMatch(room)) {
                broadcastLobby(room);
                startGameForRoom(room);
              }
            }, 3000);
          }
        }
      }, 1000 / 60);
    },
  );
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.emit('rooms:list', getActiveRooms());

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
    broadcastRoomList();
    
    // Send current pong lobby/game state to new joiner
    socket.emit('pong:lobby', pongManager.getLobby(room));
    const currentGame = pongManager.getGame(room);
    if (currentGame) {
      socket.emit('pong:state', { ...currentGame });
    }

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
  socket.on('pong:queue', ({ room }) => {
    const user = users[socket.id];
    if (!user) return;
    pongManager.joinQueue(room, user.username);
    broadcastLobby(room);

    // Try to start match if enough players
    if (pongManager.tryStartMatch(room)) {
      broadcastLobby(room);
      startGameForRoom(room);
    }
  });

  socket.on('pong:dequeue', ({ room }) => {
    const user = users[socket.id];
    if (!user) return;
    pongManager.leaveQueue(room, user.username);
    broadcastLobby(room);
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
      broadcastRoomList();
      
      // Clean up pong game if a player disconnects
      pongManager.leaveQueue(user.room, user.username);
      const game = pongManager.getGame(user.room);
      if (game && (game.player1 === user.username || game.player2 === user.username)) {
        if (pongIntervals[user.room]) {
          clearInterval(pongIntervals[user.room]);
          delete pongIntervals[user.room];
        }
        if (nextMatchTimers[user.room]) {
          clearTimeout(nextMatchTimers[user.room]);
          delete nextMatchTimers[user.room];
        }
        pongManager.removeGame(user.room);
        io.to(user.room).emit('pong:ended', { reason: `${user.username} left the game` });
      }
      broadcastLobby(user.room);

      console.log(`${user.username} disconnected from room: ${user.room}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`API with Socket.IO listening on port ${PORT}`);
});
