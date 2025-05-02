// Version admin.js avec gomme libre + synchro dessins publics
const socket = io();

const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true,
});
const layer = new Konva.Layer();
stage.add(layer);

const incomingStrokes = {};
let currentLine = null;
let mode = 'pan';
let isDrawing = false;
let eraserSize = 20;

function getLocalPointer() {
  const pos = stage.getPointerPosition();
  return {
    x: pos.x / stage.scaleX() - stage.x() / stage.scaleX(),
    y: pos.y / stage.scaleY() - stage.y() / stage.scaleY()
  };
}

// Boutons de mode
const buttons = ['pan', 'eraser'];
buttons.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', () => {
      buttons.forEach(b => {
        const btn = document.getElementById(b);
        if (btn) btn.classList.remove('active');
      });
      el.classList.add('active');
      mode = id;
      stage.draggable(mode === 'pan');
    });
  }
});

// Gomme libre identique à l'interface publique
stage.on('mousedown touchstart', () => {
  if (mode !== 'eraser') return;
  isDrawing = true;
  const pos = getLocalPointer();

  currentLine = new Konva.Line({
    id: 'admin-eraser-' + Date.now(),
    stroke: 'black',
    strokeWidth: eraserSize * 2,
    globalCompositeOperation: 'destination-out',
    points: [pos.x, pos.y],
    lineCap: 'round',
    lineJoin: 'round'
  });
  layer.add(currentLine);
});

stage.on('mousemove touchmove', () => {
  if (!isDrawing || mode !== 'eraser') return;
  const pos = getLocalPointer();
  currentLine.points(currentLine.points().concat([pos.x, pos.y]));
  layer.batchDraw();
});

stage.on('mouseup touchend', () => {
  if (!isDrawing) return;
  isDrawing = false;
});

// 🔄 Suppressions synchronisées
socket.on('delete-shape', ({ id }) => {
  const target = layer.findOne('#' + id);
  if (target) {
    target.destroy();
    layer.batchDraw();
  }
});

// 🎨 Dessins publics (réception)
socket.on('draw-start', ({ id, x, y, color, size, mode }) => {
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
          y + offsetY + Math.random() * 2,
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

socket.on('clear-canvas', () => {
  layer.destroyChildren();
  layer.batchDraw();
});
