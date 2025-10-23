import { onlineStatus } from "../../Main";
import AddLayerButton from "./addLayerButton/AddLayerButton";
import DeleteLayerButton from "./deleteLayerButton/DeleteLayerButton";
import HideLayerButton from "./hideLayersButton/HideLayerButton";
import LayerContainerVM from "./LayerContainerVM";
import styles from "./LayersContainer.module.scss";
import LockLayerButton from "./lockLayerButton/LockLayerButton";

const LayersContainer = () => {
  const {
    allLayers,
    activeLayerId,
    containerVisible,
    layersToolPositionOffset,
    toolbarElement,
    dragAreaElement,
    isDragging,
    toTheRight,
    layerRefs,
    handleLayerDown,
    chooseContainerSide,

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
        ref={dragAreaElement}
      >
        <AddLayerButton />
        <div className={styles.layersContainer}>
          {allLayers.map((layer, index) => (
            <button
              onClick={() => changeLayer(layer.id)}
              onMouseDown={(e) => handleLayerDown(index, e)}
              id={layer.id}
              key={layer.id}
              ref={(el) => {
                if (el) layerRefs.current.set(layer.id, el);
                else layerRefs.current.delete(layer.id);
              }}
              className={`${styles.layer} ${layer.id === activeLayerId ? styles.backGReen : ""}`}
              style={{
                cursor:
                  onlineStatus.inRoom && layer.locked && !onlineStatus.isAdmin
                    ? "not-allowed"
                    : "pointer",
              }}
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

              <div className={styles.layerNameContainer}>
                <h5 className={styles.layerName}>{layer.name}</h5>
              </div>
              <LockLayerButton layer={layer} />
              <DeleteLayerButton
                key={`delete-${layer.id}`}
                layerId={layer.id}
              />
            </button>
          ))}
        </div>
      </div>
      <HideLayerButton
        containerVisible={containerVisible}
        toTheRight={toTheRight}
        toggleLayerContainer={toggleLayerContainer}
      />
    </div>
  );
};

export default LayersContainer;
