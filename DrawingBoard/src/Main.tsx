import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { Application, Graphics, RenderTexture, Sprite } from "pixi.js";
import { useBrushStore } from "./zustand/useBrushStore.ts";
const rootElement = document.getElementById("root") as HTMLDivElement;

let mouseDown = false;
let pendingPoints: { x: number; y: number }[] = [];
let lastStrokeTime = 0;
let lastPoint: { x: number; y: number } | null = null;

const STROKE_THROTTLE = 16;

(async () => {
  const app = new Application();
  await app.init({ resizeTo: rootElement, backgroundColor: 0xffffff });
  rootElement.appendChild(app.canvas);

  let canvasRect = app.canvas.getBoundingClientRect();
  const renderTexture = RenderTexture.create({
    width: app.renderer.width,
    height: app.renderer.height,
  });
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

  const drawingSurface = new Sprite(renderTexture);
  app.stage.addChild(drawingSurface);

  const tempGraphics = new Graphics();
  app.stage.addChild(tempGraphics);

  window.addEventListener("resize", () => {
    canvasRect = app.canvas.getBoundingClientRect();
  });

  const getBrush = () => useBrushStore.getState();

  app.ticker.add(() => {
    const now = Date.now();
    if (pendingPoints.length > 0 && now - lastStrokeTime > STROKE_THROTTLE) {
      processStroke();
      lastStrokeTime = now;
    }
  });

  function processStroke() {
    if (pendingPoints.length === 0) return;

    const { brushColor, brushSize } = getBrush();
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
    if (!mouseDown) return;
    const { x, y } = getMousePos(e);
    addPoint(x, y);
  });

  function commitStroke() {
    if (pendingPoints.length === 0) return;
    processStroke();
    app.renderer.render({
      container: tempGraphics,
      target: renderTexture,
      clear: false,
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
