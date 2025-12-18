import { useRef } from "react";
import { useBrushStore } from "../../../zustand/useBrushStore";

const BrushScaleButtonsMV = () => {
  const setBrushSize = useBrushStore((state) => state.setBrushSize);
  const getBrushSize = useBrushStore.getState;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startScaleUp = () => {
    if (intervalRef.current) return;

    intervalRef.current = globalThis.setInterval(() => {
      const size = getBrushSize().brushSize;
      if (size < 99) setBrushSize(size + 1);
    }, 75);
  };

  const startScaleDown = () => {
    if (intervalRef.current) return;

    intervalRef.current = globalThis.setInterval(() => {
      const size = getBrushSize().brushSize;
      if (size > 2) setBrushSize(size - 1);
    }, 75);
  };

  const stopScaling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const scaleUp = () => {
    const size = getBrushSize().brushSize;
    if (size > 98) return;
    setBrushSize(size + 1);
  };
  const scaleDown = () => {
    const size = getBrushSize().brushSize;

    if (size < 2) return;
    setBrushSize(size - 1);
  };
  return { stopScaling, startScaleDown, startScaleUp, scaleDown, scaleUp };
};

export default BrushScaleButtonsMV;
