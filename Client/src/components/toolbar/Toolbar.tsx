import styles from "./Toolbar.module.scss";
import TopRightToolbar from "../topRightToolbar/TopRightToolbar";
import ToolbarVM from "./ToolbarVM";

export const Toolbar = () => {
  const {
    brushColor,
    brushSize,
    usedColors,
    newLayerName,
    allLayers,
    activeLayerId,
    updateText,
    changeLayer,
    changeVisible,
    addNewLayer,
    setBrushColor,
    setBrushSize,
    changeColor,
  } = ToolbarVM();
  
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
          {usedColors.map((color, index) =>
            color !== null ? (
              <button
                key={`${color}-${index}`}
                className={styles.colorBox}
                style={{
                  backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
                }}
                onClick={() => setBrushColor(color)}
              ></button>
            ) : (
              <button
                key={`empty-${-index}`}
                className={styles.colorBox}
                style={{
                  backgroundColor: `#5b5a5a`,
                }}
              ></button>
            )
          )}
        </div>
        <TopRightToolbar />
        <div className={styles.layerContainer}>
          <div className={styles.addNewLayer}>
            <button className={styles.plusBTN} onClick={addNewLayer}>
              +
            </button>
            <input
              type="text"
              value={newLayerName}
              onChange={updateText}
              className={styles.layerNameInput}
            />
          </div>
          {allLayers
            .slice()
            .reverse()
            .map((layer) => (
              <button
                onClick={() => changeLayer(layer.id)}
                key={layer.id}
                className={`${styles.layer} ${layer.id === activeLayerId ? styles.backGReen : ""}`}
              >
                <div className={styles.visibilityIcon}></div>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => changeVisible(layer.id)}
                />

                <div className={styles.layerBox}></div>
                <div className={styles.layerNameContainer}>
                  <h5 className={styles.layerName}>{layer.name}</h5>
                </div>
                <div></div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
