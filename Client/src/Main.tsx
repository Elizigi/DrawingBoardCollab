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
  getLocalTempCanvas,
  getRemoteTempCanvas,
} from "./helpers/canvasHelpers.ts";
import {
  fillBackgroundWhite,
  createLayerCanvas,
  removeLayerCanvas,
  redrawAllLayers,
  clearLayerCanvas,
  processStrokeToTemp,
  getMousePosPercentOnElement,
  commitStroke,
  addPoint,
  drawStrokeToCtx,
} from "./helpers/drawingHelpers.ts";
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
      const state = useBrushStore.getState();
      state.setMouseDown(true);
      const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);

      state.clearPendingStroke();
      state.addUsedColor(state.brushColor);
      addPoint(x, y);
    });
  }

  document.addEventListener("mouseup", () => {
    useBrushStore.getState().setMouseDown(false);
    commitStroke();
  });

  document.addEventListener("mousemove", (e) => {
    if (!topInputCanvas) return;

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
    const { pendingPoints, lastStrokeTime, updateLastStrokeTime } = brushState;

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
            // 💡 Use store state property
            points: [...pendingPoints],
            color: brush.brushColor,
            size: brush.brushSize,
            opacity: brush.brushOpacity,
            layerId: brush.activeLayerId,
            final: false,
            senderId: socket.id,
          });
        }
      } else {
        const localTempCanvas = getLocalTempCanvas();
        if (localTempCanvas) {
          const ctx = localTempCanvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, localTempCanvas.width, localTempCanvas.height);
          }
        }
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

    if (!stroke.final) {
      const remoteTempCanvas = getRemoteTempCanvas();
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
