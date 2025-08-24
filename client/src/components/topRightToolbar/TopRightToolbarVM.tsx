import { useEffect, useState } from "react";
import { onlineStatus, socket } from "../../Main";
import styles from "./TopRightToolbar.module.scss";
const TopRightToolbarVM = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selfId, setSelfId] = useState("");
  const [spinnerStyle, setSpinnerStyle] = useState("");

  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (!hasInteracted) return;
    if (!isOnline) {
      setSpinnerStyle(styles.spinLoad);
    } else if (isOnline) setSpinnerStyle(styles.spinFinish);
  }, [isOnline, hasInteracted]);

  const handleOnline = () => {
    socket.connect();
    setHasInteracted(true);
    onlineStatus.isOnline = true;
  };

  useEffect(() => {
    socket.on("disconnect", () => {
      setIsOnline(false);
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
    isOnline,
    spinnerStyle,
    selfId,
    menuOpen,
    handleOnline,
  };
};

export default TopRightToolbarVM;
