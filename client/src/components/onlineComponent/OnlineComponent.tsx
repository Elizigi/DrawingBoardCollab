import styles from "./onlineComponent.module.scss";
import OnlineComponentVM from "./OnlineComponentVM";
import { FC, RefObject } from "react";

interface OnlineComponentProps {
  isHost: boolean;
  setConnected: (connected: boolean) => void;
  myNameRef: RefObject<string>;
  connected:boolean;
  setOnlineWindowOpen: (windowOpen: boolean) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  error: string;
}

const OnlineComponent: FC<OnlineComponentProps> = ({
  isHost,
  setConnected,
  setOnlineWindowOpen,
  roomId,
  connected,
  myNameRef,
  setRoomId,
  error,
}) => {
  const { handleName, myName, handleAddress, handleModalOpen, handleSubmit } =
    OnlineComponentVM(
      isHost,
      roomId,
      myNameRef,
      connected,
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
    </div>
  );
};

export default OnlineComponent;
