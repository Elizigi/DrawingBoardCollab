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
  const [hideCode, setHideCode] = useState(false);
  const [error, setError] = useState("");

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
    } else setSpinnerStyle(styles.spinFinish);
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
      setMenuOpen(false);
      setRoomId("");
      setIsHost(false);
      setSpinnerStyle("");
      setError("");
      onlineStatus.isOnline = false;
      onlineStatus.inRoom = false;
      console.log("Disconnected");
    });
    socket.on("room-not-found", () => {
      setError("Room not found");
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
    isOnline,
    spinnerStyle,
    selfId,
    menuOpen,
    onlineWindowOpen,
    isHost,
    connected,
    roomId,
    hideCode,
    error,
    setRoomId,
    setOnlineWindowOpen,
    setConnected,
    handleOnline,
    handleLeaveRoom,
    handleConnectionWindow,
    setHideCode,
  };
};

export default TopRightToolbarVM;
