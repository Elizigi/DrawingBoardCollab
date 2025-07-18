import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { Application } from "pixi.js";

const rootElement = document.getElementById("root");

(async () => {
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0xff000
  });
  document.body.appendChild(app.canvas);
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
