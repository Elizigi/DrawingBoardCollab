import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { Stroke, useBrushStore } from "./zustand/useBrushStore.ts";
import { io, Socket } from "socket.io-client";

import {
  setupDOMAndCanvases,
  layersCanvasMap,
  STROKE_THROTTLE,
  getTopInputCanvas,
  getRemoteTempCanvas,
} from "./helpers/canvasHelpers.ts";
import {
  fillBackgroundWhite,
  createLayerCanvas,
  removeLayerCanvas,
  redrawAllLayers,
  processStrokeToTemp,
  getMousePosPercentOnElement,
  addPoint,
  drawStrokeToCtx,
  redrawLayer,
} from "./helpers/drawingHelpers.ts";
import { addListeners } from "./helpers/eventListenersHelpers.ts";

export const socket: Socket = io("http://localhost:3000", {
  autoConnect: false,
});

const rootElement = document.getElementById("root") as HTMLDivElement;
const rotElement = document.getElementById("rot") as HTMLDivElement;

export const onlineStatus = {
  isOnline: false,
  inRoom: false,
  isAdmin: false,
};

(async () => {
  setupDOMAndCanvases(rotElement);
  fillBackgroundWhite();

  const topInputCanvas = getTopInputCanvas();

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
      const prevLayer = prev.layers.find((l) => l.id === layer.id);
      if (!entry || !prevLayer) return;

      entry.canvas.style.display = layer.visible ? "block" : "none";
      entry.canvas.style.opacity = (layer as any).opacity?.toString() ?? "1";

      if (layer.visible !== prevLayer.visible) {
        redrawLayer(layer.id);
      }
    });

    if (state.strokes !== prev.strokes) {
      redrawAllLayers();
    }
  });

  if (topInputCanvas) {
    topInputCanvas.addEventListener("mousedown", (e) => {
      const state = useBrushStore.getState();
      state.setMouseDown(true);
      const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);

      state.clearPendingStroke();
      state.addUsedColor(state.brushColor);
      addPoint(x, y);
    });
  }

  addListeners(topInputCanvas);

  (function tick() {
    const now = Date.now();

    const brushState = useBrushStore.getState();
    const { pendingPoints, lastStrokeTime, updateLastStrokeTime } = brushState;

    if (pendingPoints.length > 0 && now - lastStrokeTime > STROKE_THROTTLE) {
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

      updateLastStrokeTime(now);
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
    const remoteTempCanvas = getRemoteTempCanvas();

    if (!remoteTempCanvas) return;

    const ctx = remoteTempCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, remoteTempCanvas.width, remoteTempCanvas.height);

    if (!stroke.final) {
      const allLayers = useBrushStore.getState().layers;
      const strokeLayer = allLayers.find(
        (layer) => layer.id === stroke.layerId
      );
      if (!remoteTempCanvas || !strokeLayer?.visible) return;
      const ctx = remoteTempCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, remoteTempCanvas.width, remoteTempCanvas.height);
      drawStrokeToCtx(ctx, stroke);
    } else {
      const entry = layersCanvasMap[stroke.layerId];
      if (!entry) return;

      useBrushStore.getState().addStroke(stroke);

      drawStrokeToCtx(entry.ctx, stroke);
    }
  });
})();

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
