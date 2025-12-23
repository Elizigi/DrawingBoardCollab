import BrushToolbarVM from "./BrushToolbarVM";
import styles from "./BrushToolbar.module.scss";
import BrushScaleButtons from "./brushScaleButtons/BrushScaleButtons";
const BrushToolbar = () => {
  const {
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
  } = BrushToolbarVM();

  return (
    <div className={styles.brushToolbar}>
      {isBrushOpen && (
<svg
  xmlns="http://www.w3.org/2000/svg"
  className={styles.arcSvg}
>
  <circle
    cx="50"
    cy="50"
    r="50"
    className={styles.arcCircle}
  />
</svg>
      )}
      <div className={styles.blackBorderWrapper}>
        {isBrushOpen ? (
          <>
            <button
              className={styles.brushIcon}
              style={{
                backgroundColor: `#${brushColor.toString(16).padStart(6, "0")}`,
              }}
              onClick={handleColorClick}
              aria-label="Open color picker"
            >
              <div
                className={`${styles.brushSizeDisplay} ${
                  styles.brushSizeDisplay
                }`}
              >
                <h3>{brushSize}</h3>
              </div>
            </button>
            <div className={styles.opacitySetBar} ref={opacitySliderRef}>
              <button
                style={{ touchAction: "manipulation" }}
                className={styles.opacityHandle}
                onMouseDown={() => handleTransparentAdjustment()}
                onTouchStart={() => handleTransparentAdjustment()}
              ></button>
            </div>
          </>
        ) : (
          <button
            className={styles.brushIcon}
            style={{
              border: `4px solid #${brushColor.toString(16).padStart(6, "0")}`,
            }}
            onClick={() => setIsBrushOpen(true)}
          >
            <img className={styles.brushIconImg} src="/assets/brush.svg" alt="Brush" />
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
      {isBrushOpen && <BrushScaleButtons />}
    </div>
  );
};

export default BrushToolbar;
