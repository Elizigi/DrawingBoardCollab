import { onlineStatus } from "../../Main";
import LayerContainerVM from "./LayerContainerVM";
import styles from "./LayersContainer.module.scss";

const LayersContainer = () => {
  const {
    newLayerName,
    allLayers,
    activeLayerId,
    layerNameInputOpen,
    containerVisible,
    layersToolPositionOffset,
    toolbarElement,
    isDragging,
    toTheRight,
    chooseContainerSide,
    getArrowDir,
    deleteLayer,
    handlePlusBtnClick,
    updateText,
    changeLayer,
    changeVisible,
    toggleLayerContainer,
    handleMouseDown,
  } = LayerContainerVM();

  return (
    <div
      className={`${styles.layerToolbarContainer}  ${containerVisible ? styles.layerVisible : chooseContainerSide(styles)} ${toTheRight ? styles.right : styles.left}`}
      aria-roledescription="draggable item"
      role="toolbar"
      onMouseDown={handleMouseDown}
      style={
        (layersToolPositionOffset.x !== 0 ||
          layersToolPositionOffset.y !== 0) &&
        containerVisible
          ? {
              top: `${layersToolPositionOffset.y}px`,
              left: `${layersToolPositionOffset.x}px`,
            }
          : {}
      }
      ref={toolbarElement}
    >
      <div
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        className={`${styles.layersToolbar}`}
      >
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
                <input
                  type="checkbox"
                  checked={true}
                  className={`${styles.visibilityIcon} ${layer.visible ? "" : styles.hidden}`}
                  onChange={(e) => {
                    e.stopPropagation();
                    changeVisible(layer.id);
                  }}
                />

                <div className={styles.layerBox}></div>
                <div className={styles.layerNameContainer}>
                  <h5 className={styles.layerName}>{layer.name}</h5>
                </div>
                {(!onlineStatus.inRoom || onlineStatus.isAdmin) &&
                  allLayers.length > 1 && (
                    <input
                      type="button"
                      value="❌"
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                    />
                  )}
              </button>
            ))}
        </div>
      </div>
      <button
        className={`${styles.hideLayersButton} ${toTheRight ? styles.toRight : styles.toLeft}`}
        onClick={() => toggleLayerContainer()}
      >
        {getArrowDir()}
      </button>
    </div>
  );
};

export default LayersContainer;
