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
let mode = 'pan';
let eraserSize = 10;

function updateCursor() {
  stage.container().style.cursor = mode === 'eraser' ? 'cell' : 'default';
}

// 🔘 Boutons
const buttons = [
  'pan', 'zoom-in', 'zoom-out', 'reset-zoom',
  'bg-black', 'bg-white', 'clear-canvas',
  'export', 'back-home', 'eraser'
];

buttons.forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        const el = document.getElementById(b);
        if (el) el.classList.remove('active');
      });
      btn.classList.add('active');
      if (id === 'eraser') mode = 'eraser';
      else if (id === 'pan') mode = 'pan';
      updateCursor();
    });
  }
});

// 🔍 Zoom
let scale = 1;
document.getElementById('zoom-in').onclick = () => {
  scale *= 1.2;
  stage.scale({ x: scale, y: scale });
  stage.batchDraw();
};
document.getElementById('zoom-out').onclick = () => {
  scale /= 1.2;
  stage.scale({ x: scale, y: scale });
  stage.batchDraw();
};
document.getElementById('reset-zoom').onclick = () => {
  scale = 1;
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();
};

// 🎨 Fond
document.getElementById('bg-black').onclick = () => {
  document.getElementById('canvas-container').style.backgroundColor = '#111';
};
document.getElementById('bg-white').onclick = () => {
  document.getElementById('canvas-container').style.backgroundColor = '#fff';
};

// 🧼 Effacer tout
document.getElementById('clear-canvas').onclick = () => {
  layer.destroyChildren();
  layer.batchDraw();
  socket.emit('clear-canvas');
};

// ↩️ Retour
document.getElementById('back-home').onclick = () => {
  window.location.href = '/';
};

// 📷 Export
document.getElementById('export').onclick = () => {
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = 'dessin.png';
  link.href = dataURL;
  link.click();
};

// 🎚️ Slider gomme
const slider = document.createElement('input');
slider.type = 'range';
slider.min = 5;
slider.max = 50;
slider.value = eraserSize;
slider.id = 'eraser-size';
slider.style.position = 'fixed';
slider.style.bottom = '20px';
slider.style.left = '10px';
slider.style.zIndex = '1001';
document.body.appendChild(slider);
slider.addEventListener('input', e => {
  eraserSize = parseInt(e.target.value);
});

// 🧽 Gomme objet
stage.on('mousedown', e => {
  if (mode !== 'eraser') return;
  const pointer = stage.getPointerPosition();
  const shape = layer.getIntersection(pointer);
  if (!shape || shape === stage) return;
  const group = shape.getParent();
  const id = group?.id() || shape.id();
  if (id) {
    const target = layer.findOne('#' + id);
    if (target) {
      target.destroy();
      socket.emit('delete-shape', { id });
      layer.batchDraw();
    }
  }
});

// 🔄 Suppressions
socket.on('delete-shape', ({ id }) => {
  const target = layer.findOne('#' + id);
  if (target) {
    target.destroy();
    layer.batchDraw();
  }
});

// 🖌️ Dessins entrants
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
