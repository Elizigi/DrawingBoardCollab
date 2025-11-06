import { useEffect, useState } from "react";
import { layersCanvasMap } from "../../helpers/canvasHelpers";
import { useBrushStore } from "../../zustand/useBrushStore";
import {
  createLayerCanvas,
  redrawAllLayers,
} from "../../helpers/drawingHelpers";

const ContextMenuMV = () => {
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const saveAsJson = () => {
    const state = useBrushStore.getState();
    const data = {
      layers: state.layers,
      strokes: state.strokes,
    };

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing.json";
    link.click();

    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const saveAsPng = () => {
    const allLayers = useBrushStore.getState().layers;
    const canvasSize = {
      width: Object.values(layersCanvasMap)[0]?.canvas.width || 0,
      height: Object.values(layersCanvasMap)[0]?.canvas.height || 0,
    };

    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = canvasSize.width;
    compositeCanvas.height = canvasSize.height;
    const ctx = compositeCanvas.getContext("2d");
    if (!ctx) return;

    for (const layer of allLayers) {
      if (!layer.visible) return;
      const entry = layersCanvasMap[layer.id];
      if (!entry) return;

      ctx.globalAlpha = (layer as any).opacity ?? 1;
      ctx.drawImage(entry.canvas, 0, 0);
    }

    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = compositeCanvas.toDataURL("image/png");
    link.click();
    setMenuOpen(false);
  };
  const loadImage = async (file: File) => {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const store = useBrushStore.getState();

      if (Array.isArray(data.layers)) {
        store.setLayers(data.layers);
        for (const layer of data.layers) createLayerCanvas(layer.id);
      }

      if (Array.isArray(data.strokes)) {
        store.setStrokes(data.strokes);
      }

      redrawAllLayers();
      setMenuOpen(false);
    } catch (err) {
      console.error("Failed to load JSON:", err);
    }
  };

  useEffect(() => {
    const handleCanvasRightClick = (
      e: CustomEvent<{ x: number; y: number }>
    ) => {
      setMenuPos({ x: e.detail.x, y: e.detail.y });
      setMenuOpen(!menuOpen);
    };
    globalThis.addEventListener(
      "canvas-rightclick",
      handleCanvasRightClick as EventListener
    );
    return () =>
      globalThis.removeEventListener(
        "canvas-rightclick",
        handleCanvasRightClick as EventListener
      );
  }, [menuOpen]);

  return { menuPos, menuOpen, saveAsJson, saveAsPng, loadImage };
};

export default ContextMenuMV;
