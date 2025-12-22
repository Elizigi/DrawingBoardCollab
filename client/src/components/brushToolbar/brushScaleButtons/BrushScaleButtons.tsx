import styles from "./BrushScaleButtons.module.scss";
import BrushScaleButtonsMV from "./BrushScaleButtonsMV";

const BrushScaleButtons = () => {
  const { stopScaling, startScaleDown, startScaleUp, scaleUp, scaleDown } =
    BrushScaleButtonsMV();
  return (
    <div className={styles.scaleButtons}>
      <button
        className={`${styles.scaleButton} ${styles.scaleButtonPlus}`}
        onClick={scaleUp}
        onPointerDown={startScaleUp}
        onPointerUp={stopScaling}
        onPointerLeave={stopScaling}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img src="/assets/plus.svg" alt="plus" />
      </button>
      <button
        onClick={scaleDown}
        onPointerDown={startScaleDown}
        onPointerUp={stopScaling}
        onPointerLeave={stopScaling}
        className={`${styles.scaleButton} ${styles.scaleButtonMinus}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img src="/assets/minus.svg" alt="minus" />
      </button>
    </div>
  );
};

export default BrushScaleButtons;
