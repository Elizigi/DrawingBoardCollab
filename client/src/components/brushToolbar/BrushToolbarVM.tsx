import React, { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";

const BrushToolbarVM = () => {
  const minAngle = -230;
  const maxAngle = -50;
  const angleRange = maxAngle - minAngle;

  const brushColor = useBrushStore((state) => state.brushColor);
  const brushSize = useBrushStore((state) => state.brushSize);
  const brushOpacity = useBrushStore((state) => state.brushOpacity);

  const setBrushColor = useBrushStore((state) => state.setBrushColor);
  const setOpacity = useBrushStore((state) => state.setOpacity);

  function changeColor(_: number, e: React.ChangeEvent<HTMLInputElement>) {
    const newColor = Number.parseInt(e.target.value.slice(1), 16);
    setBrushColor(newColor);
  }

  const [isBrushOpen, setIsBrushOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const opacitySliderRef = useRef<HTMLDivElement>(null);

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
      const angle = normalized * angleRange + minAngle;
      opacitySliderRef.current.style.transform = ` rotate(${angle}deg)`;
    }
  }, [isBrushOpen, brushOpacity]);

  const handleTransparentAdjustment = () => {
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

      adjustedAngle = Math.max(minAngle, Math.min(maxAngle, adjustedAngle));
      const normalized = (adjustedAngle - minAngle) / angleRange;
      const size = Math.round(normalized * 99) + 1;

      setOpacity(size);
      opacitySlider.style.transform = ` rotate(${adjustedAngle}deg)`;
    };

    const handleEnd = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);
  };

  useEffect(() => {
    if (!isBrushOpen) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsBrushOpen(false);
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isBrushOpen, setIsBrushOpen]);
  return {
    brushColor,
    brushSize,
    isBrushOpen,
    opacitySliderRef,
    colorInputRef,
    handleTransparentAdjustment,
    handleColorClick,
    setIsBrushOpen,
    //setBrushSize,
    changeColor,
  };
};

export default BrushToolbarVM;
