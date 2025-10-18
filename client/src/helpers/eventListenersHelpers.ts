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
      const removedStrokesArray = useBrushStore.getState().removedStrokesArray;

      if (removedStrokesArray.length < 1) return;
      const reAssignedStroke = removedStrokesArray[0];
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
