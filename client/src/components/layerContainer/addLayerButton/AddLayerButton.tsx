import styles from "./addLayerButton.module.scss";
import AddLayerButtonVM from "./AddLayerButtonVM";

const AddLayerButton = () => {
  const { updateText, handlePlusBtnClick, layerNameInputOpen, newLayerName } =
    AddLayerButtonVM();
  return (
    <div className={styles.addNewLayer}>
      <button className={styles.plusBTN} onClick={handlePlusBtnClick}>
        +
      </button>
      {layerNameInputOpen && (
        <input
          type="text"
          value={newLayerName}
          onChange={updateText}
          className={styles.layerNameInput}
        />
      )}
    </div>
  );
};

export default AddLayerButton;
