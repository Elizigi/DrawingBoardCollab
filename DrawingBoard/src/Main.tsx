import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { Application, Graphics } from "pixi.js";

const rootElement = document.getElementById("root") as HTMLDivElement;

(async () => {
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0xffffff,
  });
  rootElement.appendChild(app.canvas);
  const drawing = new Graphics();
  drawing
    .circle(150, 150, 50)
    .fill({ color: 0x00ff00 })
    .beginPath()
    .circle(250, 150, 50)
    .fill({ color: 0x0000ff });
  app.stage.addChild(drawing);
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
