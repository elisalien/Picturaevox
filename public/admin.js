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

// Tool buttons
document.getElementById('tool-brush').addEventListener('click', () => currentTool = 'brush');
document.getElementById('tool-texture').addEventListener('click', () => currentTool = 'texture');
document.getElementById('tool-eraser').addEventListener('click', () => currentTool = 'eraser-object');
document.getElementById('tool-move').addEventListener('click', () => currentTool = 'move');

// Initialize existing shapes on load
socket.on('initShapes', shapes => {
  shapes.forEach(data => {
    const line = new Konva.Line({
      id: data.id,
      points: data.points,
      stroke: data.stroke,
      strokeWidth: data.strokeWidth,
      globalCompositeOperation: data.globalCompositeOperation,
      lineCap: 'round',
      lineJoin: 'round'
    });
    layer.add(line);
  });
  layer.draw();
});

// Selection & deletion
stage.on('click', evt => {
  if (currentTool === 'eraser-object') {
    const shape = evt.target;
    const id = shape.id();
    shape.destroy();
    layer.draw();
    socket.emit('deleteShape', { id });
  }
});

// Clear canvas
document.getElementById('clear-canvas').addEventListener('click', () => {
  layer.destroyChildren();
  layer.draw();
  socket.emit('clearCanvas');
});

// Real-time drawing update
socket.on('drawing', data => {
  let shape = layer.findOne('#' + data.id);
  if (shape) {
    shape.points(data.points);
  } else {
    const line = new Konva.Line({
      id: data.id,
      points: data.points,
      stroke: data.stroke,
      strokeWidth: data.strokeWidth,
      globalCompositeOperation: data.globalCompositeOperation,
      lineCap: 'round',
      lineJoin: 'round'
    });
    layer.add(line);
  }
  layer.batchDraw();
});

// Final draw event
socket.on('draw', data => {
  let shape = layer.findOne('#' + data.id);
  if (shape) {
    shape.points(data.points);
    shape.stroke(data.stroke);
    shape.strokeWidth(data.strokeWidth);
    shape.globalCompositeOperation(data.globalCompositeOperation);
  } else {
    const line = new Konva.Line({
      id: data.id,
      points: data.points,
      stroke: data.stroke,
      strokeWidth: data.strokeWidth,
      globalCompositeOperation: data.globalCompositeOperation,
      lineCap: 'round',
      lineJoin: 'round'
    });
    layer.add(line);
  }
  layer.draw();
});

// Shape deletion
socket.on('deleteShape', ({ id }) => {
  const shape = layer.findOne('#' + id);
  if (shape) {
    shape.destroy();
    layer.draw();
  }
});

// Canvas clear
socket.on('clearCanvas', () => {
  layer.destroyChildren();
  layer.draw();
});
