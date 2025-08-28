import styles from "./TopRightToolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";
import TopRightToolbarVM from "./TopRightToolbarVM";
const TopRightToolbar = () => {
  const {
    spinnerStyle,
    selfId,
    menuOpen,
    onlineWindowOpen,
    isHost,
    connected,
    roomId,
    hideCode,
    setRoomId,
    setOnlineWindowOpen,
    setConnected,
    handleOnline,
    handleLeaveRoom,
    handleConnectionWindow,
    SetHideCode,
  } = TopRightToolbarVM();

  return (
    <div className={styles.topRightToolContainer}>
      {menuOpen && !connected && (
        <button
          onClick={() => handleConnectionWindow(true)}
          className={`${styles.HostButton} ${styles.connectionButtons}`}
        >
          Host
        </button>
      )}
      {menuOpen && connected && (
        <button
          onClick={() => handleLeaveRoom()}
          className={`${styles.HostButton} ${styles.connectionButtons}`}
          style={{ color: "red" }}
        >
          ⎋
        </button>
      )}
      <button className={styles.topArrowMenu} onClick={handleOnline}>
        <span className={spinnerStyle}>🌐</span>
      </button>
      {menuOpen && !connected && (
        <button
          onClick={() => handleConnectionWindow()}
          className={`${styles.joinButton} ${styles.connectionButtons}`}
        >
          Join
        </button>
      )}
      {menuOpen && connected && (
        <div className={styles.codeBar}>
          <button className={styles.handle} onClick={()=>SetHideCode(!hideCode)}>
            <h3>{hideCode?"◀":"▶"}</h3>
          </button>
          <div hidden={hideCode}className={styles.roomIdBar}>
            <h2>{roomId}</h2>
          </div>
          <div className={styles.handleEnd}>
            <h3>≣</h3>
          </div>
        </div>
      )}
      {onlineWindowOpen && (
        <div className={styles.subMenu}>
          <OnlineComponent
            setOnlineWindowOpen={setOnlineWindowOpen}
            setConnected={setConnected}
            connected={connected}
            isHost={isHost}
            selfId={selfId}
            roomId={roomId}
            setRoomId={setRoomId}
          />
        </div>
      )}
    </div>
  );
};

export default TopRightToolbar;
