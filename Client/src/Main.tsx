import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
} from "pixi.js";
import { Stroke, useBrushStore } from "./zustand/useBrushStore.ts";
import { io, Socket } from "socket.io-client";

export const socket: Socket = io("http://localhost:3000", {
  autoConnect: false,
});

const rootElement = document.getElementById("root") as HTMLDivElement;

const pendingPoints: { x: number; y: number }[] = [];
let lastStrokeTime = 0;
let lastPoint: { x: number; y: number } | null = null;
const STROKE_THROTTLE = 16;
const canvasSize = { width: 1920, height: 1080 };
export const onlineStatus = {
  isOnline: false,
  inRoom: false,
};

(async () => {
  const app = new Application();
  await app.init({
    width: canvasSize.width,
    height: canvasSize.height,
    backgroundColor: 0xffffff,
  });
  rootElement.appendChild(app.canvas);

  const layersContainer = new Container();
  app.stage.addChild(layersContainer);

  const layersMap: Record<string, RenderTexture> = {};

  function createPixiLayer(id: string) {
    const rt = RenderTexture.create({
      width: app.renderer.width,
      height: app.renderer.height,
    });
    const sprite = new Sprite(rt);
    layersContainer.addChild(sprite);
    layersMap[id] = rt;
  }
  function addPoint(x: number, y: number) {
    if (lastPoint) {
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const minDistance = Math.max(0.02, getBrush().brushSize * 0.01);
      if (distance < minDistance) return;
    }

    pendingPoints.push({ x, y });
    lastPoint = { x, y };
  }

  const tempGraphics = new Graphics();
  const remoteGraphics = new Graphics();

  app.stage.addChild(tempGraphics);

  app.stage.addChild(remoteGraphics);

  const getBrush = () => useBrushStore.getState();
  const { layers } = useBrushStore.getState();
  layers.forEach((l) => createPixiLayer(l.id));

  useBrushStore.subscribe((state) => {
    state.layers.forEach((layer, idx) => {
      const sprite = layersContainer.children[idx] as Sprite | undefined;
      if (sprite) {
        sprite.visible = layer.visible;
      }
    });
  });
  useBrushStore.subscribe((state, prev) => {
    if (state.layers.length > prev.layers.length) {
      const newLayer = state.layers[state.layers.length - 1];
      createPixiLayer(newLayer.id);
    }
  });
  app.ticker.add(() => {
    const now = Date.now();
    if (pendingPoints.length > 0 && now - lastStrokeTime > STROKE_THROTTLE) {
      processStroke();
      lastStrokeTime = now;
    }
  });

  function processStroke() {
    if (pendingPoints.length === 0) return;

    const { brushColor, brushSize, activeLayerId, brushOpacity } = getBrush();
    tempGraphics.alpha = brushOpacity / 100;

    if (onlineStatus.inRoom)
      socket.emit("draw-progress", {
        points: [...pendingPoints],
        color: brushColor,
        size: brushSize,
        opacity: brushOpacity,
        layerId: activeLayerId,
        final: false,
        senderId: socket.id,
      });

    tempGraphics.alpha = 1;
    tempGraphics.clear();

    if (pendingPoints.length >= 2) {
      const pixelPoints = pendingPoints.map((p) => percentToCanvas(p.x, p.y));

      tempGraphics.moveTo(pixelPoints[0].x, pixelPoints[0].y);

      for (let i = 1; i < pixelPoints.length - 1; i++) {
        const c = pixelPoints[i];
        const n = pixelPoints[i + 1];
        const midX = (c.x + n.x) / 2;
        const midY = (c.y + n.y) / 2;

        tempGraphics.quadraticCurveTo(c.x, c.y, midX, midY);
      }

      const lastPoint = pixelPoints[pixelPoints.length - 1];
      tempGraphics.lineTo(lastPoint.x, lastPoint.y);

      tempGraphics.stroke({
        color: brushColor,
        width: brushSize,
        cap: "round",
        join: "round",
        alpha: brushOpacity / 100,
      });
    } else if (pendingPoints.length === 1) {
      const p = percentToCanvas(pendingPoints[0].x, pendingPoints[0].y);
      tempGraphics.circle(p.x, p.y, brushSize / 2);
      tempGraphics.fill({ color: brushColor });
    }
  }

  app.canvas.addEventListener("mousedown", (e) => {
    getBrush().setMouseDown(true);
    const { x, y } = getMousePosPercent(e);
    pendingPoints.length = 0;
    lastPoint = null;
    useBrushStore.getState().addUsedColor(getBrush().brushColor);
    addPoint(x, y);
  });

  document.addEventListener("mouseup", () => {
    getBrush().setMouseDown(false);
    commitStroke();
  });

  document.addEventListener("mousemove", (e) => {
    socket.emit("user-move", { position: getMousePosPercent(e) });
    if (!useBrushStore.getState().isMouseDown) return;

    const { x, y } = getMousePosPercent(e);

    addPoint(x, y);
  });

  document.addEventListener("clearCanvas", () => {
    console.log("clearingCanvas");
    for (const layerId of Object.keys(layersMap)) {
      const rt = layersMap[layerId];

      const sprite = layersContainer.children.find(
        (child) => (child as Sprite).texture === rt
      ) as Sprite;

      if (sprite) {
        layersContainer.removeChild(sprite);
      }

      useBrushStore.getState().clearStrokes();
      createPixiLayer(layerId);
    }
  });
  function commitStroke() {
    if (pendingPoints.length === 0) return;
    processStroke();
    const { activeLayerId } = useBrushStore.getState();
    const { brushOpacity } = getBrush();
    tempGraphics.alpha = brushOpacity / 100;

    app.renderer.render({
      container: tempGraphics,
      target: layersMap[activeLayerId],
      clear: false,
    });

    tempGraphics.alpha = 1;

    useBrushStore.getState().addStroke({
      points: [...pendingPoints],
      color: getBrush().brushColor,
      size: getBrush().brushSize,
      opacity: brushOpacity,
      layerId: activeLayerId,
      final: true,
    });
    if (onlineStatus.inRoom)
      socket.emit("draw-progress", {
        points: [...pendingPoints],
        color: getBrush().brushColor,
        size: getBrush().brushSize,
        opacity: getBrush().brushOpacity,
        layerId: getBrush().activeLayerId,
        final: true,
        senderId: socket.id,
      });

    tempGraphics.clear();
    pendingPoints.length = 0;
    lastPoint = null;
  }

  function getMousePosPercent(e: MouseEvent) {
    const rect = app.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: x * 100, y: y * 100 };
  }
  socket.on("request-state", ({ from }) => {
    const allStrokes = useBrushStore.getState().strokes;
    const layers = useBrushStore.getState().layers;

    const strokesByLayer: Record<string, Stroke[]> = {};
    allStrokes.forEach((stroke) => {
      if (!strokesByLayer[stroke.layerId]) {
        strokesByLayer[stroke.layerId] = [];
      }
      strokesByLayer[stroke.layerId].push(stroke);
    });

    socket.emit("send-state", {
      to: from,
      strokes: strokesByLayer,
      layers: layers,
    });
  });
  socket.on("init", (data) => {
    console.log("Received init event", data);
    if (!data) {
      console.warn("Received init event with no data");
      return;
    }
    const { strokes, layers } = data;

    if (layers && Array.isArray(layers)) {
      useBrushStore.getState().setLayers(layers);

      layers.forEach((layer) => {
        if (!layersMap[layer.id]) {
          createPixiLayer(layer.id);
        }
      });
    }

    if (strokes) {
      for (const [layerId, strokeArray] of Object.entries(strokes)) {
        if (!layersMap[layerId]) {
          createPixiLayer(layerId);
        }
        if (Array.isArray(strokeArray)) {
          strokeArray.forEach((stroke) => {
            drawStroke({ ...stroke, final: true }, false);
          });
        }
      }
    }
  });

  socket.on("draw-progress", (stroke) => {
    if (stroke.senderId === socket.id) return;
    drawStroke(stroke, false);
  });
  function percentToCanvas(xPercent: number, yPercent: number) {
    return {
      x: (xPercent / 100) * canvasSize.width,
      y: (yPercent / 100) * canvasSize.height,
    };
  }

  function drawStroke(strokeData: Stroke, isLocal = false) {
    const { points, color, size, layerId, opacity, final } = strokeData;
    if (!layersMap[layerId]) return;

    const graphics = isLocal ? tempGraphics : remoteGraphics;

    graphics.clear();
    graphics.alpha = opacity / 100;

    if (points.length >= 2) {
      const pixelPoints = points.map((p) => percentToCanvas(p.x, p.y));

      graphics.moveTo(pixelPoints[0].x, pixelPoints[0].y);

      for (let i = 1; i < pixelPoints.length - 1; i++) {
        const c = pixelPoints[i];
        const n = pixelPoints[i + 1];
        const midX = (c.x + n.x) / 2;
        const midY = (c.y + n.y) / 2;

        graphics.quadraticCurveTo(c.x, c.y, midX, midY);
      }

      const lastPoint = pixelPoints[pixelPoints.length - 1];
      graphics.lineTo(lastPoint.x, lastPoint.y);

      graphics.stroke({
        color,
        width: size,
        cap: "round",
        join: "round",
        alpha: opacity / 100,
      });
    } else if (points.length === 1) {
      const p = percentToCanvas(points[0].x, points[0].y);
      graphics.circle(p.x, p.y, size / 2);
      graphics.fill({ color });
    }

    if (final) {
      app.renderer.render({
        container: graphics,
        target: layersMap[layerId],
        clear: false,
      });
      graphics.clear();
    }

    graphics.alpha = 1;
  }
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
