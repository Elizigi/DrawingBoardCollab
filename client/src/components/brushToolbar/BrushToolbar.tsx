import BrushToolbarVM from "./BrushToolbarVM";
import styles from "./BrushToolbar.module.scss";
const BrushToolbar = () => {
  const {
    brushColor,
    brushSize,
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
    setBrushSize,
    changeColor,
  } = BrushToolbarVM();

  return (
    <div className={styles.brushToolbar}>
      {isBrushOpen && (
        <>
          <div
            className={styles.colorOfSlider}
            
          ></div>

          <div className={styles.sizeSetBar} ref={opacitySliderRef}>
            <button
              style={{ touchAction: "manipulation" }}
              className={styles.sizeHandle}
              onMouseDown={() => handleTransparentAdjustment()}
              onTouchStart={() => handleTransparentAdjustment()}
              onMouseEnter={() => setTextTarget(TextTarget.Opacity)}
              onMouseLeave={() => setTextTarget(TextTarget.BrushSize)}
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
            <div
              className={`${styles.brushSizeDisplay} ${
                textTarget === TextTarget.Opacity
                  ? styles.highlightedText
                  : styles.brushSizeDisplay
              }`}
            >
              <h3>{displayValue()}</h3>
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
    </div>
  );
};

export default BrushToolbar;
