const socket = io();
const userId = Math.random().toString(36).substring(2, 10);

const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: false,
});

const layer = new Konva.Layer();
stage.add(layer);

let mode = 'brush';
let isDrawing = false;
let currentColor = '#FF5252';
let brushSize = 4;
let currentLine = null;
const incomingStrokes = {};

window.addEventListener('resize', () => {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight);
});

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.id;
    stage.draggable(mode === 'pan');
    document.body.classList.toggle('pan-mode', mode === 'pan');
  });
});

document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentColor = btn.dataset.color;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('size-slider').addEventListener('input', e => {
  brushSize = parseInt(e.target.value);
});

socket.on('clear-canvas', () => {
  layer.destroyChildren();
  layer.batchDraw();
});

socket.on('draw-start', ({ id, x, y, color, size, mode }) => {
  if (id === userId) return;

  const line = new Konva.Line({
    id, // ✅ essentiel pour suppression future
    stroke: mode === 'eraser' ? 'black' : color,
    strokeWidth: mode === 'eraser' ? size * 2 : size,
    globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over',
    points: [x, y],
    lineCap: 'round',
    lineJoin: 'round'
  });
  incomingStrokes[id] = line;
  layer.add(line);
});

socket.on('draw-progress', ({ id, x, y }) => {
  const line = incomingStrokes[id];
  if (line) {
    line.points(line.points().concat([x, y]));
    layer.batchDraw();
  }
});

socket.on('draw-end', ({ id }) => {
  delete incomingStrokes[id];
});

socket.on('delete-shape', ({ id }) => {
  const shape = layer.findOne('#' + id);
  if (shape) {
    shape.destroy();
    layer.batchDraw();
  }
});

stage.on('mousedown touchstart', () => {
  if (mode === 'pan') return;
  isDrawing = true;
  const pos = stage.getRelativePointerPosition(layer);

  currentLine = new Konva.Line({
    stroke: mode === 'eraser' ? 'black' : currentColor,
    strokeWidth: mode === 'eraser' ? brushSize * 2 : brushSize,
    globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over',
    points: [pos.x, pos.y],
    lineCap: 'round',
    lineJoin: 'round',
    id: userId
  });
  layer.add(currentLine);

  socket.emit('draw-start', {
    id: userId,
    x: pos.x,
    y: pos.y,
    color: currentColor,
    size: brushSize,
    mode
  });
});

stage.on('mousemove touchmove', () => {
  if (!isDrawing) return;
  const pos = stage.getRelativePointerPosition(layer);
  currentLine.points(currentLine.points().concat([pos.x, pos.y]));
  layer.batchDraw();

  socket.emit('draw-progress', {
    id: userId,
    x: pos.x,
    y: pos.y,
    color: currentColor,
    size: brushSize,
    mode
  });
});

stage.on('mouseup touchend', () => {
  if (!isDrawing) return;
  isDrawing = false;
  socket.emit('draw-end', { id: userId });
});
