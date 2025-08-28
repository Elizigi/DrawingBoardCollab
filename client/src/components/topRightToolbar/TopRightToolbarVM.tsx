import { useEffect, useState } from "react";
import { onlineStatus, socket } from "../../Main";
import styles from "./TopRightToolbar.module.scss";
const TopRightToolbarVM = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [onlineWindowOpen, setOnlineWindowOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [hideCode, SetHideCode] = useState(false);

  const [isOnline, setIsOnline] = useState(false);
  const [selfId, setSelfId] = useState("");
  const [spinnerStyle, setSpinnerStyle] = useState("");

  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const handleConnectionWindow = (host = false) => {
    setIsHost(host);
    setHasInteracted(false);
    setOnlineWindowOpen(!onlineWindowOpen);
  };

  useEffect(() => {
    if (!hasInteracted) return;

    if (!isOnline) {
      setSpinnerStyle(styles.spinLoad);
    } else if (isOnline) setSpinnerStyle(styles.spinFinish);
  }, [isOnline, hasInteracted]);

  const handleOnline = () => {
    if (!isOnline) {
      socket.connect();
      setHasInteracted(true);
      onlineStatus.isOnline = true;
    } else {
      setMenuOpen(!menuOpen);
    }
  };
  const handleLeaveRoom = () => {
    socket.disconnect();
  };

  useEffect(() => {
    socket.on("disconnect", () => {
      setIsOnline(false);
      setConnected(false);
      onlineStatus.isOnline = false;
      onlineStatus.inRoom = false;
      console.log("Disconnected");
    });

    socket.on("connect", () => {
      setIsOnline(true);
      handleMenuOpen();
      console.log("Connected:", socket.id);
    });
    socket.on("user-id", (userId: string) => {
      setSelfId(userId);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);
  return {
    spinnerStyle,
    selfId,
    menuOpen,
    onlineWindowOpen,
    isHost,
    connected,
    roomId,
    hideCode,
    setRoomId,
    setOnlineWindowOpen,
    setConnected,
    handleOnline,
    handleLeaveRoom,
    handleConnectionWindow,
    SetHideCode,
  };
};

export default TopRightToolbarVM;
