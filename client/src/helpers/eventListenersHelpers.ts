import { onlineStatus, socket } from "../Main";
import { useBrushStore } from "../zustand/useBrushStore";
import { layersCanvasMap } from "./canvasHelpers";
import {
  addPoint,
  clearLayerCanvas,
  commitStroke,
  findLastLocalStroke,
  getMousePosPercentOnElement,
} from "./drawingHelpers";

const allowedKeys = { ctrl: "ControlLeft", zed: "KeyZ" };
const keysDown = { ctrl: false, zed: false };
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

  document.addEventListener("keydown", (e) => {
    if (e.code === allowedKeys.ctrl) {
      keysDown.ctrl = true;
    }
    if (e.code === allowedKeys.zed && keysDown.ctrl) {
      const lastLocalStroke = findLastLocalStroke();
      if (!lastLocalStroke) return;

      useBrushStore.getState().removeStroke(lastLocalStroke);
      if (onlineStatus.inRoom)
        socket.emit("delete-stroke", { deleteStroke: lastLocalStroke });
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === allowedKeys.ctrl) {
      keysDown.ctrl = false;
    }
  });
}
