import { FC } from "react";
import { onlineStatus } from "../../../Main";
import LockLayerButtonMV from "./LockLayerButtonMV";
import styles from "./LockLayerButton.module.scss";

interface LockLayerButtonProps {
  layer: { locked: boolean; id: string };
}
const LockLayerButton: FC<LockLayerButtonProps> = ({ layer }) => {
  const { toggleLockLayer } = LockLayerButtonMV();
  return (
    <div>
      {onlineStatus.inRoom && !onlineStatus.isAdmin ? (
        <input
          type="checkbox"
          disabled
          style={{ display: layer.locked ? "block" : "none" }}
          checked={true}
          className={layer.locked ? styles.lockedLock : ""}
          onChange={(e) => {
            e.stopPropagation();
          }}
        />
      ) : (
        <input
          type="checkbox"
          checked={true}
          className={layer.locked ? styles.lockedLock : styles.openLock}
          onChange={(e) => {
            e.stopPropagation();
            toggleLockLayer(layer.id);
          }}
        />
      )}
    </div>
  );
};

export default LockLayerButton;
