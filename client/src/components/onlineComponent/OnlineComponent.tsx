import React, { useEffect, useState } from "react";
import styles from "./onlineComponent.module.scss";
import { socket } from "../../Main";

const OnlineComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);

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
      socket.emit("create-room");
      return;
    }
    if (!roomId) return;
    socket.emit("join-room", { roomId });
  };

  useEffect(() => {
    socket.on("room-created", (roomId) => {
      console.log("Room ID to share:", roomId);
      setRoomId(roomId);
      setIsModalOpen(false);
      setConnected(true);
    });

    socket.on("user-joined", ({ guestId }) => {
      //empty for now
      console.log(guestId,"Has joined")
    });

    socket.on("joined-room", ({ roomId }) => {
      setRoomId(roomId);
      console.log("joined:", roomId);
      setIsModalOpen(false);
      socket.emit("request-state", { to: roomId });
      setConnected(true);
    });
    return () => {
      socket.off("room-created");
      socket.off("user-joined");
      socket.off("joined-room");
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
    </div>
  );
};

export default OnlineComponent;
