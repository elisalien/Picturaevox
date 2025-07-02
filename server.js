// server.js
const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

// In-memory store for shapes
const shapes = {};

app.use(express.static(path.join(__dirname, 'public')));
app.get('/chantilly', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

io.on('connection', socket => {
  console.log('a user connected');

  // Send existing shapes to this client
  socket.emit('initShapes', Object.values(shapes));

  // Broadcast streaming drawing data
  socket.on('drawing', data => {
    socket.broadcast.emit('drawing', data);
  });

  // Broadcast texture brush data
  socket.on('texture', data => {
    socket.broadcast.emit('texture', data);
  });

  // Final draw event, update store and broadcast
  socket.on('draw', data => {
    shapes[data.id] = data;
    socket.broadcast.emit('draw', data);
  });

  // Shape deletion, update store and broadcast
  socket.on('deleteShape', ({ id }) => {
    delete shapes[id];
    io.emit('deleteShape', { id });
  });

  // Clear canvas, clear store and broadcast
  socket.on('clearCanvas', () => {
    for (let id in shapes) delete shapes[id];
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
