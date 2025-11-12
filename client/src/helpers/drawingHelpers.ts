import {
  BrushState,
  defaultLayer,
  EventTypes,
  Stroke,
  useBrushStore,
} from "../zustand/useBrushStore.ts";
import { canvasScale, socket } from "../Main.tsx";
import {
  canvasSize,
  layersCanvasMap,
  getCanvasContainer,
  getLocalTempCanvas,
} from "./canvasHelpers.ts";
import { useOnlineStatus } from "../zustand/useOnlineStatus.ts";
import { transformSettings } from "./eventListenersHelpers.ts";

export function numToHexColor(num: number) {
  return "#" + num.toString(16).padStart(6, "0");
}

export function percentToCanvas(xPercent: number, yPercent: number) {
  return {
    x: (xPercent / 100) * canvasSize.width,
    y: (yPercent / 100) * canvasSize.height,
  };
}
export const getTouchPosPercent = (touch: Touch, el: HTMLCanvasElement) =>
  getMousePosPercentOnElement(touch, el);
export function getMousePosPercentOnElement(
  e: MouseEvent | { clientX: number; clientY: number },
  el: HTMLCanvasElement
) {
  const rect = el.getBoundingClientRect();

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldX = (mouseX - canvasScale.offsetX) / canvasScale.scale;
  const worldY = (mouseY - canvasScale.offsetY) / canvasScale.scale;

  return { x: (worldX / el.width) * 100, y: (worldY / el.height) * 100 };
}
export function restoreLayerImage(layer: any) {
  if (!layer.imageDataUrl) return;

  const img = new Image();
  img.src = layer.imageDataUrl;
  img.onload = () => {
    const entry = layersCanvasMap[layer.id];
    if (entry) {
      entry.image = img;
      redrawLayer(layer.id);
    }
  };
}
export function drawTransformControls(
  ctx: CanvasRenderingContext2D,
  transform: { x: number; y: number; width: number; height: number }
) {
  const handleSize = 8;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.strokeStyle = "#0066ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(transform.x, transform.y, transform.width, transform.height);

  const corners = [
    { x: transform.x, y: transform.y },
    { x: transform.x + transform.width, y: transform.y },
    { x: transform.x, y: transform.y + transform.height },
    { x: transform.x + transform.width, y: transform.y + transform.height },
  ];

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0066ff";
  for (const corner of corners) {
    ctx.fillRect(
      corner.x - handleSize / 2,
      corner.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      corner.x - handleSize / 2,
      corner.y - handleSize / 2,
      handleSize,
      handleSize
    );
  }

  ctx.restore();
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
  entry.ctx.setTransform(1, 0, 0, 1, 0, 0);
  entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
}
export function redrawLayer(layerId: string) {
  const entry = layersCanvasMap[layerId];
  if (!entry) return;

  entry.ctx.setTransform(1, 0, 0, 1, 0, 0);
  entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);

  if (layerId === defaultLayer) {
    entry.ctx.save();
    entry.ctx.fillStyle = "#ffffff";
    entry.ctx.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
    entry.ctx.restore();
  }

  entry.ctx.setTransform(
    canvasScale.scale,
    0,
    0,
    canvasScale.scale,
    canvasScale.offsetX,
    canvasScale.offsetY
  );

  const layer = useBrushStore.getState().layers.find((l) => l.id === layerId);
  if (entry.image && layer?.transform) {
    const transform = layer.transform;
    entry.ctx.drawImage(
      entry.image,
      transform.x,
      transform.y,
      transform.width,
      transform.height
    );

    if (
      layer.id === useBrushStore.getState().activeLayerId &&
      layer.imageDataUrl
    ) {
      drawTransformControls(entry.ctx, transform);
    }
  } else if (layerId.includes("imported") && entry.image) {
    const img = entry.image;
    const offsetX = (entry.canvas.width - img.width) / 2;
    const offsetY = (entry.canvas.height - img.height) / 2;
    entry.ctx.drawImage(img, offsetX, offsetY);
  }

  const strokes = useBrushStore
    .getState()
    .strokes.filter((s) => s.layerId === layerId);
  for (const stroke of strokes) drawStrokeToCtx(entry.ctx, stroke);
}

export function redrawAllLayers() {
  for (const id of Object.keys(layersCanvasMap)) redrawLayer(id);
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

    const last = pixelPoints.at(-1);
    if (last) ctx.lineTo(last.x, last.y);
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);

  ctx.setTransform(
    canvasScale.scale,
    0,
    0,
    canvasScale.scale,
    canvasScale.offsetX,
    canvasScale.offsetY
  );

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

    const last = pixelPoints.at(-1);
    if (!last) return;
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

  if (pendingPoints.length === 0 || activeLayerId === null) return;
  processStrokeToTemp();
  const entry = layersCanvasMap[activeLayerId];

  if (!entry) {
    state.clearPendingStroke();
    return;
  }

  const newStroke = {
    strokeId: crypto.randomUUID(),
    points: [...pendingPoints],
    color: state.brushColor,
    size: state.brushSize,
    opacity: state.brushOpacity,
    layerId: activeLayerId,
    final: true,
  };
  const ctx = entry.ctx;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setTransform(
    canvasScale.scale,
    0,
    0,
    canvasScale.scale,
    canvasScale.offsetX,
    canvasScale.offsetY
  );
  drawStrokeToCtx(ctx, newStroke);

  state.addStroke(newStroke);
  const { inRoom } = useOnlineStatus.getState();

  if (inRoom) {
    socket.emit("draw-progress", {
      ...newStroke,
      senderId: socket.id,
    });
  }

  if (localTempCanvas) {
    const tCtx = localTempCanvas.getContext("2d")!;
    tCtx.setTransform(1, 0, 0, 1, 0, 0);
    tCtx.clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);
  }

  state.clearPendingStroke();
}

export function addPoint(x: number, y: number) {
  const state = useBrushStore.getState();
  const { lastPoint, brushSize } = state;

  if (lastPoint) {
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;
    const distance = Math.hypot(dx * dx + dy * dy);
    const minDistance = Math.max(0.02, brushSize * 0.01);
    if (distance < minDistance) return;
  }
  state.addPendingPoint({ x, y });
  state.setLastPoint({ x, y });
}

export function findLastLocalStroke() {
  const strokes = useBrushStore.getState().strokes;
  const lockedLayersIds = useBrushStore.getState().lockedLayersIds;

  let lastLocalStrokeIndex = -1;

  for (let i = strokes.length - 1; i >= 0; i--) {
    if (
      strokes[i].isRemote !== true &&
      !lockedLayersIds.has(strokes[i].layerId)
    ) {
      lastLocalStrokeIndex = i;
      break;
    }
  }

  if (lastLocalStrokeIndex === -1) return null;

  return strokes[lastLocalStrokeIndex];
}
export function loopOverLayers(
  strokes: Record<string, Stroke[]> | Stroke[],
  allIncomingStrokes: Stroke[]
) {
  if (Array.isArray(strokes)) {
    for (const stroke of strokes) {
      allIncomingStrokes.push({
        ...stroke,
        final: true,
        isRemote: true,
      });
    }
    return;
  }

  for (const [layerId, strokeArray] of Object.entries(strokes)) {
    if (!layersCanvasMap[layerId]) createLayerCanvas(layerId);
    if (Array.isArray(strokeArray)) {
      for (const stroke of strokeArray) {
        allIncomingStrokes.push({
          ...stroke,
          final: true,
          isRemote: true,
          layerId,
        });
      }
    }
  }
}
export function refreshState(state: BrushState, prev: BrushState) {
  if (state.layers.length < prev.layers.length) {
    const prevIds = new Set(prev.layers.map((l) => l.id));
    const newIds = new Set(state.layers.map((l) => l.id));

    for (const id of prevIds) {
      if (!newIds.has(id)) {
        removeLayerCanvas(id);
      }
    }
  }
}
export function clampCanvasOffset() {
  const container = getCanvasContainer();
  if (!container) return;

  const cw = container.clientWidth;
  const ch = container.clientHeight;

  const contentW = canvasSize.width * canvasScale.scale;
  const contentH = canvasSize.height * canvasScale.scale;

  if (contentW <= cw) {
    canvasScale.offsetX = (cw - contentW) / 2;
  } else {
    const minX = cw - contentW;
    const maxX = 0;
    if (canvasScale.offsetX < minX) canvasScale.offsetX = minX;
    if (canvasScale.offsetX > maxX) canvasScale.offsetX = maxX;
  }

  if (contentH <= ch) {
    canvasScale.offsetY = (ch - contentH) / 2;
  } else {
    const minY = ch - contentH;
    const maxY = 0;
    if (canvasScale.offsetY < minY) canvasScale.offsetY = minY;
    if (canvasScale.offsetY > maxY) canvasScale.offsetY = maxY;
  }
}
export function handleTransformInteraction(
  e: MouseEvent,
  topInputCanvas: HTMLCanvasElement,
  activeLayer: any,
  state: any
): boolean {
  const rect = topInputCanvas.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;

  const mouseX = (clientX - canvasScale.offsetX) / canvasScale.scale;
  const mouseY = (clientY - canvasScale.offsetY) / canvasScale.scale;

  const handleSize = 8 / canvasScale.scale;
  const transform = activeLayer.transform;

  const handles = {
    tl: { x: transform.x, y: transform.y },
    tr: { x: transform.x + transform.width, y: transform.y },
    bl: { x: transform.x, y: transform.y + transform.height },
    br: {
      x: transform.x + transform.width,
      y: transform.y + transform.height,
    },
  };

  for (const [key, handle] of Object.entries(handles)) {
    if (
      Math.abs(mouseX - handle.x) < handleSize * 2 &&
      Math.abs(mouseY - handle.y) < handleSize * 2
    ) {
      const { isAdmin } = useOnlineStatus.getState();
      if (!isAdmin) {
        state.addEvent(EventTypes.noPermission, "");
        return true; 
      }

      transformSettings.isResizingImage = true;
      transformSettings.resizeHandle = key as any;
      transformSettings.dragStartPos = { x: mouseX, y: mouseY };
      transformSettings.initialTransform = { ...transform };
      e.preventDefault();
      e.stopPropagation();
      return true; 
    }
  }

  if (
    mouseX >= transform.x &&
    mouseX <= transform.x + transform.width &&
    mouseY >= transform.y &&
    mouseY <= transform.y + transform.height
  ) {
    const { isAdmin } = useOnlineStatus.getState();
    if (!isAdmin) {
      state.addEvent(EventTypes.noPermission, "");
      return true; 
    }

    transformSettings.isDraggingImage = true;
    transformSettings.dragStartPos = { x: mouseX, y: mouseY };
    transformSettings.initialTransform = { ...transform };
    e.preventDefault();
    e.stopPropagation();
    return true; 
  }

  return false; 
}

export function handleDrawing(
  e: MouseEvent,
  topInputCanvas: HTMLCanvasElement,
  state: any
) {
  state.setMouseDown(true);
  const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);
  state.clearPendingStroke();
  state.addUsedColor(state.brushColor);
  addPoint(x, y);
}
