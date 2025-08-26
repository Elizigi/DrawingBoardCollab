import styles from "./TopRightToolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";
import TopRightToolbarVM from "./TopRightToolbarVM";
const TopRightToolbar = () => {
  const {
  isOnline,
    spinnerStyle,
    selfId,
    menuOpen,
    onlineWindowOpen,
    isHost,
    connected,
    setOnlineWindowOpen,
    setConnected,
    handleOnline,
    handleConnectionWindow
  } = TopRightToolbarVM();

  return (
    <div className={styles.topRightToolContainer}>
      {menuOpen && (
        <button
          onClick={() => handleConnectionWindow(true)}
          className={`${styles.HostButton} ${styles.connectionButtons}`}
        >
          Host
        </button>
      )}

      <button className={styles.topArrowMenu} onClick={handleOnline}>
        <span className={spinnerStyle}>🌐</span>
      </button>
      {menuOpen && (
        <button
          onClick={() => handleConnectionWindow()}
          className={`${styles.joinButton} ${styles.connectionButtons}`}
        >
          Join
        </button>
      )}
      {onlineWindowOpen && (
        <div className={`${styles.subMenu}`}>
          {isOnline ? (
            <OnlineComponent setOnlineWindowOpen={setOnlineWindowOpen}  setConnected={setConnected} connected={connected} isHost={isHost} selfId={selfId} />
          ) : (
            <button className={styles.onlineBtn}>
              <span>&#127760; Connect To Server</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TopRightToolbar;
