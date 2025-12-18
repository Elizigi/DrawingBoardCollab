import { useBrushStore } from "../../../zustand/useBrushStore";

const BrushScaleButtonsMV = () => {
  const setBrushSize = useBrushStore((state) => state.setBrushSize);
  const brushSize = useBrushStore((state) => state.brushSize);

  const scaleUp = () => {
    if (brushSize > 98) return;
    setBrushSize(brushSize + 1);
  };
  const scaleDown = () => {
    if (brushSize < 2) return;

    setBrushSize(brushSize - 1);
  };

  return { scaleUp, scaleDown };
};

export default BrushScaleButtonsMV;
