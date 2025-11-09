import { useState } from "react";
import { canvasSize, resizeAllCanvases } from "../../helpers/canvasHelpers";
import { onlineStatus } from "../../Main";

const SettingScreenMV = () => {
  const [canvasSizeValue, setCanvasSizeValue] = useState(canvasSize);
  const [maxUsersInRoom, setMaxUsersInRoom] = useState(onlineStatus.maxUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const changSettings = () => {
    if (
      canvasSize.height !== canvasSizeValue.height ||
      canvasSize.width !== canvasSizeValue.width
    ) {
      canvasSize.height = canvasSizeValue.height;
      canvasSize.width = canvasSizeValue.width;
      setModalOpen(false);
      resizeAllCanvases(canvasSizeValue.width, canvasSizeValue.height);
    }
    if (maxUsersInRoom !== onlineStatus.maxUsers) {
      onlineStatus.maxUsers = maxUsersInRoom;
    }
    setModalOpen(false);
  };

  const noChange = () => {
    setModalOpen(false);
    setCanvasSizeValue(canvasSize);
    setMaxUsersInRoom(onlineStatus.maxUsers);
  };

  return {
    canvasSizeValue,
    modalOpen,
    maxUsersInRoom,
    noChange,
    setMaxUsersInRoom,
    setModalOpen,
    changSettings,
    setCanvasSizeValue,
  };
};

export default SettingScreenMV;
