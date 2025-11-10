import { useEffect, useRef, useState } from "react";
import { socket } from "../../Main";
import styles from "./TopRightToolbar.module.scss";
import { EventTypes, useBrushStore } from "../../zustand/useBrushStore";
import { useOnlineStatus } from "../../zustand/useOnlineStatus";

export interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
  guestId: string;
  color: string;
}

const TopRightToolbarVM = () => {
  const addEvent = useBrushStore((state) => state.addEvent);

  const [menuOpen, setMenuOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [onlineWindowOpen, setOnlineWindowOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [hideCode, setHideCode] = useState(false);
  const [error, setError] = useState("");
  const { setOnline, setInRoom, setIsAdmin } = useOnlineStatus.getState();

  const isMouseDown = useBrushStore((s) => s.isMouseDown);

  const [isOnline, setIsOnline] = useState(false);
  const [selfId, setSelfId] = useState(socket.id);
  const [spinnerStyle, setSpinnerStyle] = useState("");
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  const myNameRef = useRef<string>("");

  const handleUserJoined = ({
    name,
    guestId,
  }: {
    name: string;
    guestId: string;
  }) => {
    console.log(guestId, "Has joined");
    addEvent(EventTypes.joinEvent, name);

    setConnectedUsers((prev) => [
      ...prev,
      { name, position: { x: 0, y: 0 }, guestId, color: getRandomColor() },
    ]);
    socket.emit("send-name", {
      name: myNameRef.current,
      userId: socket.id,
      guestId,
    });
  };

  const handleAddName = ({
    username,
    userId,
  }: {
    username: string;
    userId: string;
  }) => {
    console.log(username, "was in the room");
    setConnectedUsers((prev) => {
      const nameAlreadyIn = prev.find((user) => user.guestId === userId);
      if (!nameAlreadyIn) {
        return [
          ...prev,
          {
            name: username,
            position: { x: 0, y: 0 },
            guestId: userId,
            color: getRandomColor(),
          },
        ];
      }
      return prev;
    });
  };
  const getRandomColor = (): string => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleUserMoved = ({ guestId, position }: ConnectedUser) => {
    setConnectedUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.guestId === guestId ? { ...user, position } : user
      )
    );
  };
  const handleUserLeft = ({ guestId, name }: ConnectedUser) => {
    console.log(`${guestId} has left`);
    addEvent(EventTypes.userLeftEvent, name);
    setConnectedUsers((prevUsers) =>
      prevUsers.filter((user) => user.guestId !== guestId)
    );
  };
  const handleUserKicked = ({ guestId, name }: ConnectedUser) => {
    console.log(`${guestId} was kicked`);
    addEvent(EventTypes.userKickedEvent, name);
    setConnectedUsers((prevUsers) =>
      prevUsers.filter((user) => user.guestId !== guestId)
    );
  };
  const handleUserRemoved = ({ reason }: { reason: string }) => {
    console.log("Removed:", reason);
    cleanup();

    (reasonHandlers[reason] || reasonHandlers.default)();
  };
  const reasonHandlers: Record<string, () => void> = {
    "removed by host": () => addEvent(EventTypes.KickedEvent, ""),
    "left by choice": () => addEvent(EventTypes.userLeftEvent, ""),
    "left by choice and room closed": () =>
      addEvent(EventTypes.roomClosedEvent, ""),
    "room closed": () => addEvent(EventTypes.roomClosedEvent, ""),
    default: () => addEvent(EventTypes.default, ""),
  };
  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const handleConnectionWindow = (host = false) => {
    setIsHost(host);
    setHasInteracted(false);
    setOnlineWindowOpen(!onlineWindowOpen);
  };

  const cleanup = () => {
    setConnected(false);
    setMenuOpen(false);
    setRoomId("");
    setIsHost(false);
    setError("");
    setConnectedUsers([]);
    setInRoom(false);
    setIsAdmin(false);
  };

  const handleOnline = () => {
    if (isOnline) {
      setMenuOpen(!menuOpen);
    } else {
      socket.connect();
      setHasInteracted(true);
      setOnline(true);
    }
  };
  const handleLeaveRoom = () => {
    socket.emit("leave-room");
  };

  const handleJoinedRoom = ({ roomId }: { roomId: string }) => {
    setRoomId(roomId);
    setInRoom(true);
    addEvent(EventTypes.joinedEvent, "");
    console.log("joined:", roomId);
    document.dispatchEvent(new CustomEvent("clearCanvas"));
    socket.emit("request-state", { to: roomId });
    setConnected(true);
  };

  const disconnected = () => {
    setIsOnline(false);
    setConnected(false);
    setMenuOpen(false);
    setRoomId("");
    setIsHost(false);
    setSpinnerStyle("");
    setError("");
    setConnectedUsers([]);
    setIsAdmin(false);
    setInRoom(false);
    setOnline(false);
    console.log("Disconnected");
  };

  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  }, [isMouseDown]);
  useEffect(() => {
    setError("");
  }, [onlineWindowOpen]);

  useEffect(() => {
    if (!hasInteracted) return;
    if (isOnline) {
      setSpinnerStyle(styles.spinFinish);
    } else setSpinnerStyle(styles.spinLoad);
  }, [isOnline, hasInteracted]);

  const handleUserUpdated = ({ userLimit }: { userLimit: number }) => {
    console.log("updatingLimit", userLimit);
    if (!userLimit) return;
    const { setMaxUsers } = useOnlineStatus.getState();
    setMaxUsers(userLimit);
    addEvent(EventTypes.userLimitUpdated, `${userLimit}`);
  };

  useEffect(() => {
    socket.on("user-joined", handleUserJoined);
    socket.on("add-name", handleAddName);
    socket.on("joined-room", handleJoinedRoom);
    socket.on("user-moved", handleUserMoved);
    socket.on("user-left", handleUserLeft);
    socket.on("user-removed", handleUserRemoved);
    socket.on("user-kicked", handleUserKicked);
    socket.on("user-updated", handleUserUpdated);

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
    socket.on("disconnect", disconnected);
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("add-name", handleAddName);
      socket.off("joined-room", handleJoinedRoom);
      socket.off("user-moved", handleUserMoved);
      socket.off("user-left", handleUserLeft);
      socket.off("user-removed", handleUserRemoved);
      socket.off("user-kicked", handleUserKicked);
      socket.off("connect");
      socket.off("disconnect", disconnected);
      socket.off("user-id");
      socket.off("user-updated", handleUserUpdated);

      socket.off("room-not-found", () => {
        setError("Room not found");
      });
    };
  }, []);

  return {
    isOnline,
    spinnerStyle,
    selfId,
    menuOpen,
    onlineWindowOpen,
    isHost,
    roomId,
    hideCode,
    error,
    connectedUsers,
    myNameRef,
    connected,
    setError,
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
