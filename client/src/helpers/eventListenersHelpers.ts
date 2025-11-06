import { canvasScale, onlineStatus, socket } from "../Main";
import { useBrushStore } from "../zustand/useBrushStore";
import {
  canvasSize,
  getCanvasContainer,
  layersCanvasMap,
} from "./canvasHelpers";
import {
  addPoint,
  clampCanvasOffset,
  clearLayerCanvas,
  commitStroke,
  findLastLocalStroke,
  getMousePosPercentOnElement,
  redrawAllLayers,
} from "./drawingHelpers";

const allowedKeys = { ctrl: "ControlLeft", z: "KeyZ", y: "KeyY" };
const keysDown = { ctrl: false, z: false };
export function addListeners(topInputCanvas: HTMLCanvasElement) {
  document.addEventListener("mouseup", () => {
    useBrushStore.getState().setMouseDown(false);
    commitStroke();
  });

  document.addEventListener("mousemove", (e) => {
    if (!topInputCanvas) return;

    if (onlineStatus.inRoom)
      socket.emit("user-move", {
        position: getMousePosPercentOnElement(e, topInputCanvas),
      });
    if (!useBrushStore.getState().isMouseDown) return;
    const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);
    addPoint(x, y);
  });

  document.addEventListener("clearCanvas", () => {
    useBrushStore.getState().clearStrokes();
    for (const id of Object.keys(layersCanvasMap)) {
      clearLayerCanvas(id);
    }
  });
  window.addEventListener("resize", () => {
    clampCanvasOffset();
    redrawAllLayers();
  });
  topInputCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const { offsetX, offsetY, scale } = canvasScale;
    const rect = topInputCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;

    const zoomIntensity = 0.12;
    const zoom = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    let newScale = canvasScale.scale * zoom;
    const container = getCanvasContainer?.();
    const cw = container ? container.clientWidth : window.innerWidth;
    const ch = container ? container.clientHeight : window.innerHeight;

    const minScaleToCover = Math.max(
      cw / canvasSize.width,
      ch / canvasSize.height
    );

    const minScale = Math.min(1, minScaleToCover);

    const maxScale = 6;

    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    canvasScale.offsetX = mouseX - worldX * newScale;
    canvasScale.offsetY = mouseY - worldY * newScale;
    canvasScale.scale = newScale;
    clampCanvasOffset();
    redrawAllLayers();
  });

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    globalThis.dispatchEvent(
      new CustomEvent("canvas-rightclick", {
        detail: { x: e.clientX, y: e.clientY },
      })
    );
  });

  topInputCanvas.addEventListener("pointerdown", (e) => {
    if (e.button === 1) {
      e.preventDefault();
      canvasScale.isPanning = true;
      canvasScale.lastPanX = e.clientX;
      canvasScale.lastPanY = e.clientY;
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  });
  topInputCanvas.addEventListener("pointermove", (e) => {
    if (!canvasScale.isPanning) return;
    const dx = e.clientX - canvasScale.lastPanX;
    const dy = e.clientY - canvasScale.lastPanY;
    canvasScale.lastPanX = e.clientX;
    canvasScale.lastPanY = e.clientY;
    canvasScale.offsetX += dx;
    canvasScale.offsetY += dy;
    clampCanvasOffset();
    redrawAllLayers();
  });
  const stopPan = (e: PointerEvent) => {
    if (!canvasScale.isPanning) return;
    canvasScale.isPanning = false;
    try {
      (e.target as Element).releasePointerCapture((e as any).pointerId);
    } catch {}
  };
  topInputCanvas.addEventListener("pointerup", stopPan);
  topInputCanvas.addEventListener("pointercancel", stopPan);

  document.addEventListener("keydown", (e) => {
    if (e.code === allowedKeys.ctrl && !keysDown.ctrl) {
      keysDown.ctrl = true;
    } else if (e.code === allowedKeys.z && keysDown.ctrl) {
      const lastLocalStroke = findLastLocalStroke();
      if (!lastLocalStroke) return;

      useBrushStore.getState().removeStroke(lastLocalStroke);
      if (onlineStatus.inRoom)
        socket.emit("delete-stroke", { deleteStroke: lastLocalStroke });
    } else if (e.code === allowedKeys.y && keysDown.ctrl) {
      const reAssignedStroke = findStrokeToReassign();
      if (!reAssignedStroke) return;
      useBrushStore.getState().reAssignStroke(reAssignedStroke.strokeId);
      useBrushStore.getState().addStroke(reAssignedStroke);
      if (onlineStatus.inRoom)
        socket.emit("draw-progress", { ...reAssignedStroke });
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === allowedKeys.ctrl) {
      keysDown.ctrl = false;
    }
  });
}
const findStrokeToReassign = () => {
  const removedStrokesArray = useBrushStore.getState().removedStrokesArray;
  if (removedStrokesArray.length < 1) return;
  const lockedLayersIds = useBrushStore.getState().lockedLayersIds;
  return removedStrokesArray.find(
    (stroke) => !lockedLayersIds.has(stroke.layerId)
  );
};
