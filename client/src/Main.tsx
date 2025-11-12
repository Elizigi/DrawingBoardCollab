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
  getLocalTempCanvas,
  canvasSize,
  resizeAllCanvases,
} from "./helpers/canvasHelpers.ts";
import {
  fillBackgroundWhite,
  createLayerCanvas,
  redrawAllLayers,
  processStrokeToTemp,
  drawStrokeToCtx,
  redrawLayer,
  refreshState,
  loopOverLayers,
  restoreLayerImage,
  handleDrawing,
  handleTransformInteraction,
} from "./helpers/drawingHelpers.ts";
import { addListeners } from "./helpers/eventListenersHelpers.ts";
import { useOnlineStatus } from "./zustand/useOnlineStatus.ts";

export const socket: Socket = io("http://localhost:3000", {
  autoConnect: false,
});

const rootElement = document.getElementById("root") as HTMLDivElement;
const rotElement = document.getElementById("rot") as HTMLDivElement;

export const canvasScale = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isPanning: false,
  lastPanX: 0,
  lastPanY: 0,
};

function main() {
  setupDOMAndCanvases(rotElement);
  fillBackgroundWhite();

  const topInputCanvas = getTopInputCanvas();

  useBrushStore.subscribe((state, prev) => {
    if (state.layers.length > prev.layers.length) {
      const newLayer = state.layers.at(-1);
      if (!newLayer) return;
      createLayerCanvas(newLayer.id);
    }
    const activeLayerIndex = state.layers.findIndex(
      (l) => l.id === state.activeLayerId
    );
    refreshState(state, prev);
    for (let i = 0; i < state.layers.length; i++) {
      const layer = state.layers[i];
      const entry = layersCanvasMap[layer.id];
      const prevLayer = prev.layers.find((l) => l.id === layer.id);
      if (!entry || !prevLayer) continue;

      entry.canvas.style.display = layer.visible ? "block" : "none";
      entry.canvas.style.zIndex = `${(i + 1) * 10}`;
      if (layer.visible !== prevLayer.visible) {
        redrawLayer(layer.id);
      }
    }
    const localTemp = getLocalTempCanvas();
    const remoteTemp = getRemoteTempCanvas();

    if (localTemp && activeLayerIndex !== -1) {
      localTemp.style.zIndex = `${(activeLayerIndex + 1) * 10 + 2}`;
    }

    if (remoteTemp && activeLayerIndex !== -1) {
      remoteTemp.style.zIndex = `${(activeLayerIndex + 1) * 10 + 1}`;
    }

    if (state.strokes !== prev.strokes) {
      redrawAllLayers();
    }
  });

  if (topInputCanvas) {
    topInputCanvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;

      const state = useBrushStore.getState();
      const activeLayer = state.layers.find(
        (l) => l.id === state.activeLayerId
      );

      if (activeLayer?.imageDataUrl && activeLayer.transform) {
        const handled = handleTransformInteraction(
          e,
          topInputCanvas,
          activeLayer,
          state
        );
        if (handled) return;
      }

      handleDrawing(e, topInputCanvas, state);
    });
  }

  addListeners(topInputCanvas, rotElement);

  (function tick() {
    const now = Date.now();

    const brushState = useBrushStore.getState();
    const { pendingPoints, lastStrokeTime, updateLastStrokeTime } = brushState;

    if (pendingPoints.length > 0 && now - lastStrokeTime > STROKE_THROTTLE) {
      processStrokeToTemp();
      const { inRoom } = useOnlineStatus.getState();
      const brush = brushState;
      if (inRoom) {
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
    for (const stroke of allStrokes) {
      if (!strokesByLayer[stroke.layerId]) strokesByLayer[stroke.layerId] = [];
      strokesByLayer[stroke.layerId].push(stroke);
    }

    socket.emit("send-state", {
      to: from,
      strokes: strokesByLayer,
      layers: layers,
      canvasSize: canvasSize,
    });
  });
  socket.on("remove-stroke", ({ deleteStroke }) => {
    useBrushStore.getState().removeStroke(deleteStroke);
  });
  socket.on("canvas-size", (data) => {
    if (!data) return;
    canvasSize.height = data.height;
    canvasSize.width = data.width;
    resizeAllCanvases(canvasSize.width, canvasSize.height);
  });
  socket.on("transform-updated", ({ layerId, transform }) => {
    useBrushStore.getState().updateLayerTransform(layerId, transform);
    redrawLayer(layerId);
  });
  socket.on("init", (data) => {
    if (!data) return;
    const { strokes, layers, canvasSize: newCanvasSize } = data;

    if (layers && Array.isArray(layers)) {
      useBrushStore.getState().setLayers(layers);
      for (const layer of layers) {
        if (!layersCanvasMap[layer.id]) createLayerCanvas(layer.id);
        restoreLayerImage(layer);
      }
    }
    canvasSize.height = newCanvasSize.height;
    canvasSize.width = newCanvasSize.width;
    resizeAllCanvases(newCanvasSize.width, newCanvasSize.height);

    fillBackgroundWhite();

    if (strokes) {
      const allIncomingStrokes: Stroke[] = [];
      loopOverLayers(strokes, allIncomingStrokes);
      useBrushStore.getState().setStrokes(allIncomingStrokes);
      redrawAllLayers();
    }
  });

  socket.on("draw-progress", (stroke: Stroke) => {
    if (stroke.senderId === socket.id) return;
    const remoteTempCanvas = getRemoteTempCanvas();
    if (!remoteTempCanvas) return;

    stroke.isRemote = true;

    if (!stroke.final) {
      const allLayers = useBrushStore.getState().layers;
      const strokeLayer = allLayers.find(
        (layer) => layer.id === stroke.layerId
      );
      if (!remoteTempCanvas || !strokeLayer?.visible) return;
      const ctx = remoteTempCanvas.getContext("2d")!;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, remoteTempCanvas.width, remoteTempCanvas.height);

      ctx.setTransform(
        canvasScale.scale,
        0,
        0,
        canvasScale.scale,
        canvasScale.offsetX,
        canvasScale.offsetY
      );
      drawStrokeToCtx(ctx, stroke);
      return;
    }
    if (remoteTempCanvas) {
      const ctx = remoteTempCanvas.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, remoteTempCanvas.width, remoteTempCanvas.height);
    }

    if (!layersCanvasMap[stroke.layerId]) {
      createLayerCanvas?.(stroke.layerId);
    }

    useBrushStore.getState().addStroke(stroke);
    redrawLayer(stroke.layerId);
  });
}
main();
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
