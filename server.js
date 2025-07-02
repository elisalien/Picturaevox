require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/chantilly', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

let drawingData = {};

io.on('connection', (socket) => {
  console.log('🟢', socket.id);

  for (const [id, points] of Object.entries(drawingData)) {
    socket.emit('draw-start', points[0]);
    for (let i = 1; i < points.length; i++) {
      socket.emit('draw-progress', points[i]);
    }
    socket.emit('draw-end', { id });
  }

  socket.on('draw-start', ({ id, ...data }) => {
    drawingData[id] = [{ id, ...data }];
    io.emit('draw-start', { id, ...data });
  });

  socket.on('draw-progress', ({ id, ...data }) => {
    if (drawingData[id]) {
      drawingData[id].push({ id, ...data });
      io.emit('draw-progress', { id, ...data });
    }
  });

  socket.on('draw-end', ({ id }) => {
    io.emit('draw-end', { id });
  });

  socket.on('delete-shape', ({ id }) => {
    delete drawingData[id];
    io.emit('delete-shape', { id });
  });

  socket.on('clear-canvas', () => {
    drawingData = {};
    io.emit('clear-canvas');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('✅ Server on http://localhost:3000');
});
