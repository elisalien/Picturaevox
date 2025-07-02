// public/app.js
const socket = io();
const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight
});
const layer = new Konva.Layer();
stage.add(layer);

let currentTool  = 'brush';
let currentColor = document.querySelector('.color-btn.active').dataset.color;
let currentSize  = parseInt(document.getElementById('size-slider').value, 10);
let isDrawing    = false;
let lastLine;
let currentId;

// Throttle helper
function throttle(func, wait) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

function generateId() {
  return 'shape_' + Date.now() + '_' + Math.round(Math.random() * 10000);
}

const emitDrawingThrottled = throttle((data) => {
  socket.emit('drawing', data);
}, 50);

// Tool buttons
document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.id;
    if (currentTool === 'pan') {
      stage.draggable(true);
      stage.container().style.cursor = 'grab';
    } else {
      stage.draggable(false);
      stage.container().style.cursor = 'crosshair';
    }
  });
});

// Color selection
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-btn').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    currentColor = btn.dataset.color;
  });
});

// Size slider
document.getElementById('size-slider').addEventListener('input', e => {
  currentSize = parseInt(e.target.value, 10);
});

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

// Drawing events
stage.on('mousedown touchstart', () => {
  if (currentTool === 'pan') return;
  isDrawing = true;
  currentId = generateId();
  const pos = stage.getPointerPosition();
  if (currentTool !== 'texture') {
    lastLine = new Konva.Line({
      id: currentId,
      points: [pos.x, pos.y],
      stroke: currentTool === 'eraser' ? null : currentColor,
      strokeWidth: currentSize,
      globalCompositeOperation: currentTool === 'eraser' ? 'destination-out' : 'source-over',
      lineCap: 'round',
      lineJoin: 'round'
    });
    layer.add(lastLine);
  }
});

stage.on('mousemove touchmove', () => {
  if (!isDrawing) return;
  const pos = stage.getPointerPosition();
  if (currentTool === 'texture') {
    // Generate textured dots
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      const alpha = 0.3 + Math.random() * 0.3;
      const dot = new Konva.Line({
        points: [
          pos.x + offsetX,
          pos.y + offsetY,
          pos.x + offsetX + Math.random() * 2,
          pos.y + offsetY + Math.random() * 2
        ],
        stroke: currentColor,
        strokeWidth: 1 + Math.random() * (currentSize / 3),
        globalAlpha: alpha,
        lineCap: 'round',
        lineJoin: 'round'
      });
      layer.add(dot);
    }
    layer.batchDraw();
    socket.emit('texture', {
      id: currentId,
      x: pos.x,
      y: pos.y,
      color: currentColor,
      size: currentSize
    });
    return;
  }
  // Brush
  lastLine.points(lastLine.points().concat([pos.x, pos.y]));
  layer.batchDraw();
  emitDrawingThrottled({
    id: currentId,
    points: lastLine.points(),
    stroke: lastLine.stroke(),
    strokeWidth: lastLine.strokeWidth(),
    globalCompositeOperation: lastLine.globalCompositeOperation()
  });
});

stage.on('mouseup touchend', () => {
  if (!isDrawing) return;
  isDrawing = false;
  if (currentTool !== 'texture') {
    socket.emit('draw', {
      id: currentId,
      points: lastLine.points(),
      stroke: lastLine.stroke(),
      strokeWidth: lastLine.strokeWidth(),
      globalCompositeOperation: lastLine.globalCompositeOperation()
    });
  }
});

// Socket listeners
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
