import BrushToolbarVM from "./BrushToolbarVM";
import styles from "./BrushToolbar.module.scss";
import { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";

const BrushToolbar = () => {
  const {
    brushColor,
    brushSize,
    usedColors,
    brushOpacity,

    setOpacity,
    setBrushColor,
    setBrushSize,
    changeColor,
  } = BrushToolbarVM();
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
      const angle = normalized * 125 + -205;
      opacitySliderRef.current.style.transform = `translate(-2.75rem, -2.75rem) rotate(${angle}deg)`;
    }
  }, [isBrushOpen, brushOpacity]);

  const handleTransparentAdjustment = () => {
    const opacitySlider = opacitySliderRef.current;
    if (!opacitySlider) return;
    const rect = opacitySlider.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - centerX;
      const deltaY = moveEvent.clientY - centerY;

      let mouseAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      if (mouseAngle > 0) mouseAngle -= 360;
      let adjustedAngle = mouseAngle;

      adjustedAngle = Math.max(-205, Math.min(-80, adjustedAngle));
      const normalized = (adjustedAngle - -205) / (-80 - -205);
      const size = Math.round(normalized * 99) + 1;

      setOpacity(size);
      opacitySlider.style.transform = `translate(-2.75rem, -2.75rem) rotate(${adjustedAngle}deg)`;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className={styles.brushToolbar}>
      {isBrushOpen && (
        <>
          <div className={styles.colorOfSlider}></div>

          <div className={styles.sizeSetBar} ref={opacitySliderRef}>
            <button
              className={styles.sizeHandle}
              onMouseDown={() => handleTransparentAdjustment()}
            ></button>
          </div>
          <input
            className={styles.brushSizeInput}
            type="range"
            min={1}
            max={100}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </>
      )}
      <div className={styles.blackBorderWrapper}>
        {isBrushOpen ? (
          <button
            className={styles.brushIcon}
            style={{
              backgroundColor: `#${brushColor.toString(16).padStart(6, "0")}`,
            }}
            onClick={handleColorClick}
            aria-label="Open color picker"
          >
            <div className={styles.brushSizeDisplay}>
              <h3>{brushOpacity}</h3>
            </div>
          </button>
        ) : (
          <button
            className={styles.brushIcon}
            style={{
              border: `4px solid #${brushColor.toString(16).padStart(6, "0")}`,
            }}
            onClick={() => setIsBrushOpen(true)}
          >
            <img src="/brushIcon.svg" alt="Brush" />
          </button>
        )}
        {isBrushOpen && (
          <input
            ref={colorInputRef}
            type="color"
            style={{ opacity: 0, pointerEvents: "none" }}
            value={`#${brushColor.toString(16).padStart(6, "0")}`}
            onChange={(e) => changeColor(brushColor, e)}
            onBlur={() => setIsBrushOpen(false)}
          />
        )}
      </div>

      {isBrushOpen && usedColors[0] !== null && (
        <div className={styles.colorMenu}>
          {usedColors.map(
            (color, index) =>
              color && (
                <button
                  key={`${color}-${index}`}
                  className={styles.pastColorElement}
                  style={{
                    backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
                  }}
                  onClick={() => setBrushColor(color)}
                ></button>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default BrushToolbar;
