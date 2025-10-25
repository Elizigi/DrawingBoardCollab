import styles from "./LayerButtons.module.scss";
import { onlineStatus } from "../../../Main";
import ToggleLayerVisibility from "../toggleLayerVisibility/ToggleLayerVisibility";
import LockLayerButton from "../lockLayerButton/LockLayerButton";
import DeleteLayerButton from "../deleteLayerButton/DeleteLayerButton";
import LayerButtonMV from "./LayerButtonsMV";

const LayerButtons = () => {
  const {
    allLayers,
    activeLayerId,
    layerRefs,
    layerOffset,
    draggedLayer,
    layerContainerRef,
    handleLayerDown,
    changeLayer,
  } = LayerButtonMV();

  return (
    <div className={styles.layersContainer} ref={layerContainerRef}>
      {allLayers.map((layer, index) => (
        <button
          onClick={() => changeLayer(layer.id)}
          onMouseDown={(e) => handleLayerDown(index, e)}
          id={layer.id}
          key={`layer-id:${layer.id}`}
          ref={(el) => {
            if (el) layerRefs.current.set(layer.id, el);
            else layerRefs.current.delete(layer.id);
          }}
          className={`${styles.layer} ${layer.id === activeLayerId ? styles.backGReen : ""}`}
          style={{
            order:allLayers.length -index,
            top: draggedLayer === index ? layerOffset : 0,
            zIndex: draggedLayer === index ? 9999999 : 99,
            cursor:
              onlineStatus.inRoom && layer.locked && !onlineStatus.isAdmin
                ? "not-allowed"
                : "pointer",
          }}
        >
          <ToggleLayerVisibility layer={layer} />

          <div className={styles.layerNameContainer}>
            <h5 className={styles.layerName}>{layer.name}</h5>
          </div>
          <LockLayerButton layer={layer} />
          <DeleteLayerButton key={`delete-${layer.id}`} layerId={layer.id} />
        </button>
      ))}
    </div>
  );
};

export default LayerButtons;
