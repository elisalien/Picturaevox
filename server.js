// server.js
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

io.on('connection', socket => {
  console.log('a user connected');

  // Repartir un dessin
  socket.on('draw', data => {
    socket.broadcast.emit('draw', data);
  });

  // Repartir une suppression de forme
  socket.on('deleteShape', ({ id }) => {
    io.emit('deleteShape', { id });
  });

  // Repartir commande clear canvas
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
