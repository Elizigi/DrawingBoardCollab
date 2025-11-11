import { canvasScale, socket } from "../Main";
import { useBrushStore } from "../zustand/useBrushStore";
import { useOnlineStatus } from "../zustand/useOnlineStatus";
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
  getTouchPosPercent,
  redrawAllLayers,
} from "./drawingHelpers";
export const transformSettings = {
  isDraggingImage: false,
  isResizingImage: false,
  resizeHandle: null as "tl" | "tr" | "bl" | "br" | null,
  dragStartPos: { x: 0, y: 0 },
  initialTransform: { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
};

const allowedKeys = { ctrl: "ControlLeft", z: "KeyZ", y: "KeyY" };
const keysDown = { ctrl: false, z: false };
export function addListeners(
  topInputCanvas: HTMLCanvasElement,
  rotElement: HTMLDivElement
) {
  document.addEventListener("mouseup", () => {
    useBrushStore.getState().setMouseDown(false);
    commitStroke();

    transformSettings.isDraggingImage = false;
    transformSettings.isResizingImage = false;
    transformSettings.resizeHandle = null;
  });

  document.addEventListener("mousemove", (e) => {
    if (!topInputCanvas) return;
    const { inRoom } = useOnlineStatus.getState();
    const state = useBrushStore.getState();

    if (inRoom)
      socket.emit("user-move", {
        position: getMousePosPercentOnElement(e, topInputCanvas),
      });

    const activeLayer = state.layers.find((l) => l.id === state.activeLayerId);
    if (
      activeLayer?.imageDataUrl &&
      activeLayer.transform &&
      (transformSettings.isDraggingImage || transformSettings.isResizingImage)
    ) {
      const rect = topInputCanvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const mouseX = (clientX - canvasScale.offsetX) / canvasScale.scale;
      const mouseY = (clientY - canvasScale.offsetY) / canvasScale.scale;

      if (transformSettings.isDraggingImage) {
        const dx = mouseX - transformSettings.dragStartPos.x;
        const dy = mouseY - transformSettings.dragStartPos.y;
        state.updateLayerTransform(state.activeLayerId!, {
          ...activeLayer.transform,
          x: transformSettings.initialTransform.x + dx,
          y: transformSettings.initialTransform.y + dy,
        });
        redrawAllLayers();
        return;
      } else if (
        transformSettings.isResizingImage &&
        transformSettings.resizeHandle
      ) {
        const dx = mouseX - transformSettings.dragStartPos.x;
        const dy = mouseY - transformSettings.dragStartPos.y;

        let newTransform = { ...transformSettings.initialTransform };

        switch (transformSettings.resizeHandle) {
          case "br":
            newTransform.width = Math.max(
              20,
              transformSettings.initialTransform.width + dx
            );
            newTransform.height = Math.max(
              20,
              transformSettings.initialTransform.height + dy
            );
            break;
          case "bl":
            newTransform.width = Math.max(
              20,
              transformSettings.initialTransform.width - dx
            );
            newTransform.height = Math.max(
              20,
              transformSettings.initialTransform.height + dy
            );
            newTransform.x = transformSettings.initialTransform.x + dx;
            break;
          case "tr":
            newTransform.width = Math.max(
              20,
              transformSettings.initialTransform.width + dx
            );
            newTransform.height = Math.max(
              20,
              transformSettings.initialTransform.height - dy
            );
            newTransform.y = transformSettings.initialTransform.y + dy;
            break;
          case "tl":
            newTransform.width = Math.max(
              20,
              transformSettings.initialTransform.width - dx
            );
            newTransform.height = Math.max(
              20,
              transformSettings.initialTransform.height - dy
            );
            newTransform.x = transformSettings.initialTransform.x + dx;
            newTransform.y = transformSettings.initialTransform.y + dy;
            break;
        }

        state.updateLayerTransform(state.activeLayerId!, newTransform);
        redrawAllLayers();
        return;
      }
    }

    if (!useBrushStore.getState().isMouseDown) return;
    const { x, y } = getMousePosPercentOnElement(e, topInputCanvas);
    addPoint(x, y);
  });

  topInputCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const { x, y } = getTouchPosPercent(touch, topInputCanvas);
    useBrushStore.getState().setMouseDown(true);
    addPoint(x, y);
  });

  topInputCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const { inRoom } = useOnlineStatus.getState();
    const { x, y } = getTouchPosPercent(touch, topInputCanvas);

    if (inRoom) socket.emit("user-move", { position: { x, y } });

    if (!useBrushStore.getState().isMouseDown) return;
    addPoint(x, y);
  });

  topInputCanvas.addEventListener("touchend", () => {
    useBrushStore.getState().setMouseDown(false);
    commitStroke();
  });

  topInputCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const { inRoom } = useOnlineStatus.getState();
    if (inRoom)
      socket.emit("user-move", {
        position: getTouchPosPercent(touch, topInputCanvas),
      });

    if (!useBrushStore.getState().isMouseDown) return;

    const { x, y } = getTouchPosPercent(touch, topInputCanvas);
    addPoint(x, y);
  });

  topInputCanvas.addEventListener("touchend", () => {
    useBrushStore.getState().setMouseDown(false);
    commitStroke();
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

  rotElement.addEventListener("contextmenu", (e) => {
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
    const { inRoom } = useOnlineStatus.getState();

    if (e.code === allowedKeys.ctrl && !keysDown.ctrl) {
      keysDown.ctrl = true;
    } else if (e.code === allowedKeys.z && keysDown.ctrl) {
      const lastLocalStroke = findLastLocalStroke();
      if (!lastLocalStroke) return;

      useBrushStore.getState().removeStroke(lastLocalStroke);
      if (inRoom)
        socket.emit("delete-stroke", { deleteStroke: lastLocalStroke });
    } else if (e.code === allowedKeys.y && keysDown.ctrl) {
      const reAssignedStroke = findStrokeToReassign();
      if (!reAssignedStroke) return;
      useBrushStore.getState().reAssignStroke(reAssignedStroke.strokeId);
      useBrushStore.getState().addStroke(reAssignedStroke);
      if (inRoom) socket.emit("draw-progress", { ...reAssignedStroke });
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
