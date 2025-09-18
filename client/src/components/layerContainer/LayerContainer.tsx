import LayerContainerVM from "./LayerContainerVM";
import styles from "./LayersContainer.module.scss";

const LayersContainer = () => {
  const {
    newLayerName,
    allLayers,
    activeLayerId,
    layerNameInputOpen,
    handlePlusBtnClick,
    updateText,
    changeLayer,
    changeVisible,
  } = LayerContainerVM();

  return (
    <div className={styles.layersToolbar}>
      <div className={styles.addNewLayer}>
        <button className={styles.plusBTN} onClick={handlePlusBtnClick}>
          +
        </button>
        {layerNameInputOpen && (
          <input
            type="text"
            value={newLayerName}
            onChange={updateText}
            className={styles.layerNameInput}
          />
        )}
      </div>
      <div className={styles.layersContainer}>
        {allLayers
          .slice()
          .reverse()
          .map((layer) => (
            <button
              onClick={() => changeLayer(layer.id)}
              key={layer.id}
              className={`${styles.layer} ${layer.id === activeLayerId ? styles.backGReen : ""}`}
            >
              <input type="checkbox"
              checked={true}
                className={`${styles.visibilityIcon} ${!layer.visible ? styles.hidden : ""}`}
                onChange={(e) => {
                  e.stopPropagation();
                  changeVisible(layer.id);
                }}
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
  );
};

export default LayersContainer;
