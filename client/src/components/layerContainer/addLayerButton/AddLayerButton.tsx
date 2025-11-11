import styles from "./addLayerButton.module.scss";
import AddLayerButtonVM from "./AddLayerButtonVM";

const AddLayerButton = () => {
  const {
    layerNameInputOpen,
    newLayerName,
    updateText,
    handlePlusBtnClick,
    closeBar,
  } = AddLayerButtonVM();
  return (
    <div className={styles.addNewLayer}>
      {layerNameInputOpen && (
        <input
          type="text"
          value={newLayerName}
          onChange={updateText}
          autoFocus
          onBlur={closeBar}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePlusBtnClick();
            }
            if (e.key === "Escape") {
              closeBar();
            }
          }}
          className={styles.layerNameInput}
        />
      )}
      <button
        className={styles.plusBTN}
        onPointerDown={(e) => {
          e.preventDefault();
          handlePlusBtnClick();
        }}
      >
        +
      </button>
    </div>
  );
};

export default AddLayerButton;
