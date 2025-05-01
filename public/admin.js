const socket = io();
const liveStrokes = {};

const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true,
});
const layer = new Konva.Layer();
stage.add(layer);

// 🗺️ Minimap
const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');

function updateMinimap() {
  const scale = 0.1;
  minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
  const dataURL = stage.toDataURL({ pixelRatio: scale });
  const img = new Image();
  img.onload = () => {
    minimapCtx.drawImage(img, 0, 0, minimap.width, minimap.height);
  };
  img.src = dataURL;
}

socket.on('draw-start', ({ id, x, y, color, size, mode }) => {
  if (mode === 'texture') return;
  const line = new Konva.Line({
    stroke: mode === 'eraser' ? 'black' : color,
    strokeWidth: mode === 'eraser' ? size * 2 : size,
    globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over',
    points: [x, y],
    lineCap: 'round',
    lineJoin: 'round'
  });
  liveStrokes[id] = line;
  layer.add(line);
  layer.batchDraw();
  updateMinimap();
});

socket.on('draw-progress', ({ id, x, y, color, size, mode }) => {
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
      layer.add(dot);
    }
    layer.batchDraw();
    updateMinimap();
    return;
  }

  const line = liveStrokes[id];
  if (line) {
    line.points(line.points().concat([x, y]));
    layer.batchDraw();
    updateMinimap();
  }
});

socket.on('draw-end', ({ id }) => {
  delete liveStrokes[id];
});

socket.on('clear-canvas', () => {
  layer.destroyChildren();
  layer.batchDraw();
  updateMinimap();
});

document.getElementById('zoom-in').onclick = () => zoomStage(1.1);
document.getElementById('zoom-out').onclick = () => zoomStage(1 / 1.1);
document.getElementById('reset-zoom').onclick = () => {
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();
  updateMinimap();
};

function zoomStage(factor) {
  const oldScale = stage.scaleX();
  const newScale = oldScale * factor;
  const pointer = stage.getPointerPosition();
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  stage.scale({ x: newScale, y: newScale });
  stage.position({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  });
  stage.batchDraw();
  updateMinimap();
}

document.getElementById('bg-black').onclick = () => {
  document.body.style.backgroundColor = '#111';
};
document.getElementById('bg-white').onclick = () => {
  document.body.style.backgroundColor = '#fff';
};
document.getElementById('clear-canvas').onclick = () => {
  socket.emit('clear-canvas');
};
document.getElementById('back-home').onclick = () => {
  window.location.href = '/';
};
document.getElementById('export').onclick = () => {
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = 'canvas-admin.png';
  link.href = dataURL;
  link.click();
};
minimap.addEventListener('click', (e) => {
  const rect = minimap.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const stageWidth = stage.width();
  const stageHeight = stage.height();
  const scale = 0.1;

  const targetX = -((clickX / scale) - (stageWidth / 2));
  const targetY = -((clickY / scale) - (stageHeight / 2));

  stage.position({ x: targetX, y: targetY });
  stage.batchDraw();
  updateMinimap();
});
