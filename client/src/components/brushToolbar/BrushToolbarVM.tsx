import React from "react";
import { useBrushStore } from "../../zustand/useBrushStore";

const BrushToolbarVM = () => {
  const brushColor = useBrushStore((state) => state.brushColor);
  const brushSize = useBrushStore((state) => state.brushSize);

  const setBrushColor = useBrushStore((state) => state.setBrushColor);
  const setBrushSize = useBrushStore((state) => state.setBrushSize);

  const usedColors = useBrushStore((state) => state.usedColors);

  function changeColor(_: number, e: React.ChangeEvent<HTMLInputElement>) {
    const newColor = parseInt(e.target.value.slice(1), 16);
    setBrushColor(newColor);
  }
  return  {
    brushColor,
    brushSize,
    usedColors,

    setBrushColor,
    setBrushSize,
    changeColor,
  };
};

export default BrushToolbarVM;
