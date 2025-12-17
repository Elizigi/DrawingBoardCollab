import { FC } from "react";
import styles from "./ToggleLayerVisibility.module.scss";
import ToggleLayerVisibilityMV from "./ToggleLayerVisibilityMV";

interface ToggleLayerVisibility {
  layer: { visible: boolean; id: string };
}
const ToggleLayerVisibility: FC<ToggleLayerVisibility> = ({ layer }) => {
  const { changeVisible } = ToggleLayerVisibilityMV();
  return (
    <div
      role="toolbar"
      className={`${styles.visibilityIcon} ${layer.visible ? "" : styles.hidden}`}
      onKeyDown={() => {}}
      onClick={(e) => {
        e.stopPropagation();
        changeVisible(layer.id);
      }}
    >
      {layer.visible ? (
        <img src="/assets/eyeOpen.svg" alt="open eye" />
      ) : (
        <img src="/assets/eyeClosed.svg" alt="closed eye" />
      )}
    </div>
  );
};

export default ToggleLayerVisibility;
