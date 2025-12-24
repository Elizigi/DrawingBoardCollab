import React, { useEffect, useState } from "react";
import { socket } from "../../Main";
import { EventTypes, useBrushStore } from "../../zustand/useBrushStore";
import { useOnlineStatus } from "../../zustand/useOnlineStatus";

interface ConnectionParams {
  isHost: boolean;
  roomId: string;
  myNameRef: React.RefObject<string>;
  connected: boolean;
  setError: (errorMessage: string) => void;
  setConnected: (connected: boolean) => void;
  setOnlineWindowOpen: (windowOpen: boolean) => void;
  setRoomId: (roomId: string) => void;
  isConnecting: boolean;
  setIsConnecting: (isConnecting: boolean) => void;
}

const OnlineComponentVM = ({
  isHost,
  roomId,
  myNameRef,
  connected,
  setError,
  setConnected,
  setOnlineWindowOpen,
  setRoomId,
  isConnecting,
  setIsConnecting,
}: ConnectionParams) => {
  const [myName, setMyName] = useState("");
  const addEvent = useBrushStore((state) => state.addEvent);
  const { setInRoom, setIsAdmin, maxUsers, setMaxUsers } =
    useOnlineStatus.getState();

  const [userLimitValue, setUserLimitValue] = useState(maxUsers);
  const handleOnline = () => {
    socket.connect();
    setIsConnecting(true);
  };
  const handleModalOpen = () => {
    setOnlineWindowOpen(false);
  };
  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setMyName(name);
  };

  const isSetMaxUsers = () => {
    if (userLimitValue !== maxUsers) {
      setMaxUsers(userLimitValue);
    }
  };

  const handleAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setRoomId(id);
  };
  const displayWord = () => {
    if (isConnecting) return "⋯";
    if (isHost) return "Host";
    return "Connect";
  };
  useEffect(() => {
    if (connected) handleModalOpen();
  }, [connected]);

  const handleSubmit = () => {
    if (myName.trim().length < 2) return setError("Name too short");
    handleOnline();
    if (isHost) {
      isSetMaxUsers();
      socket.emit("create-room", {
        name: myName,
        userLimit: userLimitValue === 20 ? undefined : userLimitValue,
      });
      return;
    }
    if (!roomId) return;
    socket.emit("join-room", { roomId, name: myName });
  };

  const handleRoomCreated = (roomId: string) => {
    console.log("Room ID to share:", roomId);
    setRoomId(roomId);
    setInRoom(true);
    setIsAdmin(true);
    addEvent(EventTypes.roomCreatedEvent, "");
    handleModalOpen();

    setConnected(true);
  };

  useEffect(() => {
    myNameRef.current = myName;
  }, [myName]);

  const handleNoPermission = (message?: string) => {
    setError(message || "You don't have permission");
    addEvent(EventTypes.noPermission, "");
  };

  const handleError = (errorMsg: string | { reason: string }) => {
    const msg = typeof errorMsg === "string" ? errorMsg : errorMsg.reason;
    setIsConnecting(false);
    setError(msg);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleModalOpen();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [handleModalOpen]);

  useEffect(() => {
    socket.on("room-created", handleRoomCreated);
    socket.on("no-permission", handleNoPermission);
    socket.on("error", handleError);

    return () => {
      socket.off("room-created", handleRoomCreated);
      socket.off("no-permission", handleNoPermission);
      socket.off("error", handleError);
    };
  }, []);

  return {
    myName,
    userLimitValue,
    setUserLimitValue,
    handleAddress,
    handleModalOpen,
    handleName,
    handleSubmit,
    displayWord,
  };
};

export default OnlineComponentVM;
