require('dotenv').config(); // Charge .env

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sert les fichiers statiques depuis ./public
app.use(express.static(path.join(__dirname, 'public')));

// Page publique
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ✅ Page admin protégée par mot de passe dans l'URL
app.get('/chantilly', (req, res) => {
  const { password } = req.query;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.redirect('/admin-login.html'); // redirige vers formulaire
  }
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Canvas data en mémoire
let drawingData = {};

io.on('connection', (socket) => {
  console.log('🟢 Client connecté :', socket.id);

  // Envoie les tracés existants au nouveau client
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

// 🚀 Port Railway ou local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
