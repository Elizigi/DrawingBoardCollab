import { useEffect, useState } from "react";
import { canvasSize, resizeAllCanvases } from "../../helpers/canvasHelpers";
import { socket } from "../../Main";
import { useOnlineStatus } from "../../zustand/useOnlineStatus";

const SettingScreenMV = (close: (isOpen: boolean) => void, isOpen: boolean) => {
  const { inRoom, isAdmin, maxUsers, setMaxUsers } = useOnlineStatus();

  const [canvasSizeValue, setCanvasSizeValue] = useState(canvasSize);
  const [maxUsersInRoom, setMaxUsersInRoom] = useState(maxUsers);
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
      close(false);
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
    close(false);
  };

  const noChange = () => {
    close(false);
    setCanvasSizeValue(canvasSize);
    setMaxUsersInRoom(maxUsers);
  };
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close(false);
        return;
      }
      if (e.key === "Enter") {
        changSettings();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);
  return {
    canvasSizeValue,
    maxUsersInRoom,
    shouldSeeIcon,
    noChange,
    setMaxUsersInRoom,
    changSettings,
    setCanvasSizeValue,
  };
};

export default SettingScreenMV;
