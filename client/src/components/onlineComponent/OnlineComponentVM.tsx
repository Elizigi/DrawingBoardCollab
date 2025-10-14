import React, { RefObject, useEffect, useState } from "react";
import { onlineStatus, socket } from "../../Main";
import { EventTypes, useBrushStore } from "../../zustand/useBrushStore";

const OnlineComponentVM = (
  isHost: boolean,
  roomId: string,
  myNameRef: RefObject<string>,
  connected: boolean,
  setConnected: (connected: boolean) => void,
  setOnlineWindowOpen: (windowOpen: boolean) => void,
  setRoomId: (roomId: string) => void
) => {
  const [myName, setMyName] = useState("");
  const addEvent = useBrushStore((state) => state.addEvent);

  const handleModalOpen = () => {
    setOnlineWindowOpen(false);
  };
  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setMyName(name);
  };

  const handleAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setRoomId(id);
  };
  useEffect(() => {
    if (connected) handleModalOpen();
  }, [connected]);

  const handleSubmit = () => {
    if (isHost) {
      socket.emit("create-room", { name: myName });
      return;
    }
    if (!roomId) return;
    socket.emit("join-room", { roomId, name: myName });
  };

  const handleRoomCreated = (roomId: string) => {
    console.log("Room ID to share:", roomId);
    setRoomId(roomId);
    onlineStatus.inRoom = true;
    onlineStatus.isAdmin = true;
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
    handleModalOpen,
    handleName,
    myName,
    isHost,
    handleAddress,
    roomId,
    handleSubmit,
  };
};

export default OnlineComponentVM;
