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
    draggedLayer,
    layerContainerRef,
    canDrag,
    isNameEdit,
    handleKeyPress,
    setNewName,
    setIsNameEdit,
    topCalculations,
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
            order: allLayers.length - index,
            top: `${topCalculations(index)}px`,
            zIndex: draggedLayer === index ? 9999999 : 99,
            position:
              draggedLayer === index && canDrag ? "absolute" : "relative",

            cursor:
              onlineStatus.inRoom && layer.locked && !onlineStatus.isAdmin
                ? "not-allowed"
                : "pointer",
          }}
        >
          <ToggleLayerVisibility layer={layer} />

          <div
            role="toolbar"
            tabIndex={0}
            className={styles.layerNameContainer}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onlineStatus.inRoom && !onlineStatus.isAdmin) return;
              setIsNameEdit(layer.id);
            }}
          >
            {isNameEdit===layer.id ? (
              <input
                type="text"
                className={styles.layerEdit}
                placeholder={layer.name}
                onBlur={(e) => setNewName(layer.id, e.target.value, layer.name)}
                onKeyDown={(e) => handleKeyPress(layer.id, e, layer.name)}
                autoFocus
              />
            ) : (
              <h5 className={styles.layerName}>{layer.name}</h5>
            )}
          </div>
          <LockLayerButton layer={layer} />
          <DeleteLayerButton
            key={`delete-${layer.id}`}
            layerId={layer.id}
            isLocked={layer.locked}
          />
        </button>
      ))}
    </div>
  );
};

export default LayerButtons;
