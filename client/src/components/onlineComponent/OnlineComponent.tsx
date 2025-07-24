import React, { useEffect, useState } from "react";
import styles from "./onlineComponent.module.scss";
import { socket } from "../../Main";
import { useBrushStore } from "../../zustand/useBrushStore";

const OnlineComponent = () => {
  const brushStore = useBrushStore.getState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [roomAddress, setRoomAddress] = useState("");

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
    const name = e.target.value;
    setAddress(name);
  };

  const handleSubmit = () => {
    if (isHost) {
      socket.emit("create-room");
      return;
    }
    if (!address) return;
    socket.emit("join-room", { address });
  };

  useEffect(() => {
    socket.on("room-created", (roomId) => {
      console.log("Room ID to share:", roomId);
      setRoomAddress(roomId);
      setIsModalOpen(false);
    });
    socket.on("request-state", ({ from }) => {
      const state = brushStore;
      socket.emit("send-state", { to: from, state });
    });

    socket.on("user-joined", ({ guestId }) => {
      if (socket.id === guestId) {
        socket.emit("request-state", { to: address });
      }
    });

    socket.on("init", (state) => {
      for (const stroke of state.strokes) {
        stroke(stroke);
      }
    });
    socket.on("joined-room", ({ roomAddress }) => {
      setRoomAddress(roomAddress);
      setIsModalOpen(false);
    });
    return () => {
      socket.off("room-created");
      socket.off("request-state");
      socket.off("user-joined");
      socket.off("join-room");
      socket.off("init");
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
                  value={address}
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
        <h4>{roomAddress}</h4>
      </div>
    </div>
  );
};

export default OnlineComponent;
