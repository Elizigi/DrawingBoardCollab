import { onlineStatus, socket } from "../Main";
import { useBrushStore } from "../zustand/useBrushStore";
import { layersCanvasMap } from "./canvasHelpers";
import {
  addPoint,
  clearLayerCanvas,
  commitStroke,
  getMousePosPercentOnElement,
} from "./drawingHelpers";

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
    Object.keys(layersCanvasMap).forEach((id) => clearLayerCanvas(id));
  });
}
