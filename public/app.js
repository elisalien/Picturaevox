// app.js (publique)
const socket = io();
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});
const layer = new Konva.Layer();
stage.add(layer);

let isDrawing = false;
let lastLine;

function generateId() {
  return 'shape_' + Date.now() + '_' + Math.round(Math.random() * 10000);
}

// Drawing handlers
stage.on('mousedown touchstart', () => {
  isDrawing = true;
  const pos = stage.getPointerPosition();
  const id = generateId();
  lastLine = new Konva.Line({
    id,
    points: [pos.x, pos.y],
    stroke: currentColor,
    strokeWidth: currentSize,
    globalCompositeOperation: 'source-over'
  });
  layer.add(lastLine);
  stage.draw();
});

stage.on('mousemove touchmove', () => {
  if (!isDrawing) return;
  const pos = stage.getPointerPosition();
  lastLine.points(lastLine.points().concat([pos.x, pos.y]));
  layer.batchDraw();
});

stage.on('mouseup touchend', () => {
  isDrawing = false;
  socket.emit('draw', {
    id: lastLine.id(),
    points: lastLine.points(),
    stroke: lastLine.stroke(),
    strokeWidth: lastLine.strokeWidth(),
    globalCompositeOperation: lastLine.globalCompositeOperation()
  });
});

// Socket listeners
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

// Suppression d'une forme spécifique
socket.on('deleteShape', ({ id }) => {
  const shape = layer.findOne('#' + id);
  if (shape) {
    shape.destroy();
    layer.draw();
  }
});

// Effacement complet du canvas
socket.on('clearCanvas', () => {
  layer.destroyChildren();
  layer.draw();
});
