import { useEffect, useState } from "react";
import { canvasSize, resizeAllCanvases } from "../../helpers/canvasHelpers";
import { socket } from "../../Main";
import { useOnlineStatus } from "../../zustand/useOnlineStatus";

const SettingScreenMV = () => {
  const { inRoom, isAdmin, maxUsers, setMaxUsers } = useOnlineStatus();

  const [canvasSizeValue, setCanvasSizeValue] = useState(canvasSize);
  const [maxUsersInRoom, setMaxUsersInRoom] = useState(maxUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [shouldSeeIcon, setShouldSeeIcon] = useState(true);
  useEffect(() => {
    if (inRoom && !isAdmin) {
      setShouldSeeIcon(false);
    } else {
      setShouldSeeIcon(true);
    }
  }, [inRoom, isAdmin]);
  const changSettings = () => {
    if (
      canvasSize.height !== canvasSizeValue.height ||
      canvasSize.width !== canvasSizeValue.width
    ) {
      canvasSize.height = canvasSizeValue.height;
      canvasSize.width = canvasSizeValue.width;
      setModalOpen(false);
      resizeAllCanvases(canvasSizeValue.width, canvasSizeValue.height);
      if (inRoom && isAdmin) {
        socket.emit("new-size", canvasSize);
      }
    }
    if (maxUsersInRoom !== maxUsers) {
      setMaxUsers(maxUsersInRoom);
      if (inRoom && isAdmin) {
        const newLimit = maxUsersInRoom;
        socket.emit("update-limit", newLimit);
      }
    }
    setModalOpen(false);
  };

  const noChange = () => {
    setModalOpen(false);
    setCanvasSizeValue(canvasSize);
    setMaxUsersInRoom(maxUsers);
  };

  return {
    canvasSizeValue,
    modalOpen,
    maxUsersInRoom,
    shouldSeeIcon,
    noChange,
    setMaxUsersInRoom,
    setModalOpen,
    changSettings,
    setCanvasSizeValue,
  };
};

export default SettingScreenMV;
