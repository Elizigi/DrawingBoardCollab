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
}: ConnectionParams) => {
  const [myName, setMyName] = useState("");
  const addEvent = useBrushStore((state) => state.addEvent);
  const { setInRoom, setIsAdmin, maxUsers, setMaxUsers } =
    useOnlineStatus.getState();

  const [userLimitValue, setUserLimitValue] = useState(maxUsers);

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
  useEffect(() => {
    if (connected) handleModalOpen();
  }, [connected]);

  const handleSubmit = () => {
    if (myName.trim().length < 2) return setError("Name too short");
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

  useEffect(() => {
    socket.on("room-created", handleRoomCreated);
    return () => {
      socket.off("room-created", handleRoomCreated);
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
  };
};

export default OnlineComponentVM;
