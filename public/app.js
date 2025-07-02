// app.js (publique)
const socket = io();

// Initialisation du stage et du layer
const stage = new Konva.Stage({
  container: 'canvas-container',                // <–– correction ici
  width: window.innerWidth,
  height: window.innerHeight
});
const layer = new Konva.Layer();
stage.add(layer);

// États globaux
let currentTool  = 'brush';
let currentColor = document.querySelector('.color-btn.active').dataset.color;
let currentSize  = parseInt(document.getElementById('size-slider').value, 10);
let isDrawing    = false;
let lastLine;

// Générateur d’ID unique
function generateId() {
  return 'shape_' + Date.now() + '_' + Math.round(Math.random() * 10000);
}

// Gestion des outils
const tools = document.querySelectorAll('.tool-btn');
tools.forEach(btn => {
  btn.addEventListener('click', () => {
    tools.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.id; // 'brush', 'texture', 'eraser', 'pan'
    // Activation/désactivation du drag pour le pan
    if (currentTool === 'pan') {
      stage.draggable(true);
      stage.container().style.cursor = 'grab';
    } else {
      stage.draggable(false);
      stage.container().style.cursor = 'crosshair';
    }
  });
});

// Choix de couleur
const colors = document.querySelectorAll('.color-btn');
colors.forEach(btn => {
  btn.addEventListener('click', () => {
    colors.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    currentColor = btn.dataset.color;
  });
});

// Réglage de la taille
document.getElementById('size-slider').addEventListener('input', e => {
  currentSize = parseInt(e.target.value, 10);
});

// Début du dessin / effacement
stage.on('mousedown touchstart', () => {
  if (currentTool === 'pan') return;
  isDrawing = true;
  const pos = stage.getPointerPosition();
  const id = generateId();
  lastLine = new Konva.Line({
    id,
    points: [pos.x, pos.y],
    stroke: currentTool === 'eraser' ? null : currentColor,
    strokeWidth: currentSize,
    globalCompositeOperation: currentTool === 'eraser'
      ? 'destination-out'
      : 'source-over',
    lineCap: 'round',
    lineJoin: 'round'
  });
  layer.add(lastLine);
  stage.draw();
});

// Poursuite du tracé
stage.on('mousemove touchmove', () => {
  if (!isDrawing) return;
  const pos = stage.getPointerPosition();
  lastLine.points(lastLine.points().concat([pos.x, pos.y]));
  layer.batchDraw();
});

// Fin du tracé et émission
stage.on('mouseup touchend', () => {
  if (!isDrawing) return;
  isDrawing = false;
  socket.emit('draw', {
    id: lastLine.id(),
    points: lastLine.points(),
    stroke: lastLine.stroke(),
    strokeWidth: lastLine.strokeWidth(),
    globalCompositeOperation: lastLine.globalCompositeOperation()
  });
});

// Réception d’un dessin depuis le serveur
socket.on('draw', data => {
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
  layer.draw();
});

// Suppression d’une forme spécifique
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
