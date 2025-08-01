import { useEffect, useState } from "react";
import { socket } from "../../Main";
import styles from "./TopRightToolbar.module.scss";

const TopRightToolbarVM = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selfId, setSelfId] = useState("");
  const handleMenuOpen = () => {
    setHasInteracted(true);
    setMenuOpen(!menuOpen);
  };
  const handleAnim = () => {
    return menuOpen ? styles.openMenuAnim : styles.closeMenuAnim;
  };
  const handleOnline = () => {
    socket.connect();
  };

  useEffect(() => {
    socket.on("disconnect", () => {
      setIsOnline(false);

      console.log("Disconnected");
    });

    socket.on("connect", () => {
      setIsOnline(true);
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
    handleOnline,
    handleMenuOpen,
    handleAnim,
    hasInteracted,
    selfId,
  };
};

export default TopRightToolbarVM;
