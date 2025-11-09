import style from "./SettingScreen.module.scss";
import SettingScreenMV from "./SettingScreenMV";

const SettingScreen = () => {
  const {
    canvasSizeValue,
    modalOpen,
    setModalOpen,
    setCanvasSize,
    setCanvasSizeValue,
  } = SettingScreenMV();
  return (
    <>
      <button className={style.settingIcon} onClick={() => setModalOpen(true)}>
        ⚙
      </button>
      {modalOpen && (
        <div className={style.openingContainer}>
          <div
            aria-label="toolbar"
            className={style.openingBackground}
            onPointerDown={() => setModalOpen(false)}
          ></div>
          <div className={style.openingModal}>
            <div className={style.inputContainer}>
              <h2>Canvas Size:</h2>
              <input
                onChange={(e) =>
                  setCanvasSizeValue({
                    ...canvasSizeValue,
                    height: Number(e.target.value),
                  })
                }
                type="number"
                value={canvasSizeValue.height}
                placeholder={`${canvasSizeValue.height}`}
              />
              <h2>px X </h2>
              <input
                type="number"
                onChange={(e) =>
                  setCanvasSizeValue({
                    ...canvasSizeValue,
                    width: Number(e.target.value),
                  })
                }
                value={canvasSizeValue.width}
                placeholder={`${canvasSizeValue.width}`}
              />
              <h2>px</h2>
            </div>
            <button onClick={setCanvasSize}>OKAY!</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingScreen;
