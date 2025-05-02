// Version admin.js avec gomme libre (comme app.js)
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
