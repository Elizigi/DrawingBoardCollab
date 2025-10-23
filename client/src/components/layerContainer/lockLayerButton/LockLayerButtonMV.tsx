import { onlineStatus, socket } from "../../../Main";
import { useBrushStore } from "../../../zustand/useBrushStore";

const LockLayerButtonMV = () => {
  const toggleLockLayers = useBrushStore((state) => state.toggleLockLayer);

  const toggleLockLayer = (layerId: string) => {
    if (onlineStatus.inRoom && !onlineStatus.isAdmin) return;
    toggleLockLayers(layerId);
    if (onlineStatus.inRoom && onlineStatus.isAdmin)
      socket.emit("locked-layer", { layerId });
  };
  return { toggleLockLayer };
};

export default LockLayerButtonMV;
