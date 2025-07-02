// admin.js
const socket = io();
const stage = new Konva.Stage({
  container: 'admin-container',
  width: window.innerWidth,
  height: window.innerHeight
});
const layer = new Konva.Layer();
stage.add(layer);

// Admin tools
let currentTool = 'move';
document.getElementById('tool-brush').addEventListener('click', () => currentTool = 'brush');
document.getElementById('tool-texture').addEventListener('click', () => currentTool = 'texture');
document.getElementById('tool-eraser').addEventListener('click', () => currentTool = 'eraser-object');
document.getElementById('tool-move').addEventListener('click', () => currentTool = 'move');
stage.on('click', evt => {
  if (currentTool === 'eraser-object') {
    const shape = evt.target;
    const id = shape.id();
    shape.destroy();
    layer.draw();
    socket.emit('deleteShape', { id });
  }
});
document.getElementById('clear-canvas').addEventListener('click', () => {
  layer.destroyChildren();
  layer.draw();
  socket.emit('clearCanvas');
});

// Real-time drawing updates
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
