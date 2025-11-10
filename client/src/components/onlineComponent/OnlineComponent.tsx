import styles from "./onlineComponent.module.scss";
import OnlineComponentVM from "./OnlineComponentVM";
import { FC, RefObject } from "react";

interface OnlineComponentProps {
  isHost: boolean;
  setConnected: (connected: boolean) => void;
  myNameRef: RefObject<string>;
  connected: boolean;
  setOnlineWindowOpen: (windowOpen: boolean) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  setError: (errorMessage: string) => void;
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
  setError,
  error,
}) => {
  const {
    myName,
    userLimitValue,
    setUserLimitValue,
    handleAddress,
    handleModalOpen,
    handleName,
    handleSubmit,
  } = OnlineComponentVM({
    isHost,
    roomId,
    myNameRef,
    connected,
    setError,
    setConnected,
    setOnlineWindowOpen,
    setRoomId,
  });
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
        maxLength={30}
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
            maxLength={10}
            required={!roomId.trim()}
          />
        </>
      )}
      {isHost && (
        <>
          <h2>User Limit:</h2>
          <input
            type="number"
            accept="number"
            min={2}
            max={20}
            onChange={(e) => setUserLimitValue(Number(e.target.value))}
            value={userLimitValue}
          />
        </>
      )}
      <h2>{error}</h2>

      <button onClick={() => handleSubmit()} className={styles.submitBtn}>
        <h2> {isHost ? "Host" : "Connect"}</h2>
      </button>
    </div>
  );
};

export default OnlineComponent;
