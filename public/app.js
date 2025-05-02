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
let currentGroup = null;
const incomingStrokes = {};

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.id;
    stage.draggable(mode === 'pan');
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

socket.on('delete-shape', ({ id }) => {
  const shape = layer.findOne('#' + id);
  if (shape) {
    shape.destroy();
    layer.batchDraw();
  }
});

socket.on('draw-start', ({ id, x, y, color, size, mode }) => {
  if (id === userId) return;

  if (mode === 'texture') {
    const group = new Konva.Group({ id });
    incomingStrokes[id] = group;
    layer.add(group);
    return;
  }

  const line = new Konva.Line({
    id,
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

socket.on('draw-progress', ({ id, x, y, color, size, mode }) => {
  const target = incomingStrokes[id];
  if (!target) return;

  if (mode === 'texture') {
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      const alpha = 0.3 + Math.random() * 0.3;

      const dot = new Konva.Line({
        stroke: color,
        strokeWidth: 1 + Math.random() * (size / 3),
        globalAlpha: alpha,
        points: [
          x + offsetX,
          y + offsetY,
          x + offsetX + Math.random() * 2,
          y + offsetY + Math.random() * 2
        ],
        lineCap: 'round',
      });

      target.add(dot);
    }
    layer.batchDraw();
    return;
  }

  target.points(target.points().concat([x, y]));
  layer.batchDraw();
});

socket.on('draw-end', ({ id }) => {
  delete incomingStrokes[id];
});

stage.on('mousedown touchstart', () => {
  if (mode === 'pan') return;
  isDrawing = true;
  const pos = stage.getPointerPosition();

  if (mode === 'texture') {
    currentGroup = new Konva.Group({ id: userId });
    layer.add(currentGroup);
    incomingStrokes[userId] = currentGroup;

    socket.emit('draw-start', {
      id: userId,
      x: pos.x,
      y: pos.y,
      color: currentColor,
      size: brushSize,
      mode
    });
    return;
  }

  currentLine = new Konva.Line({
    id: userId,
    stroke: mode === 'eraser' ? 'black' : currentColor,
    strokeWidth: mode === 'eraser' ? brushSize * 2 : brushSize,
    globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over',
    points: [pos.x, pos.y],
    lineCap: 'round',
    lineJoin: 'round'
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
  const pos = stage.getPointerPosition();

  if (mode === 'texture') {
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      const alpha = 0.3 + Math.random() * 0.3;

      const dot = new Konva.Line({
        stroke: currentColor,
        strokeWidth: 1 + Math.random() * (brushSize / 3),
        globalAlpha: alpha,
        points: [
          pos.x + offsetX,
          pos.y + offsetY,
          pos.x + offsetX + Math.random() * 2,
          pos.y + offsetY + Math.random() * 2
        ],
        lineCap: 'round',
      });

      currentGroup.add(dot);
    }
    layer.batchDraw();

    socket.emit('draw-progress', {
      id: userId,
      x: pos.x,
      y: pos.y,
      color: currentColor,
      size: brushSize,
      mode
    });
    return;
  }

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
