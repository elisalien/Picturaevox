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
let currentTool = 'pan'; 
const container = stage.getContainer();

// Pan
document.getElementById('pan').addEventListener('click', () => {
  currentTool = 'pan';
  stage.draggable(true);
  container.style.cursor = 'grab';
});

// Zoom in/out/reset
const scaleBy = 1.2;
document.getElementById('zoom-in').addEventListener('click', () => {
  stage.scaleX(stage.scaleX() * scaleBy);
  stage.scaleY(stage.scaleY() * scaleBy);
  stage.batchDraw();
});
document.getElementById('zoom-out').addEventListener('click', () => {
  stage.scaleX(stage.scaleX() / scaleBy);
  stage.scaleY(stage.scaleY() / scaleBy);
  stage.batchDraw();
});
document.getElementById('reset-zoom').addEventListener('click', () => {
  stage.scaleX(1);
  stage.scaleY(1);
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();
});

// Background toggle
document.getElementById('bg-black').addEventListener('click', () => {
  container.style.backgroundColor = '#000';
});
document.getElementById('bg-white').addEventListener('click', () => {
  container.style.backgroundColor = '#fff';
});

// Eraser for object deletion
document.getElementById('eraser').addEventListener('click', () => {
  currentTool = 'eraser';
  stage.draggable(false);
  container.style.cursor = 'crosshair';
});
stage.on('click', evt => {
  if (currentTool === 'eraser' && evt.target && evt.target.getClassName() === 'Line') {
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

// Export PNG
document.getElementById('export').addEventListener('click', () => {
  const uri = stage.toDataURL({ pixelRatio: 3 });
  const link = document.createElement('a');
  link.download = 'canvas.png';
  link.href = uri;
  link.click();
});

// Back to public
document.getElementById('back-home').addEventListener('click', () => {
  window.location.href = '/';
});
