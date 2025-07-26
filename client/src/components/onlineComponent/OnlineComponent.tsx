import React, { use, useEffect, useState } from "react";
import styles from "./onlineComponent.module.scss";
import { socket } from "../../Main";
import GuestMouse from "../guestMouse/GuestMouse";

interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
}

const OnlineComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const handleHost = () => {
    setIsHost(true);
    setIsModalOpen(true);
  };

  const handleConnect = () => {
    setIsHost(false);
    setIsModalOpen(true);
  };

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setName(name);
  };

  const handleAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setRoomId(id);
  };

  const handleSubmit = () => {
    if (isHost) {
      socket.emit("create-room", { name });
      return;
    }
    if (!roomId) return;
    socket.emit("join-room", { roomId, name });
  };

  useEffect(() => {
    socket.on("room-created", (roomId) => {
      console.log("Room ID to share:", roomId);
      setRoomId(roomId);
      setIsModalOpen(false);
      setConnected(true);
    });

    socket.on("user-joined", ({ name, guestId }) => {
      console.log(guestId, "Has joined");
      setConnectedUsers((prev) => [
        ...prev,
        { name, position: { x: 0, y: 0 } },
      ]);
      socket.emit("send-name", { name, guestId });
    });

    socket.on("add-name", ({ name }) => {
      setConnectedUsers((prev) => {
        const nameAlreadyIn = prev.some((user) => user.name === name);
        if (!nameAlreadyIn) {
          return [...prev, { name, position: { x: 0, y: 0 } }];
        }
        return prev;
      });
    });

    socket.on("joined-room", ({ roomId }) => {
      setRoomId(roomId);
      console.log("joined:", roomId);
      setIsModalOpen(false);
      socket.emit("request-state", { to: roomId });
      setConnected(true);
    });

    socket.on("user-moved", ({ name, position }) => {
      console.log("Looking for:", name);
      setConnectedUsers((prevUsers) => {
        console.log(
          "Current users:",
          prevUsers.map((u) => u.name)
        );
        return prevUsers.map((user) => {
          console.log(
            `Comparing "${user.name}" === "${name}":`,
            user.name === name
          );
          return user.name === name ? { ...user, position: position } : user;
        });
      });
    });
    return () => {
      socket.off("room-created");
      socket.off("user-joined");
      socket.off("joined-room");
      socket.off("user-moved");
    };
  }, []);

  return (
    <div className={styles.onlineContainer}>
      <div className={styles.onlineTitle}>
        <h3>online:</h3>
        <button className={styles.actionButton} onClick={handleHost}>
          Host
        </button>
        <button className={styles.actionButton} onClick={handleConnect}>
          Connect
        </button>
      </div>
      {isModalOpen && (
        <>
          <button
            className={styles.backGround}
            onClick={() => setIsModalOpen(false)}
          ></button>

          <div className={styles.modal}>
            <button
              className={styles.XBtn}
              onClick={() => setIsModalOpen(false)}
            >
              X
            </button>
            <h2>name</h2>
            <input
              type="text"
              name="name"
              onChange={handleName}
              value={name}
              required={!name.trim()}
            />
            {!isHost && (
              <>
                <h2>Connection Address</h2>
                <input
                  type="text"
                  onChange={handleAddress}
                  value={roomId}
                  required={!name.trim()}
                />
              </>
            )}
            <button onClick={handleSubmit} className={styles.submitBtn}>
              <h2> {isHost ? "Host" : "Connect"}</h2>
            </button>
          </div>
        </>
      )}
      <div className={styles.roomAddress}>
        <h3>Room Address</h3>
        <h4>{connected ? roomId : ""}</h4>
      </div>
      {connectedUsers.map((user) => (
        <GuestMouse key={user.name} {...user} />
      ))}
    </div>
  );
};

export default OnlineComponent;
