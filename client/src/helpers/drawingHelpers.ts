import { Stroke, useBrushStore } from "../zustand/useBrushStore.ts";
import { onlineStatus, socket } from "../Main.tsx";
import {
  canvasSize,
  layersCanvasMap,
  getCanvasContainer,
  getLocalTempCanvas,
} from "./canvasHelpers.ts";

export function numToHexColor(num: number) {
  return "#" + num.toString(16).padStart(6, "0");
}

export function percentToCanvas(xPercent: number, yPercent: number) {
  return {
    x: (xPercent / 100) * canvasSize.width,
    y: (yPercent / 100) * canvasSize.height,
  };
}

export function getMousePosPercentOnElement(
  e: MouseEvent,
  el: HTMLCanvasElement
) {
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return { x: x * 100, y: y * 100 };
}

export function createLayerCanvas(
  id: string,
  container?: HTMLDivElement | null
) {
  const containerEl = container ?? getCanvasContainer();
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

export function removeLayerCanvas(id: string) {
  const entry = layersCanvasMap[id];
  if (!entry) return;
  entry.canvas.remove();
  delete layersCanvasMap[id];
}

export function clearLayerCanvas(id: string) {
  const entry = layersCanvasMap[id];
  if (!entry) return;
  entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
}

export function redrawLayer(layerId: string) {
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

export function redrawAllLayers() {
  Object.keys(layersCanvasMap).forEach((id) => redrawLayer(id));
}

export function fillBackgroundWhite() {
  const firstLayerId = useBrushStore.getState().layers[0]?.id;
  if (!firstLayerId) return;
  const entry = layersCanvasMap[firstLayerId];
  if (!entry) return;

  entry.ctx.save();
  entry.ctx.fillStyle = "#ffffff";
  entry.ctx.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
  entry.ctx.restore();
}

export function drawStrokeToCtx(ctx: CanvasRenderingContext2D, stroke: Stroke) {
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

export function processStrokeToTemp() {
  const localTempCanvas = getLocalTempCanvas();
  if (!localTempCanvas) return;
  const ctx = localTempCanvas.getContext("2d")!;
  ctx.clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);

  const state = useBrushStore.getState();
  const { pendingPoints, brushColor, brushSize, brushOpacity } = state;

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

export function commitStroke() {
  const localTempCanvas = getLocalTempCanvas();
  const state = useBrushStore.getState();
  const { pendingPoints, activeLayerId } = state;

  if (pendingPoints.length === 0||activeLayerId === null) return;
  processStrokeToTemp();
  const entry = layersCanvasMap[activeLayerId];

  if (!entry) {
    state.clearPendingStroke();
    return;
  }

  const newStroke = {
    points: [...pendingPoints],
    color: state.brushColor,
    size: state.brushSize,
    opacity: state.brushOpacity,
    layerId: activeLayerId,
    final: true,
  };

  drawStrokeToCtx(entry.ctx, newStroke);

  state.addStroke(newStroke);

  if (onlineStatus.inRoom) {
    socket.emit("draw-progress", {
      ...newStroke,
      senderId: socket.id,
    });
  }

  if (localTempCanvas) {
    localTempCanvas
      .getContext("2d")!
      .clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);
  }

  state.clearPendingStroke();
}

export function addPoint(x: number, y: number) {
  const state = useBrushStore.getState();
  const { lastPoint, brushSize } = state;

  if (lastPoint) {
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = Math.max(0.02, brushSize * 0.01);
    if (distance < minDistance) return;
  }
  state.addPendingPoint({ x, y });
  state.setLastPoint({ x, y });
}
