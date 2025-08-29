import styles from "./TopRightToolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";
import TopRightToolbarVM from "./TopRightToolbarVM";
import CopyText from "./copyText/CopyText";
import LeaveButton from "./leaveButton/LeaveButton";
import InternetIcon from "./internetIcon/InternetIcon";
const TopRightToolbar = () => {
  const {
    isOnline,
    spinnerStyle,
    selfId,
    menuOpen,
    onlineWindowOpen,
    isHost,
    connected,
    roomId,
    hideCode,
    error,
    setRoomId,
    setOnlineWindowOpen,
    setConnected,
    handleOnline,
    handleLeaveRoom,
    handleConnectionWindow,
    setHideCode,
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
        <LeaveButton handleLeaveRoom={handleLeaveRoom} />
      )}
      <button className={styles.netMenu} onClick={() => handleOnline()}>
        <InternetIcon connected={isOnline} spinnerStyle={spinnerStyle} />
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
          <button
            className={styles.handle}
            onClick={() => setHideCode(!hideCode)}
          >
            <h3>{hideCode ? "◀" : "▶"}</h3>
          </button>
          <div hidden={hideCode} className={styles.roomIdBar}>
            <h2>{roomId}</h2>
          </div>
          <CopyText roomId={roomId} />
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
            error={error}
            setRoomId={setRoomId}
          />
        </div>
      )}
    </div>
  );
};

export default TopRightToolbar;
