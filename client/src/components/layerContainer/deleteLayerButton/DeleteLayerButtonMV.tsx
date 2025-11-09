import {  socket } from "../../../Main";
import { useBrushStore } from "../../../zustand/useBrushStore";
import { useOnlineStatus } from "../../../zustand/useOnlineStatus";

const DeleteLayerButtonMV = () => {
  const allLayers = useBrushStore((state) => state.layers);
  const removeLayer = useBrushStore((state) => state.removeLayer);
    const { inRoom } = useOnlineStatus.getState();

  const deleteLayer = (layerId: string) => {
    if (inRoom) return socket.emit("delete-layer", { layerId });
    removeLayer(layerId);
  };

  return { allLayers, deleteLayer };
};

export default DeleteLayerButtonMV;
