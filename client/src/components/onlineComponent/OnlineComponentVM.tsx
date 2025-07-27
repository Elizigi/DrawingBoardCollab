import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../Main";

interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
}

const OnlineComponentVM = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myName, setMyName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const myNameRef = useRef("");

  const handleHost = () => {
    setIsHost(true);
    handleModalOpen();
  };

  const handleConnect = () => {
    setIsHost(false);
    handleModalOpen();
  };
  const handleModalOpen = () => {
    setIsModalOpen(!isModalOpen);
  };
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
      handleModalOpen();
      return;
    }
    if (!roomId) return;
    socket.emit("join-room", { roomId, name: myName });
    handleModalOpen();
  };

  const handleRoomCreated = (roomId: string) => {
    console.log("Room ID to share:", roomId);
    setRoomId(roomId);
    setConnected(true);
  };

  const handleUserJoined = ({
    name,
    guestId,
  }: {
    name: string;
    guestId: string;
  }) => {
    console.log(guestId, "Has joined");
    setConnectedUsers((prev) => [...prev, { name, position: { x: 0, y: 0 } }]);
    socket.emit("send-name", { name: myNameRef.current, guestId });
  };

  const handleAddName = ({ username }: { username: string }) => {
    console.log(username, "was in the room");
    setConnectedUsers((prev) => {
      const nameAlreadyIn = prev.some((user) => user.name === username);
      if (!nameAlreadyIn) {
        return [...prev, { name: username, position: { x: 0, y: 0 } }];
      }
      return prev;
    });
  };

  const handleJoinedRoom = ({ roomId }: { roomId: string }) => {
    setRoomId(roomId);
    console.log("joined:", roomId);
    socket.emit("request-state", { to: roomId });
    setConnected(true);
  };

  const handleUserMoved = ({ name, position }: ConnectedUser) => {
    setConnectedUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.name === name ? { ...user, position } : user
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
    handleHost,
    handleConnect,
    isModalOpen,
    handleModalOpen,
    handleName,
    myName,
    isHost,
    handleAddress,
    roomId,
    handleSubmit,
    connected,
    connectedUsers,
  };
};

export default OnlineComponentVM;
