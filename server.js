// server.js
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/chantilly', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

io.on('connection', socket => {
  console.log('a user connected');

  // Draw events
  socket.on('draw', data => {
    socket.broadcast.emit('draw', data);
  });

  // Streaming drawing
  socket.on('drawing', data => {
    socket.broadcast.emit('drawing', data);
  });

  // Delete shape
  socket.on('deleteShape', ({ id }) => {
    io.emit('deleteShape', { id });
  });

  // Clear canvas
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
