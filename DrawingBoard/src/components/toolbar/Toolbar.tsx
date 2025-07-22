import { useBrushStore } from "../../zustand/useBrushStore";
import styles from "./Toolbar.module.scss";

export const Toolbar = () => {
  const brushColor = useBrushStore((state) => state.brushColor);
  const brushSize = useBrushStore((state) => state.brushSize);
  const setBrushColor = useBrushStore((state) => state.setBrushColor);
  const setBrushSize = useBrushStore((state) => state.setBrushSize);
  const usedColors = useBrushStore((state) => state.usedColors);

  function changeColor(_: number, e: React.ChangeEvent<HTMLInputElement>) {
    const newColor = parseInt(e.target.value.slice(1), 16);
    setBrushColor(newColor);
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.mainToolContainer}>
          <input
            type="color"
            className={styles.currentColorBox}
            value={`#${brushColor.toString(16).padStart(6, "0")}`}
            onChange={(e) => changeColor(brushColor, e)}
          />
          <input
            type="range"
            min={1}
            max={100}
            className={styles.currentWidthSlider}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>

        <div className={styles.toolContainer}>
          {usedColors.map((color) => (
            <button
              key={color}
              className={styles.colorBox}
              style={{
                backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
              }}
              onClick={() => setBrushColor(color)}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};
