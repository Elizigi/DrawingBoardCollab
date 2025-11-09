import { useBrushStore } from "../zustand/useBrushStore.ts";
import { createLayerCanvas, redrawAllLayers } from "./drawingHelpers.ts";

export const canvasSize = { width: 1920, height: 1080 };
export const STROKE_THROTTLE = 16;

export const layersCanvasMap: Record<
  string,
  { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D,  image?: HTMLImageElement; }
> = {};

let containerEl: HTMLDivElement | null = null;
let topInputCanvas!: HTMLCanvasElement;
let localTempCanvas: HTMLCanvasElement | null = null;
let remoteTempCanvas: HTMLCanvasElement | null = null;

export function getTopInputCanvas(): HTMLCanvasElement {
  return topInputCanvas;
}

export function getLocalTempCanvas(): HTMLCanvasElement | null {
  return localTempCanvas;
}

export function getRemoteTempCanvas(): HTMLCanvasElement | null {
  return remoteTempCanvas;
}

export function resizeAllCanvases(width: number, height: number) {
  if (containerEl) {
    containerEl.style.width = width + "px";
    containerEl.style.height = height + "px";
  }

  for (const entry of Object.values(layersCanvasMap)) {
    entry.canvas.width = width;
    entry.canvas.height = height;
  }

  if (localTempCanvas) {
    localTempCanvas.width = width;
    localTempCanvas.height = height;
  }

  if (remoteTempCanvas) {
    remoteTempCanvas.width = width;
    remoteTempCanvas.height = height;
  }

  if (topInputCanvas) {
    topInputCanvas.width = width;
    topInputCanvas.height = height;
  }

  redrawAllLayers();
}
export function setupDOMAndCanvases(rotElement: HTMLDivElement | null) {
  if (!rotElement) return;

  containerEl = document.createElement("div");
  containerEl.style.position = "relative";
  containerEl.style.width = canvasSize.width + "px";
  containerEl.style.height = canvasSize.height + "px";
  rotElement.appendChild(containerEl);

  const { layers } = useBrushStore.getState();
  
  for (const layer of layers) createLayerCanvas(layer.id, containerEl);

  remoteTempCanvas = document.createElement("canvas");
  remoteTempCanvas.width = canvasSize.width;
  remoteTempCanvas.height = canvasSize.height;
  remoteTempCanvas.style.position = "absolute";
  remoteTempCanvas.style.top = "0";
  remoteTempCanvas.style.left = "0";
  remoteTempCanvas.style.pointerEvents = "none";
  containerEl.appendChild(remoteTempCanvas);
  

  localTempCanvas = document.createElement("canvas");
  localTempCanvas.width = canvasSize.width;
  localTempCanvas.height = canvasSize.height;
  localTempCanvas.style.position = "absolute";
  localTempCanvas.style.top = "0";
  localTempCanvas.style.left = "0";
  localTempCanvas.style.pointerEvents = "none";
  containerEl.appendChild(localTempCanvas);

  topInputCanvas = document.createElement("canvas");
  topInputCanvas.width = canvasSize.width;
  topInputCanvas.height = canvasSize.height;
  topInputCanvas.style.position = "absolute";
  topInputCanvas.style.top = "0";
  topInputCanvas.style.left = "0";
  topInputCanvas.style.cursor = "crosshair";
  topInputCanvas.style.pointerEvents = "auto";
  containerEl.appendChild(topInputCanvas);
}

export function getCanvasContainer(): HTMLDivElement | null {
  return containerEl;
}
