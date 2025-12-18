import styles from "./BrushScaleButtons.module.scss";
import BrushScaleButtonsMV from "./BrushScaleButtonsMV";

const BrushScaleButtons = () => {
  const { scaleUp, scaleDown } = BrushScaleButtonsMV();
  return (
    <div className={styles.scaleButtons}>
      <button
        className={`${styles.scaleButton} ${styles.scaleButtonPlus}`}
        onClick={scaleUp}
      >
        <img src="/assets/plus.svg" alt="plus" />
      </button>
      <button
        onClick={scaleDown}
        className={`${styles.scaleButton} ${styles.scaleButtonMinus}`}
      >
        <img src="/assets/minus.svg" alt="minus" />
      </button>
    </div>
  );
};

export default BrushScaleButtons;
