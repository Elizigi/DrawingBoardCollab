import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { Application, Graphics } from "pixi.js";
const rootElement = document.getElementById("root") as HTMLDivElement;

let mouseDown = false;
let pendingPoints: { x: number; y: number }[] = [];
let lastStrokeTime = 0;

const strokeStyle = { color: 0xff0000, width: 2 };
const STROKE_THROTTLE = 16;

(async () => {
  const app = new Application();
  await app.init({ resizeTo: window, backgroundColor: 0xffffff });
  rootElement.appendChild(app.canvas);

  let canvasRect = app.canvas.getBoundingClientRect();
  const drawingLayer = new Graphics();
  app.stage.addChild(drawingLayer);

  window.addEventListener("resize", () => {
    canvasRect = app.canvas.getBoundingClientRect();
  });

  app.ticker.add(() => {
    const now = Date.now();
    if (pendingPoints.length > 0 && now - lastStrokeTime > STROKE_THROTTLE) {
      for (const point of pendingPoints) {
        drawingLayer.lineTo(point.x, point.y);
      }
      drawingLayer.stroke(strokeStyle);
      pendingPoints.length = 0;
      lastStrokeTime = now;
    }
  });

  document.addEventListener("mousedown", (e) => {
    mouseDown = true;
    const { x, y } = getMousePos(e);
    drawingLayer.moveTo(x, y);
    pendingPoints.length = 0;
  });

  document.addEventListener("mouseup", () => {
    mouseDown = false;
    flushPending();
  });

  document.addEventListener("mousemove", (e) => {
    if (!mouseDown) return;
    const { x, y } = getMousePos(e);
    pendingPoints.push({ x, y });
  });

  function flushPending() {
    if (pendingPoints.length === 0) return;
    for (const point of pendingPoints) drawingLayer.lineTo(point.x, point.y);
    drawingLayer.stroke(strokeStyle);
    pendingPoints.length = 0;
  }

  function getMousePos(e: MouseEvent) {
    return {
      x: Math.max(0, Math.min(e.clientX - canvasRect.left, app.canvas.width)),
      y: Math.max(0, Math.min(e.clientY - canvasRect.top, app.canvas.height)),
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
