// admin.js
const socket = io();
const stage = new Konva.Stage({
  container: 'admin-container',
  width: window.innerWidth,
  height: window.innerHeight
});
const layer = new Konva.Layer();
stage.add(layer);

let currentTool = 'move';

// Tool button handlers
document.getElementById('tool-brush').addEventListener('click', () => currentTool = 'brush');
document.getElementById('tool-texture').addEventListener('click', () => currentTool = 'texture');
document.getElementById('tool-eraser').addEventListener('click', () => currentTool = 'eraser-object');
document.getElementById('tool-move').addEventListener('click', () => currentTool = 'move');

// Sélection et suppression d'un objet
stage.on('click', evt => {
  if (currentTool === 'eraser-object') {
    const shape = evt.target;
    const id = shape.id();
    shape.destroy();
    layer.draw();
    socket.emit('deleteShape', { id });
  }
});

// Clear all button
document.getElementById('clear-canvas').addEventListener('click', () => {
  layer.destroyChildren();
  layer.draw();
  socket.emit('clearCanvas');
});

// Recevoir événements depuis le serveur
socket.on('draw', data => {
  const line = new Konva.Line({
    id: data.id,
    points: data.points,
    stroke: data.stroke,
    strokeWidth: data.strokeWidth,
    globalCompositeOperation: data.globalCompositeOperation
  });
  layer.add(line);
  layer.draw();
});

socket.on('deleteShape', ({ id }) => {
  const shape = layer.findOne('#' + id);
  if (shape) {
    shape.destroy();
    layer.draw();
  }
});

socket.on('clearCanvas', () => {
  layer.destroyChildren();
  layer.draw();
});
