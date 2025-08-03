import BrushToolbarVM from "./BrushToolbarVM";
import styles from "./BrushToolbar.module.scss";
import { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";

const BrushToolbar = () => {
  const {
    brushColor,
    brushSize,
    usedColors,

    setBrushColor,
    setBrushSize,
    changeColor,
  } = BrushToolbarVM();
  const [isBrushOpen, setIsBrushOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colorSliderRef = useRef<HTMLDivElement>(null);

  const strokes = useBrushStore((s) => s.strokes);
  const handleColorClick = () => {
    colorInputRef.current?.click();
  };
  useEffect(() => {
    if (isBrushOpen) {
      setIsBrushOpen(false);
    }
  }, [strokes.length]);
  useEffect(() => {
    if (isBrushOpen && colorSliderRef.current) {
      const normalized = (brushSize - 1) / 99;
      const angle = normalized * 125 + -40;
      colorSliderRef.current.style.transform = `translate(-2.75rem, -2.75rem) rotate(${angle - 50}deg)`;
    }
  }, [isBrushOpen, brushSize]);

  const handleSizeAdjustment = () => {
    const colorSlider = colorSliderRef.current;
    if (!colorSlider) return;
    const rect = colorSlider.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - centerX;
      const deltaY = moveEvent.clientY - centerY;
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      angle = Math.max(-40, Math.min(85, angle));

      const normalized = (angle - -40) / (85 - -40);
      const size = Math.round(normalized * 99) + 1;

      setBrushSize(size);
      colorSlider.style.transform = `translate(--2.75rem, -2.75rem) rotate(${angle - 50}deg)`;
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

          <div className={styles.sizeSetBar} ref={colorSliderRef}>
            <button
              className={styles.sizeHandle}
              onMouseDown={() => handleSizeAdjustment()}
            ></button>
          </div>
        </>
      )}
      <div className={styles.blackBorderWrapper}>
        {!isBrushOpen ? (
          <button
            className={styles.brushIcon}
            style={{
              border: `4px solid #${brushColor.toString(16).padStart(6, "0")}`,
            }}
            onClick={() => setIsBrushOpen(true)}
          >
            <img src="/brushIcon.svg" alt="Brush" />
          </button>
        ) : (
          <button
            className={styles.brushIcon}
            style={{
              backgroundColor: `#${brushColor.toString(16).padStart(6, "0")}`,
            }}
            onClick={handleColorClick}
            aria-label="Open color picker"
          />
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
      {isBrushOpen&&usedColors[0]!==null && (
        <div className={styles.colorMenu}>
          {usedColors.map((color, index) =>
            color !== null ? (
              <button
                key={`${color}-${index}`}
                className={styles.pastColorElement}
                style={{
                  backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
                }}
                onClick={() => setBrushColor(color)}
              ></button>
            ) : (
              ""
            )
          )}
        </div>
      )}
    </div>
  );
};

export default BrushToolbar;
