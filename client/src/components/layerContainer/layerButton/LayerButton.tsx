import { FC } from "react";
import styles from "./LayerButton.module.scss";
import { onlineStatus } from "../../../Main";
import ToggleLayerVisibility from "../toggleLayerVisibility/ToggleLayerVisibility";
import LockLayerButton from "../lockLayerButton/LockLayerButton";
import DeleteLayerButton from "../deleteLayerButton/DeleteLayerButton";
import LayerButtonMV from "./LayerButtonMV";

interface LayerButtonProps {
  layer: { visible: boolean; id: string; locked: boolean; name: string };
  index: number;
}
const LayerButton: FC<LayerButtonProps> = ({
  layer,
  index,
}) => {
  const { activeLayerId, changeLayer,layerRefs,handleLayerDown } = LayerButtonMV();
  return (
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
      <ToggleLayerVisibility layer={layer} />

      <div className={styles.layerNameContainer}>
        <h5 className={styles.layerName}>{layer.name}</h5>
      </div>
      <LockLayerButton layer={layer} />
      <DeleteLayerButton key={`delete-${layer.id}`} layerId={layer.id} />
    </button>
  );
};

export default LayerButton;
