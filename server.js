// server.js
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for admin interface
app.get('/chantilly', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

io.on('connection', socket => {
  console.log('a user connected');

  // Broadcast drawing events
  socket.on('draw', data => {
    socket.broadcast.emit('draw', data);
  });

  // Broadcast shape deletion
  socket.on('deleteShape', ({ id }) => {
    io.emit('deleteShape', { id });
  });

  // Broadcast clear canvas
  socket.on('clearCanvas', () => {
    io.emit('clearCanvas');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});
