import LayerContainerVM from "./LayerContainerVM";
import styles from "./LayersContainer.module.scss";

const LayersContainer = () => {
  const {
    newLayerName,
    allLayers,
    activeLayerId,
    updateText,
    changeLayer,
    changeVisible,
    addNewLayer,
  } = LayerContainerVM();
  
  return (
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
  );
};

export default LayersContainer;
