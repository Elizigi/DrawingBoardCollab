import React, { useEffect, useRef, useState } from "react";
import { onlineStatus, socket } from "../../Main";

interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
  guestId: string;
  color: string;
}

const OnlineComponentVM = (
  selfId: string,
  isHost: boolean,
  roomId: string,
  setConnected: (connected: boolean) => void,
  setOnlineWindowOpen: (windowOpen: boolean) => void,
  setRoomId: (roomId: string) => void
) => {
  const [myName, setMyName] = useState("");

  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const myNameRef = useRef("");

  const handleModalOpen = () => {
    setOnlineWindowOpen(false);
  };
  useEffect(() => {
    console.log(`users connected : ${JSON.stringify(connectedUsers)}`);
  }, [connectedUsers.length]);
  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setMyName(name);
  };

  const handleAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setRoomId(id);
  };

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
    handleModalOpen();

    setConnected(true);
  };

  const getRandomColor = (): string => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleUserJoined = ({
    name,
    guestId,
  }: {
    name: string;
    guestId: string;
  }) => {
    console.log(guestId, "Has joined");
    setConnectedUsers((prev) => [
      ...prev,
      { name, position: { x: 0, y: 0 }, guestId, color: getRandomColor() },
    ]);
    socket.emit("send-name", {
      name: myNameRef.current,
      userId: selfId,
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

  const handleJoinedRoom = ({ roomId }: { roomId: string }) => {
    setRoomId(roomId);
    onlineStatus.inRoom = true;

    console.log("joined:", roomId);
    document.dispatchEvent(new CustomEvent("clearCanvas"));
    socket.emit("request-state", { to: roomId });
    setConnected(true);
    handleModalOpen();
  };

  const handleUserMoved = ({ guestId, position }: ConnectedUser) => {
    setConnectedUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.guestId === guestId ? { ...user, position } : user
      )
    );
  };

  useEffect(() => {
    myNameRef.current = myName;
  }, [myName]);

  useEffect(() => {
    console.log(connectedUsers);
  }, [connectedUsers.length]);

  useEffect(() => {
    socket.on("room-created", handleRoomCreated);
    socket.on("user-joined", handleUserJoined);
    socket.on("add-name", handleAddName);
    socket.on("joined-room", handleJoinedRoom);
    socket.on("user-moved", handleUserMoved);

    return () => {
      socket.off("room-created", handleRoomCreated);
      socket.off("user-joined", handleUserJoined);
      socket.off("add-name", handleAddName);
      socket.off("joined-room", handleJoinedRoom);
      socket.off("user-moved", handleUserMoved);
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
    connectedUsers,
  };
};

export default OnlineComponentVM;
