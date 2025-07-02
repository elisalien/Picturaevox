// public/admin.js
const socket = io();
const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight
});
const layer = new Konva.Layer();
stage.add(layer);

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

// Real-time streaming updates
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

// Listen for texture brush events
socket.on('texture', data => {
  for (let i = 0; i < 5; i++) {
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    const alpha = 0.3 + Math.random() * 0.3;
    const dot = new Konva.Line({
      points: [
        data.x + offsetX,
        data.y + offsetY,
        data.x + offsetX + Math.random() * 2,
        data.y + offsetY + Math.random() * 2
      ],
      stroke: data.color,
      strokeWidth: 1 + Math.random() * (data.size / 3),
      globalAlpha: alpha,
      lineCap: 'round',
      lineJoin: 'round'
    });
    layer.add(dot);
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

// Toolbar controls
const panBtn = document.getElementById('pan');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetZoomBtn = document.getElementById('reset-zoom');
const bgBlackBtn = document.getElementById('bg-black');
const bgWhiteBtn = document.getElementById('bg-white');
const eraserBtn = document.getElementById('eraser');
const clearBtn = document.getElementById('clear-canvas');
const exportBtn = document.getElementById('export');
const backHomeBtn = document.getElementById('back-home');
const container = stage.container();
const scaleFactor = 1.2;

function setActiveButton(activeBtn) {
  [panBtn, zoomInBtn, zoomOutBtn, resetZoomBtn, bgBlackBtn, bgWhiteBtn, eraserBtn, clearBtn, exportBtn, backHomeBtn]
    .forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

// Pan
panBtn.addEventListener('click', () => {
  setActiveButton(panBtn);
  stage.draggable(true);
  container.style.cursor = 'grab';
});

// Zoom in
zoomInBtn.addEventListener('click', () => {
  setActiveButton(zoomInBtn);
  stage.draggable(false);
  const oldScale = stage.scaleX();
  stage.scale({ x: oldScale * scaleFactor, y: oldScale * scaleFactor });
  stage.batchDraw();
  container.style.cursor = 'crosshair';
});

// Zoom out
zoomOutBtn.addEventListener('click', () => {
  setActiveButton(zoomOutBtn);
  stage.draggable(false);
  const oldScale = stage.scaleX();
  stage.scale({ x: oldScale / scaleFactor, y: oldScale / scaleFactor });
  stage.batchDraw();
  container.style.cursor = 'crosshair';
});

// Reset zoom
resetZoomBtn.addEventListener('click', () => {
  setActiveButton(panBtn);
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();
  stage.draggable(true);
  container.style.cursor = 'grab';
});

// Background toggle
bgBlackBtn.addEventListener('click', () => {
  bgBlackBtn.classList.add('active');
  bgWhiteBtn.classList.remove('active');
  container.style.backgroundColor = '#000';
});
bgWhiteBtn.addEventListener('click', () => {
  bgWhiteBtn.classList.add('active');
  bgBlackBtn.classList.remove('active');
  container.style.backgroundColor = '#fff';
});

// Eraser (object deletion)
eraserBtn.addEventListener('click', () => {
  setActiveButton(eraserBtn);
  stage.draggable(false);
  container.style.cursor = 'crosshair';
});
stage.on('click', evt => {
  if (eraserBtn.classList.contains('active') && evt.target.getClassName() === 'Line') {
    const shape = evt.target;
    const id = shape.id();
    shape.destroy();
    layer.draw();
    socket.emit('deleteShape', { id });
  }
});

// Clear canvas
clearBtn.addEventListener('click', () => {
  setActiveButton(clearBtn);
  layer.destroyChildren();
  layer.draw();
  socket.emit('clearCanvas');
});

// Export PNG
exportBtn.addEventListener('click', () => {
  setActiveButton(exportBtn);
  const uri = stage.toDataURL({ pixelRatio: 3 });
  const link = document.createElement('a');
  link.download = 'canvas.png';
  link.href = uri;
  link.click();
});

// Back to public
backHomeBtn.addEventListener('click', () => {
  setActiveButton(backHomeBtn);
  window.location.href = '/';
});
