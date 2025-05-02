const socket = io();
let deleteMode = false;

const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true,
});
const layer = new Konva.Layer();
stage.add(layer);

// 🔁 Mode poubelle
document.getElementById('delete-mode').onclick = () => {
  deleteMode = !deleteMode;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  if (deleteMode) {
    document.getElementById('delete-mode').classList.add('active');
    stage.container().style.cursor = 'not-allowed';
  } else {
    document.getElementById('pan').classList.add('active');
    stage.container().style.cursor = 'default';
  }
};

// 🖱 Clic sur trait ou groupe = suppression
stage.on('click', (e) => {
  if (!deleteMode || e.target === stage) return;

  const node = e.target;
  const group = node.getParent();
  const id = group?.id() || node.id();

  if (id) {
    const target = layer.findOne('#' + id);
    if (target) {
      target.destroy();
      socket.emit('delete-shape', { id });
      layer.batchDraw();
    }
  }
});

// 🔄 Synchronisation suppression
socket.on('delete-shape', ({ id }) => {
  const target = layer.findOne('#' + id);
  if (target) {
    target.destroy();
    layer.batchDraw();
  }
});

// 🎨 Ajout du trait ou groupe (draw-start)
socket.on('draw-start', ({ id, x, y, color, size, mode }) => {
  if (mode === 'texture') {
    const group = new Konva.Group({ id });
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
  layer.add(line);
});

// 🖌️ Trait ou spray progressif (draw-progress)
socket.on('draw-progress', ({ id, x, y, color, size, mode }) => {
  const target = layer.findOne('#' + id);
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

socket.on('draw-end', () => {});
socket.on('clear-canvas', () => {
  layer.destroyChildren();
  layer.batchDraw();
});
