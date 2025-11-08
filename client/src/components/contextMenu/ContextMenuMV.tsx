import { useEffect, useState } from "react";
import { canvasSize, layersCanvasMap } from "../../helpers/canvasHelpers";
import { useBrushStore } from "../../zustand/useBrushStore";
import {
  createLayerCanvas,
  redrawAllLayers,
  redrawLayer,
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
    const store = useBrushStore.getState();

    try {
      if (file.type === "application/json") {
        const text = await file.text();
        const data = JSON.parse(text);

        if (Array.isArray(data.layers)) {
          store.setLayers(data.layers);
          for (const layer of data.layers) {
            createLayerCanvas(layer.id);

            if (layer.imageDataUrl) {
              const img = new Image();
              img.src = layer.imageDataUrl;
              img.onload = () => {
                const entry = layersCanvasMap[layer.id];
                if (entry) {
                  entry.image = img;
                  redrawLayer(layer.id);
                }
              };
            }
          }
        }
        if (Array.isArray(data.strokes)) {
          store.setStrokes(data.strokes);
        }

        redrawAllLayers();
        setMenuOpen(false);
        return;
      }

      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
          const layerId = `imported-${crypto.randomUUID()}`;
          store.addLayer("Imported Image", layerId);
          createLayerCanvas(layerId);

          const entry = layersCanvasMap[layerId];
          if (!entry) return;
          entry.image = img;

          const canvas = entry.canvas;
          const ctx = entry.ctx;

          canvas.width = canvasSize.width;
          canvas.height = canvasSize.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const offsetX = (canvas.width - img.width) / 2;
          const offsetY = (canvas.height - img.height) / 2;
          ctx.drawImage(img, offsetX, offsetY);

          const tempCanvas = document.createElement("canvas");
          const maxDimension = 1920; 
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, width, height);
            const imageDataUrl = tempCanvas.toDataURL("image/jpeg", 0.8);
            store.setLayerImage(layerId, imageDataUrl);
          }

          redrawLayer(layerId);
          URL.revokeObjectURL(img.src);
          setMenuOpen(false);
        };
        return;
      }

      console.warn("Unsupported file type:", file.type);
    } catch (err) {
      console.error("Failed to load file:", err);
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
