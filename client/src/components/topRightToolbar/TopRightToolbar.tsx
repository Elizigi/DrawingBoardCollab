import styles from "./TopRightToolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";
import TopRightToolbarVM from "./TopRightToolbarVM";
import CopyText from "./copyText/CopyText";
import GuestMouse from "../guestMouse/GuestMouse";
import UserList from "./userList/UserList";
import SettingScreen from "../settingsScreen/SettingScreen";

const TopRightToolbar = () => {
  const {
    // isOnline,
    // spinnerStyle,
    menuOpen,
    onlineWindowOpen,
    isHost,
    roomId,
    hideCode,
    error,
    connectedUsers,
    myNameRef,
    connected,
    isSettingsOpen,
    setIsSettingsOpen,
    setError,
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
     
      
      <button className={styles.menuIcon} onClick={() => handleOnline()}>
        <img src="/assets/cog.svg" alt="cog" />
      </button>
       {menuOpen && !connected && (
        <button
          onClick={() => handleConnectionWindow("host")}
          className={`${styles.HostButton} ${styles.connectionButtons}`}
        >
          Host
        </button>
      )}
      {menuOpen && connected && (
        <button
          onClick={() => handleLeaveRoom()}
          className={`${styles.HostButton} ${styles.connectionButtons}`}
        >
          Exit
        </button>
      )}
      {menuOpen && !connected && (
        <button
          onClick={() => handleConnectionWindow("guest")}
          className={`${styles.exitButton} ${styles.connectionButtons}`}
        >
          Join
        </button>
      )}
       {menuOpen && (
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`${styles.exitButton} ${styles.connectionButtons}`}
        >
          Canvas settings
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
      {isSettingsOpen && <SettingScreen close={setIsSettingsOpen} isOpen={isSettingsOpen} />}
      {onlineWindowOpen && (
        <div className={styles.subMenu}>
          <OnlineComponent
            myNameRef={myNameRef}
            setOnlineWindowOpen={setOnlineWindowOpen}
            setConnected={setConnected}
            connected={connected}
            isHost={isHost}
            roomId={roomId}
            setError={setError}
            error={error}
            setRoomId={setRoomId}
          />
        </div>
      )}
      {connectedUsers.map((user) => (
        <GuestMouse key={user.name} {...user} />
      ))}
      <UserList menuOpen={menuOpen} connectedUsers={connectedUsers} />
    </div>
  );
};

export default TopRightToolbar;
