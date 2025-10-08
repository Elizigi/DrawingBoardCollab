import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { Stroke, useBrushStore } from "./zustand/useBrushStore.ts";
import { io, Socket } from "socket.io-client";

export const socket: Socket = io("http://localhost:3000", {
  autoConnect: false,
});

const rootElement = document.getElementById("root") as HTMLDivElement;
const rotElement = document.getElementById("rot") as HTMLDivElement;

const pendingPoints: { x: number; y: number }[] = [];
let lastStrokeTime = 0;
let lastPoint: { x: number; y: number } | null = null;
const STROKE_THROTTLE = 16;
const canvasSize = { width: 1920, height: 1080 };
export const onlineStatus = {
  isOnline: false,
  inRoom: false,
  isAdmin: false,
};

const layersCanvasMap: Record<
  string,
  { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
> = {};
let containerEl: HTMLDivElement | null = null;
let topInputCanvas!: HTMLCanvasElement;
let localTempCanvas: HTMLCanvasElement | null = null;
let remoteTempCanvas: HTMLCanvasElement | null = null;

function numToHexColor(num: number) {
  return "#" + num.toString(16).padStart(6, "0");
}

function createLayerCanvas(id: string) {
  if (!containerEl) return;
  if (layersCanvasMap[id]) return;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  canvas.id = id;
  canvas.style.position = "absolute";
  canvas.style.top = "0";

  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;

  containerEl.appendChild(canvas);
  layersCanvasMap[id] = { canvas, ctx };
}

function removeLayerCanvas(id: string) {
  const entry = layersCanvasMap[id];
  if (!entry) return;
  entry.canvas.remove();
  delete layersCanvasMap[id];
}

function clearLayerCanvas(id: string) {
  const entry = layersCanvasMap[id];
  if (!entry) return;
  entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
}

function redrawLayer(layerId: string) {
  const entry = layersCanvasMap[layerId];
  if (!entry) return;

  clearLayerCanvas(layerId);

  const firstLayerId = useBrushStore.getState().layers[0]?.id;

  if (layerId === firstLayerId) {
    entry.ctx.save();
    entry.ctx.fillStyle = "#ffffff";
    entry.ctx.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
    entry.ctx.restore();
  }

  const strokes = useBrushStore
    .getState()
    .strokes.filter((s) => s.layerId === layerId);
  strokes.forEach((s) => drawStrokeToCtx(entry.ctx, s));
}

function redrawAllLayers() {
  Object.keys(layersCanvasMap).forEach((id) => redrawLayer(id));
}

function drawStrokeToCtx(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, size, opacity } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.globalAlpha = (opacity ?? 100) / 100;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size;
  ctx.strokeStyle = numToHexColor(color);
  ctx.fillStyle = numToHexColor(color);

  if (points.length >= 2) {
    const pixelPoints = points.map((p) => percentToCanvas(p.x, p.y));
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);

    for (let i = 1; i < pixelPoints.length - 1; i++) {
      const c = pixelPoints[i];
      const n = pixelPoints[i + 1];
      const midX = (c.x + n.x) / 2;
      const midY = (c.y + n.y) / 2;
      ctx.quadraticCurveTo(c.x, c.y, midX, midY);
    }

    const last = pixelPoints[pixelPoints.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  } else if (points.length === 1) {
    const p = percentToCanvas(points[0].x, points[0].y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function percentToCanvas(xPercent: number, yPercent: number) {
  return {
    x: (xPercent / 100) * canvasSize.width,
    y: (yPercent / 100) * canvasSize.height,
  };
}

function processStrokeToTemp() {
  if (!localTempCanvas) return;
  const ctx = localTempCanvas.getContext("2d")!;
  ctx.clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);

  const brush = useBrushStore.getState();
  const { brushColor, brushSize, brushOpacity } = brush;

  if (pendingPoints.length === 0) return;

  if (pendingPoints.length >= 2) {
    const pixelPoints = pendingPoints.map((p) => percentToCanvas(p.x, p.y));
    ctx.save();
    ctx.globalAlpha = brushOpacity / 100;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = numToHexColor(brushColor);

    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);

    for (let i = 1; i < pixelPoints.length - 1; i++) {
      const c = pixelPoints[i];
      const n = pixelPoints[i + 1];
      const midX = (c.x + n.x) / 2;
      const midY = (c.y + n.y) / 2;
      ctx.quadraticCurveTo(c.x, c.y, midX, midY);
    }

    const last = pixelPoints[pixelPoints.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  } else if (pendingPoints.length === 1) {
    const p = percentToCanvas(pendingPoints[0].x, pendingPoints[0].y);
    ctx.save();
    ctx.globalAlpha = brushOpacity / 100;
    ctx.beginPath();
    ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = numToHexColor(brushColor);
    ctx.fill();
    ctx.restore();
  }
}

function commitStroke() {
  if (pendingPoints.length === 0) return;
  processStrokeToTemp();
  const { activeLayerId, layers } = useBrushStore.getState();
  const brush = useBrushStore.getState();
  const entry = layersCanvasMap[activeLayerId];
  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const isLayerVisible = activeLayer?.visible !== false;
  if (localTempCanvas) {
    const ctx = localTempCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);
    }
  }
  if (!entry || !isLayerVisible) {
    pendingPoints.length = 0;
    lastPoint = null;
    return;
  }

  drawStrokeToCtx(entry.ctx, {
    points: [...pendingPoints],
    color: brush.brushColor,
    size: brush.brushSize,
    opacity: brush.brushOpacity,
    layerId: activeLayerId,
    final: true,
  });

  useBrushStore.getState().addStroke({
    points: [...pendingPoints],
    color: brush.brushColor,
    size: brush.brushSize,
    opacity: brush.brushOpacity,
    layerId: activeLayerId,
    final: true,
  });

  if (onlineStatus.inRoom) {
    socket.emit("draw-progress", {
      points: [...pendingPoints],
      color: brush.brushColor,
      size: brush.brushSize,
      opacity: brush.brushOpacity,
      layerId: activeLayerId,
      final: true,
      senderId: socket.id,
    });
  }

  pendingPoints.length = 0;
  lastPoint = null;
}

function addPoint(x: number, y: number) {
  if (lastPoint) {
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = Math.max(
      0.02,
      useBrushStore.getState().brushSize * 0.01
    );
    if (distance < minDistance) return;
  }
  pendingPoints.push({ x, y });
  lastPoint = { x, y };
}

function setupDOMAndCanvases() {
  if (!rotElement) return;
  containerEl = document.createElement("div");
  containerEl.style.position = "relative";
  containerEl.style.width = canvasSize.width + "px";
  containerEl.style.height = canvasSize.height + "px";
  rotElement.appendChild(containerEl);

  const { layers } = useBrushStore.getState();
  layers.forEach((l) => createLayerCanvas(l.id));

  remoteTempCanvas = document.createElement("canvas");
  remoteTempCanvas.width = canvasSize.width;
  remoteTempCanvas.height = canvasSize.height;
  remoteTempCanvas.style.position = "absolute";
  remoteTempCanvas.style.top = "0";
  remoteTempCanvas.style.left = "0";
  remoteTempCanvas.style.pointerEvents = "none";
  containerEl.appendChild(remoteTempCanvas);

  localTempCanvas = document.createElement("canvas");
  localTempCanvas.width = canvasSize.width;
  localTempCanvas.height = canvasSize.height;
  localTempCanvas.style.position = "absolute";
  localTempCanvas.style.top = "0";
  localTempCanvas.style.left = "0";
  localTempCanvas.style.pointerEvents = "none";
  containerEl.appendChild(localTempCanvas);

  topInputCanvas = document.createElement("canvas");
  topInputCanvas.width = canvasSize.width;
  topInputCanvas.height = canvasSize.height;
  topInputCanvas.style.position = "absolute";
  topInputCanvas.style.top = "0";
  topInputCanvas.style.left = "0";
  topInputCanvas.style.cursor = "crosshair";
  topInputCanvas.style.pointerEvents = "auto";
  containerEl.appendChild(topInputCanvas);
}

(async () => {
  setupDOMAndCanvases();
  fillBackgroundWhite();
  useBrushStore.subscribe((state, prev) => {
    if (state.layers.length > prev.layers.length) {
      const newLayer = state.layers[state.layers.length - 1];
      createLayerCanvas(newLayer.id);
    }

    if (state.layers.length < prev.layers.length) {
      const prevIds = new Set(prev.layers.map((l) => l.id));
      const newIds = new Set(state.layers.map((l) => l.id));
      prevIds.forEach((id) => {
        if (!newIds.has(id)) removeLayerCanvas(id);
      });
    }

    state.layers.forEach((layer) => {
      const entry = layersCanvasMap[layer.id];
      if (!entry) return;
      entry.canvas.style.display = layer.visible ? "block" : "none";
      entry.canvas.style.opacity = (layer as any).opacity ?? "1";
    });

    if (state.strokes !== prev.strokes) {
      redrawAllLayers();
    }
  });

  if (topInputCanvas) {
    topInputCanvas.addEventListener("mousedown", (e) => {
      useBrushStore.getState().setMouseDown(true);
      const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);
      pendingPoints.length = 0;
      lastPoint = null;
      useBrushStore
        .getState()
        .addUsedColor(useBrushStore.getState().brushColor);
      addPoint(x, y);
    });
  }

  document.addEventListener("mouseup", () => {
    useBrushStore.getState().setMouseDown(false);
    commitStroke();
  });

  document.addEventListener("mousemove", (e) => {
    if (onlineStatus.inRoom)
      socket.emit("user-move", {
        position: getMousePosPercentOnElement(e, topInputCanvas),
      });
    if (!useBrushStore.getState().isMouseDown) return;
    const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);
    addPoint(x, y);
  });

  document.addEventListener("clearCanvas", () => {
    useBrushStore.getState().clearStrokes();
    Object.keys(layersCanvasMap).forEach((id) => clearLayerCanvas(id));
  });

  (function tick() {
    const now = Date.now();

    const brushState = useBrushStore.getState();

    const activeLayer = brushState.layers.find(
      (l) => l.id === brushState.activeLayerId
    );
    const isLayerVisible = activeLayer?.visible !== false;

    if (pendingPoints.length > 0 && now - lastStrokeTime > STROKE_THROTTLE) {
      if (isLayerVisible) {
        processStrokeToTemp();

        const brush = brushState;
        if (onlineStatus.inRoom) {
          socket.emit("draw-progress", {
            points: [...pendingPoints],
            color: brush.brushColor,
            size: brush.brushSize,
            opacity: brush.brushOpacity,
            layerId: brush.activeLayerId,
            final: false,
            senderId: socket.id,
          });
        }
      } else if (localTempCanvas) {
        const canvasEl = localTempCanvas as HTMLCanvasElement;
        const ctx = canvasEl.getContext("2d");

        if (ctx) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }
      }

      lastStrokeTime = now;
    }
    requestAnimationFrame(tick);
  })();
  socket.on("request-state", ({ from }) => {
    const allStrokes = useBrushStore.getState().strokes;
    const layers = useBrushStore.getState().layers;

    const strokesByLayer: Record<string, Stroke[]> = {};
    allStrokes.forEach((stroke) => {
      if (!strokesByLayer[stroke.layerId]) strokesByLayer[stroke.layerId] = [];
      strokesByLayer[stroke.layerId].push(stroke);
    });

    socket.emit("send-state", {
      to: from,
      strokes: strokesByLayer,
      layers: layers,
    });
  });

  socket.on("init", (data) => {
    if (!data) return;
    const { strokes, layers } = data;

    if (layers && Array.isArray(layers)) {
      useBrushStore.getState().setLayers(layers);
      layers.forEach((layer: any) => {
        if (!layersCanvasMap[layer.id]) createLayerCanvas(layer.id);
      });
    }

    fillBackgroundWhite();

    if (strokes) {
      const allIncomingStrokes: Stroke[] = [];

      for (const [layerId, strokeArray] of Object.entries(strokes)) {
        if (!layersCanvasMap[layerId]) createLayerCanvas(layerId);
        if (Array.isArray(strokeArray)) {
          strokeArray.forEach((stroke: Stroke) => {
            allIncomingStrokes.push({ ...stroke, final: true });

            const entry = layersCanvasMap[layerId];
            if (entry) drawStrokeToCtx(entry.ctx, { ...stroke, final: true });
          });
        }
      }

      useBrushStore.getState().setStrokes(allIncomingStrokes);
    }
  });

  socket.on("draw-progress", (stroke: any) => {
    if (stroke.senderId === socket.id) return;

    if (!stroke.final) {
      if (!remoteTempCanvas) return;
      const ctx = remoteTempCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, remoteTempCanvas.width, remoteTempCanvas.height);
      drawStrokeToCtx(ctx, stroke);
    } else {
      const entry = layersCanvasMap[stroke.layerId];
      if (!entry) return;
      drawStrokeToCtx(entry.ctx, stroke);
    }
  });
})();

function fillBackgroundWhite() {
  const firstLayerId = useBrushStore.getState().layers[0]?.id;
  if (!firstLayerId) return;
  const entry = layersCanvasMap[firstLayerId];
  if (!entry) return;

  entry.ctx.save();
  entry.ctx.fillStyle = "#ffffff";
  entry.ctx.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
  entry.ctx.restore();
}

function getMousePosPercentOnElement(e: MouseEvent, el: HTMLCanvasElement) {
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return { x: x * 100, y: y * 100 };
}

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error(
    "Root element not found! Make sure you have <div id='root'></div> in your index.html"
  );
}
