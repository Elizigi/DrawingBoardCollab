import styles from "./TopRightToolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";
import TopRightToolbarVM from "./TopRightToolbarVM";
const TopRightToolbar = () => {
  const {
    isOnline,
    handleOnline,
    handleMenuOpen,
    handleAnim,
    hasInteracted,
    selfId,
  } = TopRightToolbarVM();

  return (
    <div className={styles.topRightToolContainer}>
      <div className={`${styles.subMenu} ${hasInteracted ? handleAnim() : ""}`}>
        {isOnline ? (
          <OnlineComponent selfId={selfId} />
        ) : (
          <button onClick={handleOnline} className={styles.onlineBtn}>
            <span>&#127760; Connect To Server</span>
          </button>
        )}
      </div>

      <button className={styles.topArrowMenu} onClick={handleMenuOpen}>
        <h3>∨</h3>
      </button>
    </div>
  );
};

export default TopRightToolbar;
