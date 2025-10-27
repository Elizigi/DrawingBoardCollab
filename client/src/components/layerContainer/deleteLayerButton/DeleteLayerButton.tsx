import { FC } from "react";
import { onlineStatus } from "../../../Main";
import styles from "./DeleteLayerButton.module.scss";
import DeleteLayerButtonMV from "./DeleteLayerButtonMV";

interface DeleteLayerButtonProps {
  layerId: string;
  isLocked: boolean;
}
const DeleteLayerButton: FC<DeleteLayerButtonProps> = ({
  layerId,
  isLocked,
}) => {
  const { allLayers, deleteLayer } = DeleteLayerButtonMV();
  return (
    <div>
      {(!onlineStatus.inRoom || onlineStatus.isAdmin) &&
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
