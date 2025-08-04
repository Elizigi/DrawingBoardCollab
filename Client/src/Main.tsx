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

let mouseDown = false;
let pendingPoints: { x: number; y: number }[] = [];
let lastStrokeTime = 0;
let lastPoint: { x: number; y: number } | null = null;
const STROKE_THROTTLE = 16;

(async () => {
  const app = new Application();
  await app.init({ width:1920, height: 1080, backgroundColor: 0xffffff });
  rootElement.appendChild(app.canvas);

  let canvasRect = app.canvas.getBoundingClientRect();
  let windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

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

      const minDistance = Math.max(1, getBrush().brushSize * 0.1);
      if (distance < minDistance) return;
    }

    pendingPoints.push({ x, y });
    lastPoint = { x, y };
  }

  const tempGraphics = new Graphics();
  app.stage.addChild(tempGraphics);

  const remoteGraphics = new Graphics();
  app.stage.addChild(remoteGraphics);

  window.addEventListener("resize", () => {
    canvasRect = app.canvas.getBoundingClientRect();
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;
  });

  const getBrush = () => useBrushStore.getState();
  const { layers } = useBrushStore.getState();
  layers.forEach((l) => createPixiLayer(l.id));
  window.addEventListener("resize", () => {
    canvasRect = app.canvas.getBoundingClientRect();
    Object.keys(layersMap).forEach((id, index) => {
      const oldRT = layersMap[id];
      const newRT = RenderTexture.create({
        width: app.renderer.width,
        height: app.renderer.height,
      });
      const tempSprite = new Sprite(oldRT);
      app.renderer.render({
        container: tempSprite,
        target: newRT,
        clear: true,
      });

      layersMap[id] = newRT;
      (layersContainer.children[index] as Sprite).texture = newRT;
      oldRT.destroy(true);
    });
  });
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

    const { brushColor, brushSize, activeLayerId } = getBrush();

    drawStroke(
      {
        points: [...pendingPoints],
        color: brushColor,
        size: brushSize,
        layerId: activeLayerId,
      },
      true
    );
    socket.emit("draw-progress", {
      points: [...pendingPoints],
      color: brushColor,
      size: brushSize,
      layerId: activeLayerId,
    });

    tempGraphics.clear();

    if (pendingPoints.length >= 2) {
      const firstPoint = pendingPoints[0];
      tempGraphics.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < pendingPoints.length - 1; i++) {
        const currentPoint = pendingPoints[i];
        const nextPoint = pendingPoints[i + 1];

        const midX = (currentPoint.x + nextPoint.x) / 2;
        const midY = (currentPoint.y + nextPoint.y) / 2;

        tempGraphics.quadraticCurveTo(
          currentPoint.x,
          currentPoint.y,
          midX,
          midY
        );
      }

      const lastPoint = pendingPoints[pendingPoints.length - 1];
      tempGraphics.lineTo(lastPoint.x, lastPoint.y);

      tempGraphics.stroke({
        color: brushColor,
        width: brushSize,
        cap: "round",
        join: "round",
      });
    } else if (pendingPoints.length === 1) {
      const point = pendingPoints[0];
      tempGraphics.circle(point.x, point.y, brushSize / 2);
      tempGraphics.fill({ color: brushColor });
    }
  }

  app.canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
    const { x, y } = getMousePos(e);
    pendingPoints.length = 0;
    lastPoint = null;
    useBrushStore.getState().addUsedColor(getBrush().brushColor);
    addPoint(x, y);
  });

  document.addEventListener("mouseup", () => {
    mouseDown = false;
    commitStroke();
  });

  document.addEventListener("mousemove", (e) => {
    socket.emit("user-move", { position:getMousePosPercent(e) });
    if (!mouseDown) return;

    const { x, y } = getMousePos(e);

    addPoint(x, y);
  });

  function commitStroke() {
    if (pendingPoints.length === 0) return;
    processStroke();
    const { activeLayerId } = useBrushStore.getState();
    app.renderer.render({
      container: tempGraphics,
      target: layersMap[activeLayerId],
      clear: false,
    });

    useBrushStore.getState().addStroke({
      points: [...pendingPoints],
      color: getBrush().brushColor,
      size: getBrush().brushSize,
      layerId: activeLayerId,
    });

    tempGraphics.clear();
    pendingPoints.length = 0;
    lastPoint = null;
  }

  function getMousePos(e: MouseEvent) {
    const scaleX = app.renderer.width / canvasRect.width;
    const scaleY = app.renderer.height / canvasRect.height;

    return {
      x: (e.clientX - canvasRect.left) * scaleX,
      y: (e.clientY - canvasRect.top) * scaleY,
    };
  }
  function getMousePosPercent(e: MouseEvent) {
     return {
    x: (e.clientX / window.innerWidth) * 100,
    y: (e.clientY / window.innerHeight) * 100,
  };
  }
  socket.on("request-state", ({ from }) => {
    const state = useBrushStore.getState();
    socket.emit("send-state", { to: from, state: { strokes: state.strokes } });
  });
  socket.on("init", (state) => {
    console.log("init");
    for (const stroke of state.strokes) {
      drawStroke(stroke);
    }
  });
  socket.on("draw-progress", (stroke) => {
    if (stroke.senderId === socket.id) return;
    drawStroke(stroke);
  });
  socket.emit("draw-progress", {
    points: [...pendingPoints],
    color: getBrush().brushColor,
    size: getBrush().brushSize,
    layerId: useBrushStore.getState().activeLayerId,
  });
  function drawStroke(strokeData: Stroke, isLocal = false) {
    const { points, color, size, layerId } = strokeData;
    if (!layersMap[layerId]) return;

    const graphics = isLocal ? tempGraphics : remoteGraphics;

    graphics.clear();

    if (points.length >= 2) {
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        graphics.quadraticCurveTo(current.x, current.y, midX, midY);
      }
      const last = points[points.length - 1];
      graphics.lineTo(last.x, last.y);
      graphics.stroke({ color, width: size, cap: "round", join: "round" });
    } else if (points.length === 1) {
      graphics.circle(points[0].x, points[0].y, size / 2);
      graphics.fill({ color });
    }

    app.renderer.render({
      container: graphics,
      target: layersMap[layerId],
      clear: false,
    });

    if (!isLocal) graphics.clear(); // Optionally clear remoteGraphics after rendering
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
