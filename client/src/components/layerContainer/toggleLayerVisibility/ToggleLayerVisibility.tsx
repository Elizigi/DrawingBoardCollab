import { FC } from "react";
import styles from "./ToggleLayerVisibility.module.scss";
import ToggleLayerVisibilityMV from "./ToggleLayerVisibilityMV";

interface ToggleLayerVisibility {
  layer: { visible: boolean; id: string };
}
const ToggleLayerVisibility: FC<ToggleLayerVisibility> = ({ layer }) => {
  const { changeVisible } = ToggleLayerVisibilityMV();
  return (
    <input
      type="checkbox"
      checked={true}
      className={`${styles.visibilityIcon} ${layer.visible ? "" : styles.hidden}`}
      onChange={(e) => {
        e.stopPropagation();
        changeVisible(layer.id);
      }}
    />
  );
};

export default ToggleLayerVisibility;
