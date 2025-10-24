import AddLayerButton from "./addLayerButton/AddLayerButton";
import HideLayerButton from "./hideLayersButton/HideLayerButton";
import LayerButtons from "./layerButton/LayerButtons";
import LayerContainerVM from "./LayerContainerVM";
import styles from "./LayersContainer.module.scss";

const LayersContainer = () => {
  const {
    containerVisible,
    layersToolPositionOffset,
    toolbarElement,
    dragAreaElement,
    isDragging,
    toTheRight,

    chooseContainerSide,
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
        <LayerButtons />
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
