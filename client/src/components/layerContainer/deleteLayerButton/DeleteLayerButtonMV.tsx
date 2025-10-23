import { onlineStatus, socket } from "../../../Main";
import { useBrushStore } from "../../../zustand/useBrushStore";

const DeleteLayerButtonMV = () => {
  const allLayers = useBrushStore((state) => state.layers);
  const removeLayer = useBrushStore((state) => state.removeLayer);

  const deleteLayer = (layerId: string) => {
    if (onlineStatus.inRoom) return socket.emit("delete-layer", { layerId });
    removeLayer(layerId);
  };

  return { allLayers, deleteLayer };
};

export default DeleteLayerButtonMV;
