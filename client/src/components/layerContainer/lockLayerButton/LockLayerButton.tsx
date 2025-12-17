import { FC } from "react";
import LockLayerButtonMV from "./LockLayerButtonMV";
import styles from "./LockLayerButton.module.scss";
import { useOnlineStatus } from "../../../zustand/useOnlineStatus";

interface LockLayerButtonProps {
  layer: { locked: boolean; id: string };
}
const LockLayerButton: FC<LockLayerButtonProps> = ({ layer }) => {
  const { toggleLockLayer } = LockLayerButtonMV();
  const { inRoom, isAdmin } = useOnlineStatus.getState();

  return (
    <div>
      {inRoom && !isAdmin ? (
        <div role="toolbar" className={styles.lockedLock}>
          <img src="/assets/lockClosed.svg" alt="lock locked" />
        </div>
      ) : (
        <div
          role="toolbar"
          className={layer.locked ? styles.lockedLock : styles.openLock}
          tabIndex={0}
          onKeyDown={() => {}}
          onClick={(e) => {
            e.stopPropagation();
            toggleLockLayer(layer.id);
          }}
        >
          {layer.locked ? (
            <img src="/assets/lockClosed.svg" alt="lock locked" />
          ) : (
            <img src="/assets/lockOpen.svg" alt="lock Open" />
          )}
        </div>
      )}
    </div>
  );
};

export default LockLayerButton;
