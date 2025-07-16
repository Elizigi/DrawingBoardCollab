import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import "./main.css"
const rootElement = document.getElementById('root');
export const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
export const ctx = canvasElement.getContext('2d')!;

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App  />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found! Make sure you have <div id='root'></div> in your index.html");
}