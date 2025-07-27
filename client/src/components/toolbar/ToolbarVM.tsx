import React, { useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";

const ToolbarVM = () => {
  const brushColor = useBrushStore((state) => state.brushColor);
  const brushSize = useBrushStore((state) => state.brushSize);

  const activeLayerId = useBrushStore((state) => state.activeLayerId);
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);

  const allLayers = useBrushStore((state) => state.layers);
  const toggleLayer = useBrushStore((state) => state.toggleLayer);
  const addLayer = useBrushStore((state) => state.addLayer);

  const setBrushColor = useBrushStore((state) => state.setBrushColor);
  const setBrushSize = useBrushStore((state) => state.setBrushSize);

  const usedColors = useBrushStore((state) => state.usedColors);

  const [newLayerName, setNewLayerName] = useState("");
  function changeColor(_: number, e: React.ChangeEvent<HTMLInputElement>) {
    const newColor = parseInt(e.target.value.slice(1), 16);
    setBrushColor(newColor);
  }
  const updateText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLayerName(e.target.value);
  };
  const addNewLayer = () => {
    if (newLayerName.trim().length < 2) return;
    addLayer(newLayerName);
    setNewLayerName("");
  };
  const changeVisible = (id: string) => {
    toggleLayer(id);
  };
  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };
  return {
    brushColor,
    brushSize,
    usedColors,
    newLayerName,
    allLayers,
    activeLayerId,
    updateText,
    changeLayer,
    changeVisible,
    addNewLayer,
    setBrushColor,
    setBrushSize,
    changeColor,
  };
};

export default ToolbarVM;
