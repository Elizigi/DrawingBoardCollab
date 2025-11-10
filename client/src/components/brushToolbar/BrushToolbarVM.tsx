import React, { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
enum TextTarget {
  Opacity = "opacity",
  BrushSize = "brushSize",
}
const BrushToolbarVM = () => {
  const brushColor = useBrushStore((state) => state.brushColor);
  const brushSize = useBrushStore((state) => state.brushSize);
  const brushOpacity = useBrushStore((state) => state.brushOpacity);

  const setBrushColor = useBrushStore((state) => state.setBrushColor);
  const setBrushSize = useBrushStore((state) => state.setBrushSize);
  const setOpacity = useBrushStore((state) => state.setOpacity);

  const usedColors = useBrushStore((state) => state.usedColors);

  function changeColor(_: number, e: React.ChangeEvent<HTMLInputElement>) {
    const newColor = Number.parseInt(e.target.value.slice(1), 16);
    setBrushColor(newColor);
  }

  const [isBrushOpen, setIsBrushOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const opacitySliderRef = useRef<HTMLDivElement>(null);
  const [textTarget, setTextTarget] = useState<null | TextTarget>(TextTarget.BrushSize);

  const isMouseDown = useBrushStore((s) => s.isMouseDown);
  const handleColorClick = () => {
    colorInputRef.current?.click();
  };

  useEffect(() => {
    if (isBrushOpen) {
      setIsBrushOpen(false);
    }
  }, [isMouseDown]);

  useEffect(() => {
    if (isBrushOpen && opacitySliderRef.current) {
      const normalized = (brushOpacity - 1) / 99;
      const angle = normalized * 125 + -205;
      opacitySliderRef.current.style.transform = `translate(-2.75rem, -2.75rem) rotate(${angle}deg)`;
    }
  }, [isBrushOpen, brushOpacity]);

  const handleTransparentAdjustment = () => {
    setTextTarget(TextTarget.Opacity);

    const opacitySlider = opacitySliderRef.current;
    if (!opacitySlider) return;
    const rect = opacitySlider.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault();
      const clientX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX;
      const clientY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      let mouseAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      if (mouseAngle > 0) mouseAngle -= 360;
      let adjustedAngle = mouseAngle;

      adjustedAngle = Math.max(-205, Math.min(-80, adjustedAngle));
      const normalized = (adjustedAngle - -205) / (-80 - -205);
      const size = Math.round(normalized * 99) + 1;

      setOpacity(size);
      opacitySlider.style.transform = `translate(-2.75rem, -2.75rem) rotate(${adjustedAngle}deg)`;
    };

    const handleEnd = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      setTextTarget(TextTarget.BrushSize);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);
  };

  const displayValue = () => {
    if (textTarget === TextTarget.Opacity) return brushOpacity;
    if (textTarget === TextTarget.BrushSize) return brushSize;
    return "";
  };
  return {
    brushColor,
    brushSize,
    usedColors,
    brushOpacity,
    isBrushOpen,
    textTarget,
    opacitySliderRef,
    TextTarget,
    colorInputRef,
    handleTransparentAdjustment,
    setTextTarget,
    handleColorClick,
    displayValue,
    setIsBrushOpen,
    setBrushColor,
    setBrushSize,
    changeColor,
  };
};

export default BrushToolbarVM;
