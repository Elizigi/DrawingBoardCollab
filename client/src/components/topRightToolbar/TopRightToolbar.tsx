import styles from "./TopRightToolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";
import TopRightToolbarVM from "./TopRightToolbarVM";
const TopRightToolbar = () => {
  const { isOnline, spinnerStyle, selfId, menuOpen, handleOnline } =
    TopRightToolbarVM();

  return (
    <div className={styles.topRightToolContainer}>
      <div className={`${styles.subMenu}`}>
        {isOnline ? (
          <OnlineComponent selfId={selfId} />
        ) : (
          <button className={styles.onlineBtn}>
            <span>&#127760; Connect To Server</span>
          </button>
        )}
      </div>
      {menuOpen && <button>Host</button>}

      <button className={styles.topArrowMenu} onClick={handleOnline}>
        <span className={spinnerStyle}>🌐</span>
      </button>
      {menuOpen && <button>Join</button>}
    </div>
  );
};

export default TopRightToolbar;
