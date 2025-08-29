import styles from "./onlineComponent.module.scss";
import GuestMouse from "../guestMouse/GuestMouse";
import OnlineComponentVM from "./OnlineComponentVM";
import { FC } from "react";

interface OnlineComponentProps {
  selfId: string;
  isHost: boolean;
  setConnected: (connected: boolean) => void;
  connected: boolean;
  setOnlineWindowOpen: (windowOpen: boolean) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  error:string;
}

const OnlineComponent: FC<OnlineComponentProps> = ({
  selfId,
  isHost,
  setConnected,
  setOnlineWindowOpen,
  roomId,
  setRoomId,
  error,
}) => {
  const {
    handleModalOpen,
    handleName,
    myName,
    handleAddress,
    handleSubmit,
    connectedUsers,
  } = OnlineComponentVM(
    selfId,
    isHost,
    roomId,
    setConnected,
    setOnlineWindowOpen,
    setRoomId
  );
  return (
    <div className={styles.onlineContainer}>
      <button className={styles.XBtn} onClick={() => handleModalOpen()}>
        X
      </button>
      <h1> {isHost ? "Host" : "Join"}</h1>
      <hr />
      <h2>name</h2>
      <input
        type="text"
        name="name"
        onChange={handleName}
        value={myName}
        required={!myName.trim()}
      />
      {!isHost && (
        <>
          <h2>Room Code</h2>
          <input
            type="text"
            onChange={(e) => handleAddress(e)}
            value={roomId}
            required={!roomId.trim()}
          />
          <h2>{error}</h2>
        </>
      )}
      <button onClick={() => handleSubmit()} className={styles.submitBtn}>
        <h2> {isHost ? "Host" : "Connect"}</h2>
      </button>

      {connectedUsers.length > 0 && (
        <>
          <h3>Users in the Room:</h3>
          {connectedUsers.map((user) => (
            <button className={styles.guestIcon} key={user.guestId}>
              <div
                className={styles.userColorIcon}
                style={{ backgroundColor: user.color }}
              ></div>
              {user.name}
            </button>
          ))}
        </>
      )}
      {connectedUsers.map((user) => (
        <GuestMouse key={user.name} {...user} />
      ))}
    </div>
  );
};

export default OnlineComponent;
