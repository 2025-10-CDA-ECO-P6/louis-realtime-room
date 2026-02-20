const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

const users = {};

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
      
      console.log(`${user.username} disconnected from room: ${user.room}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`API with Socket.IO listening on port ${PORT}`);
});
