import styles from "./onlineComponent.module.scss";
import GuestMouse from "../guestMouse/GuestMouse";
import OnlineComponentVM from "./OnlineComponentVM";

const OnlineComponent = () => {
  const {
    handleHost,
    handleConnect,
    isModalOpen,
    handleModalOpen,
    handleName,
    myName,
    isHost,
    handleAddress,
    roomId,
    handleSubmit,
    connected,
    connectedUsers,
  } = OnlineComponentVM();
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
            onClick={() => handleModalOpen()}
          ></button>

          <div className={styles.modal}>
            <button className={styles.XBtn} onClick={() => handleModalOpen()}>
              X
            </button>
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
                <h2>Connection Address</h2>
                <input
                  type="text"
                  onChange={(e)=>handleAddress(e)}
                  value={roomId}
                  required={!roomId.trim()}
                />
              </>
            )}
            <button onClick={()=>handleSubmit()} className={styles.submitBtn}>
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
