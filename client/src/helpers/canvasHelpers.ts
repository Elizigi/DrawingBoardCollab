import { useBrushStore } from "../zustand/useBrushStore.ts";
import { createLayerCanvas } from "./drawingHelpers.ts"; 

// --- Constants ---
export const canvasSize = { width: 1920, height: 1080 };
export const STROKE_THROTTLE = 16;

// --- Global Canvas Map (Exported for access by drawing logic) ---
export const layersCanvasMap: Record<
  string,
  { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
> = {};

// --- Private Module Variables for DOM Elements (No export let!) ---
let containerEl: HTMLDivElement | null = null;
let topInputCanvas!: HTMLCanvasElement;
let localTempCanvas: HTMLCanvasElement | null = null;
let remoteTempCanvas: HTMLCanvasElement | null = null;

// --- Public Getter Functions for Private DOM Elements ---

export function getTopInputCanvas(): HTMLCanvasElement {
  return topInputCanvas;
}

export function getLocalTempCanvas(): HTMLCanvasElement | null {
  return localTempCanvas;
}

export function getRemoteTempCanvas(): HTMLCanvasElement | null {
  return remoteTempCanvas;
}

// --- Setup Function (Sets the private module variables) ---

export function setupDOMAndCanvases(rotElement: HTMLDivElement | null) {
  if (!rotElement) return; // 1. Create and append the main container

  containerEl = document.createElement("div");
  containerEl.style.position = "relative";
  containerEl.style.width = canvasSize.width + "px";
  containerEl.style.height = canvasSize.height + "px";
  rotElement.appendChild(containerEl);

  const { layers } = useBrushStore.getState(); // 2. Create the initial layers (uses a function from the drawing file)
  layers.forEach((l) => createLayerCanvas(l.id, containerEl)); // 3. Create the temporary canvases

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
  containerEl.appendChild(localTempCanvas); // 4. Create the topmost input canvas

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

// NOTE: We need to expose a helper function to let other modules access the container for new layer creation
export function getCanvasContainer(): HTMLDivElement | null {
  return containerEl;
}
