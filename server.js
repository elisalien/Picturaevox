require('dotenv').config(); // Charge les variables d’environnement

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Route publique
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ✅ Route admin protégée
app.get('/chantilly', (req, res) => {
  const { password } = req.query;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).send('⛔ Accès refusé');
  }
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Stock des tracés en mémoire
let drawingData = {};

io.on('connection', (socket) => {
  console.log('🟢 Client connecté :', socket.id);

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

  socket.on('clear-canvas', () => {
    drawingData = {};
    io.emit('clear-canvas');
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client déconnecté :', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
