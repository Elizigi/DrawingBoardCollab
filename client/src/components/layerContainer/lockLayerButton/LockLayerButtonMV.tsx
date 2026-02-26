import { socket } from "../../../helpers/sockets";
import { useBrushStore } from "../../../zustand/useBrushStore";
import { useOnlineStatus } from "../../../zustand/useOnlineStatus";

const LockLayerButtonMV = () => {
  const toggleLockLayers = useBrushStore((state) => state.toggleLockLayer);
    const { inRoom, isAdmin } = useOnlineStatus.getState();

  const toggleLockLayer = (layerId: string) => {
    if (inRoom && !isAdmin) return;
    toggleLockLayers(layerId);
    if (inRoom && isAdmin)
      socket.emit("locked-layer", { layerId });
  };
  return { toggleLockLayer };
};

export default LockLayerButtonMV;
