import { FC } from "react";
import { onlineStatus } from "../../../Main";
import styles from "./DeleteLayerButton.module.scss";
import DeleteLayerButtonMV from "./DeleteLayerButtonMV";

interface DeleteLayerButtonProps {
  layerId: string;
}
const DeleteLayerButton: FC<DeleteLayerButtonProps> = ({ layerId }) => {
  const { allLayers, deleteLayer } = DeleteLayerButtonMV();
  return (
    <div>
      {(!onlineStatus.inRoom || onlineStatus.isAdmin) &&
        allLayers.length > 1 && (
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
