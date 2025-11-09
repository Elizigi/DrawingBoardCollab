import { FC } from "react";
import styles from "./DeleteLayerButton.module.scss";
import DeleteLayerButtonMV from "./DeleteLayerButtonMV";
import { useOnlineStatus } from "../../../zustand/useOnlineStatus";

interface DeleteLayerButtonProps {
  layerId: string;
  isLocked: boolean;
}
const DeleteLayerButton: FC<DeleteLayerButtonProps> = ({
  layerId,
  isLocked,
}) => {
  const { inRoom, isAdmin } = useOnlineStatus.getState();

  const { allLayers, deleteLayer } = DeleteLayerButtonMV();
  return (
    <div>
      {(!inRoom || isAdmin) &&
        allLayers.length > 1 &&
        !isLocked && (
          <input
            type="button"
            value="❌"
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              deleteLayer(layerId);
            }}
          />
        )}
    </div>
  );
};

export default DeleteLayerButton;
