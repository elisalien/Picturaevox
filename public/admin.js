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

stage.on('click', (e) => {
  if (!deleteMode || e.target === stage) return;
  const id = e.target.id();
  if (id) {
    e.target.destroy();
    socket.emit('delete-shape', { id });
    layer.batchDraw();
  }
});

socket.on('delete-shape', ({ id }) => {
  const shape = layer.findOne('#' + id);
  if (shape) shape.destroy();
  layer.batchDraw();
});

socket.on('draw-start', ({ id, x, y, color, size, mode }) => {
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

socket.on('draw-progress', ({ id, x, y }) => {
  const shape = layer.findOne('#' + id);
  if (shape) {
    shape.points(shape.points().concat([x, y]));
    layer.batchDraw();
  }
});

socket.on('draw-end', () => {});
socket.on('clear-canvas', () => {
  layer.destroyChildren();
  layer.batchDraw();
});
